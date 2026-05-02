import { auth } from "../../lib/auth.js";
import { fromNodeHeaders } from "better-auth/node";
import { IncomingHttpHeaders } from "http";
import { Prisma, userStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import status from "http-status";
import AppError from "../../errorHelpers/appError.js";
import { tokenUtils } from "../../utils/token.js";
import { IchanegPasswordPayload } from "./auth.interface.js";
import { jwtUtils } from "../../utils/jwt.js";
import { envVars } from "../../../config/env.js";
import { JwtPayload } from "jsonwebtoken";
import { otpUtils } from "../../utils/otp.js";
import { sendEmail } from "../../utils/email.js";
import crypto from "crypto";

interface IRegisterCustomerPayload {
  name: string;
  email: string;
  password: string;
  age?: number;
  address?: string;
  contact?: string;
}

interface ILoginUserPayload {
  email: string;
  password: string;
}

interface IUpdateCustomerPayload {
  name?: string;
  email?: string;
  age?: number;
  address?: string;
  contact?: string;
}

const ensureNotGoogleUserByUserId = async (userId: string) => {
  const googleAccount = await prisma.account.findFirst({
    where: { userId, providerId: "google" },
    select: { id: true },
  });
  if (googleAccount) {
    throw new AppError("Google login users cannot use this route.", status.FORBIDDEN);
  }
};

const ensureNotGoogleUserByEmail = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return;
  await ensureNotGoogleUserByUserId(user.id);
};

const register = async (payload: IRegisterCustomerPayload, requestHeaders: IncomingHttpHeaders) => {
  const { name, email, password, age, address, contact } = payload;

  if (age !== undefined && (!Number.isInteger(age) || age <= 0)) {
    throw new AppError("Valid age is required to create customer profile", status.BAD_REQUEST);
  }
  if (address !== undefined && !address.trim()) {
    throw new AppError("Address cannot be empty", status.BAD_REQUEST);
  }

  const data = await auth.api.signUpEmail({
    body: { name, email, password },
    headers: fromNodeHeaders(requestHeaders),
  } as any) as any;

  if (!data?.user) {
    throw new AppError("Failed to create user", status.INTERNAL_SERVER_ERROR);
  }

  try {
    const customer = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      return tx.customer.create({
        data: {
          name,
          email,
          ...(age !== undefined ? { age } : {}),
          ...(address !== undefined ? { address: address.trim() } : {}),
          ...(contact !== undefined ? { contact } : {}),
          user: { connect: { id: data.user.id } },
        },
      });
    });

    const accessToken = tokenUtils.getAccessToken({
      userId: data.user.id, email: data.user.email, role: data.user.role,
      status: data.user.status, isDeleted: data.user.isdeleted, emailVerified: data.user.emailVerified,
    });
    const refreshToken = tokenUtils.getRefreshToken({
      userId: data.user.id, email: data.user.email, role: data.user.role,
      status: data.user.status, isDeleted: data.user.isdeleted, emailVerified: data.user.emailVerified,
    });

    return { data: { ...data, customer, accessToken, refreshToken } };
  } catch {
    await prisma.user.delete({ where: { id: data.user.id } }).catch(() => undefined);
    throw new AppError("Failed to create customer profile", status.INTERNAL_SERVER_ERROR);
  }
};

const LoginUser = async (payload: ILoginUserPayload) => {
  const { email, password } = payload;
  const data = await auth.api.signInEmail({ body: { email, password } });

  if (!data?.user) throw new AppError("Failed to login user", status.UNAUTHORIZED);
  if (data.user.status === userStatus.INACTIVE) throw new AppError("User account is inactive. Please contact support.", status.FORBIDDEN);
  if (data.user.status === userStatus.DELETED || data.user.isdeleted) throw new AppError("User account is deleted. Please contact support.", status.FORBIDDEN);

  const accessToken = tokenUtils.getAccessToken({
    userId: data.user.id, email: data.user.email, role: data.user.role,
    status: data.user.status, isDeleted: data.user.isdeleted, emailVerified: data.user.emailVerified,
  });
  const refreshToken = tokenUtils.getRefreshToken({
    userId: data.user.id, email: data.user.email, role: data.user.role,
    status: data.user.status, isDeleted: data.user.isdeleted, emailVerified: data.user.emailVerified,
  });

  return { ...data, accessToken, refreshToken };
};

const updateCustomer = async (id: number, payload: IUpdateCustomerPayload) => {
  const customerExist = await prisma.customer.findUnique({
    where: { id },
    include: { user: { select: { id: true } } },
  });

  if (!customerExist) throw new AppError("Customer not found", status.NOT_FOUND);
  if (customerExist.isDeleted) throw new AppError("Cannot update a deleted customer", status.BAD_REQUEST);

  if (payload.email) {
    const emailAlreadyInUse = await prisma.customer.findFirst({
      where: { email: payload.email, id: { not: id } },
      select: { id: true },
    });
    if (emailAlreadyInUse) throw new AppError("Customer email already exists", status.CONFLICT);
  }

  const updatedCustomer = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const customer = await tx.customer.update({
      where: { id },
      data: { name: payload.name, email: payload.email, age: payload.age, address: payload.address?.trim(), contact: payload.contact },
    });
    if (customerExist.user?.id) {
      await tx.user.update({ where: { id: customerExist.user.id }, data: { name: payload.name, email: payload.email } });
    }
    return customer;
  });

  return updatedCustomer;
};

const changePassword = async (payload: IchanegPasswordPayload, sessionToken: string) => {
  const session = await auth.api.getSession({ headers: new Headers({ Authorization: `Bearer ${sessionToken}` }) });
  if (!session) throw new AppError("Invalid session token", status.UNAUTHORIZED);
  await ensureNotGoogleUserByUserId(session.user.id);

  const { currentPassword, newPassword } = payload;
  const result = await auth.api.changePassword({
    body: { currentPassword, newPassword, revokeOtherSessions: true },
    headers: new Headers({ Authorization: `Bearer ${sessionToken}` }),
  });

  if (session.user.needsPasswordReset) {
    await prisma.user.update({ where: { id: session.user.id }, data: { needsPasswordReset: false } });
  }

  const accessToken = tokenUtils.getAccessToken({
    userId: session.user.id, role: session.user.role, name: session.user.name,
    email: session.user.email, status: session.user.status, isDeleted: session.user.isdeleted, emailVerified: session.user.emailVerified,
  });
  const refreshToken = tokenUtils.getRefreshToken({
    userId: session.user.id, role: session.user.role, name: session.user.name,
    email: session.user.email, status: session.user.status, isDeleted: session.user.isdeleted, emailVerified: session.user.emailVerified,
  });

  return { ...result, accessToken, refreshToken };
};

const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { customer: true, staff: true },
  });
  if (!user) throw new AppError("User not found", status.NOT_FOUND);
  return user;
};

const getNewToken = async (refreshToken: string, sessionToken: string) => {
  const isSessionTokenExists = await prisma.session.findUnique({
    where: { token: sessionToken },
    include: { user: true },
  });
  if (!isSessionTokenExists) throw new AppError("Invalid session token", status.UNAUTHORIZED);

  const verifiedRefreshToken = jwtUtils.verifyToken(refreshToken, envVars.REFRESH_TOKEN_SECRET);
  if (!verifiedRefreshToken.success && verifiedRefreshToken.error) throw new AppError("Invalid refresh token", status.UNAUTHORIZED);

  const data = verifiedRefreshToken.data as JwtPayload;
  const newAccessToken = tokenUtils.getAccessToken({ userId: data.userId, role: data.role, name: data.name, email: data.email, status: data.status, isDeleted: data.isDeleted, emailVerified: data.emailVerified });
  const newRefreshToken = tokenUtils.getRefreshToken({ userId: data.userId, role: data.role, name: data.name, email: data.email, status: data.status, isDeleted: data.isDeleted, emailVerified: data.emailVerified });

  const { token } = await prisma.session.update({
    where: { token: sessionToken },
    data: { token: sessionToken, expiresAt: new Date(Date.now() + 60 * 60 * 60 * 24 * 1000), updatedAt: new Date() },
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken, sessionToken: token };
};

const logoutUser = async (sessionToken: string) => {
  return await auth.api.signOut({ headers: new Headers({ Authorization: `Bearer ${sessionToken}` }) });
};

// Generate OTP and save to database
const generateAndSaveOTP = async (email: string, expiryMinutes: number = 10) => {
  const otp = otpUtils.generateOTP();
  const otpExpiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
  
  console.log("🔐 [OTP GENERATION] Email:", email);
  console.log("🔐 [OTP GENERATION] Generated OTP:", otp);
  
  // Save OTP to database
  await prisma.user.update({
    where: { email },
    data: { otp, otpExpiresAt },
  });
  
  console.log("🔐 [OTP GENERATION] Saved to database successfully");
  
  return otp;
};

// Verify OTP from database
const verifyOTPFromDatabase = async (email: string, otp: string): Promise<boolean> => {
  console.log("\n🔍 [OTP VERIFICATION START]");
  console.log("🔍 Email:", email);
  console.log("🔍 Input OTP:", otp);
  
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    throw new AppError("User not found", status.NOT_FOUND);
  }
  
  if (!user.otp) {
    throw new AppError("OTP not found or expired", status.BAD_REQUEST);
  }
  
  if (user.otpExpiresAt && user.otpExpiresAt < new Date()) {
    console.log("❌ OTP has expired");
    await prisma.user.update({
      where: { email },
      data: { otp: null, otpExpiresAt: null },
    });
    throw new AppError("OTP has expired", status.BAD_REQUEST);
  }
  
  // Convert both to numbers for comparison
  const inputOTPNumber = parseInt((otp || "").trim(), 10);
  const storedOTPNumber = parseInt((user.otp || "").trim(), 10);
  
  console.log("\n🔍 [COMPARISON AS NUMBERS]");
  console.log("🔍 Input OTP Number:", inputOTPNumber);
  console.log("🔍 Stored OTP Number:", storedOTPNumber);
  console.log("Match Result:", storedOTPNumber === inputOTPNumber);
  
  if (isNaN(inputOTPNumber) || isNaN(storedOTPNumber)) {
    throw new AppError("Invalid OTP format", status.BAD_REQUEST);
  }
  
  if (storedOTPNumber !== inputOTPNumber) {
    console.log("❌ OTP MISMATCH!");
    throw new AppError("Invalid OTP", status.BAD_REQUEST);
  }
  
  console.log("✅ OTP MATCH! Clearing from database...");
  
  // Clear OTP after successful verification
  await prisma.user.update({
    where: { email },
    data: { otp: null, otpExpiresAt: null },
  });
  
  console.log("✅ OTP cleared from database\n");
  
  return true;
};

const verifyEmail = async (email: string, otp: string) => {
  await ensureNotGoogleUserByEmail(email);
  await verifyOTPFromDatabase(email, otp);
  await prisma.user.update({ where: { email }, data: { emailVerified: true } });
};

const forgetPassword = async (email: string) => {
  if (!email || !email.trim()) throw new AppError("Email is required", status.BAD_REQUEST);
  await ensureNotGoogleUserByEmail(email);
  const isUserExist = await prisma.user.findUnique({ where: { email } });
  if (!isUserExist) throw new AppError("User not found", status.NOT_FOUND);
  if (!isUserExist.emailVerified) throw new AppError("Email not verified", status.BAD_REQUEST);
  if (isUserExist.isdeleted || isUserExist.status === userStatus.DELETED) throw new AppError("User not found", status.NOT_FOUND);

  const otp = await generateAndSaveOTP(email);

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await prisma.verification.create({
    data: { id: crypto.randomUUID(), identifier: email, value: otp, expiresAt },
  });

  // Send simple text email - Frontend handles template display
  void sendEmail({
    to: email,
    subject: "Password Reset OTP",
    text: `Your password reset OTP is: ${otp}\n\nThis OTP will expire in 10 minutes.`,
  });

  if (envVars.NODE_ENV === "production") {
    return { email, message: "Password reset OTP sent to email successfully" };
  }

  return { otp, email, message: "Password reset OTP generated successfully. Use this OTP to reset your password." };
};

const resetPassword = async (email: string, otp: string, newPassword: string) => {
  if (!email || !email.trim()) throw new AppError("Email is required", status.BAD_REQUEST);
  if (!otp || !otp.trim()) throw new AppError("OTP is required", status.BAD_REQUEST);
  if (!newPassword || !newPassword.trim()) throw new AppError("New password is required", status.BAD_REQUEST);
  await ensureNotGoogleUserByEmail(email);

  const isUserExist = await prisma.user.findUnique({ where: { email } });
  if (!isUserExist) throw new AppError("User not found", status.NOT_FOUND);
  if (!isUserExist.emailVerified) throw new AppError("Email not verified", status.BAD_REQUEST);
  if (isUserExist.isdeleted || isUserExist.status === userStatus.DELETED) throw new AppError("User not found", status.NOT_FOUND);

  await verifyOTPFromDatabase(email, otp);

  await auth.api.resetPasswordEmailOTP({ body: { email, otp, password: newPassword } });

  if (isUserExist.needsPasswordReset) {
    await prisma.user.update({ where: { id: isUserExist.id }, data: { needsPasswordReset: false } });
  }
  await prisma.session.deleteMany({ where: { userId: isUserExist.id } });
};

const googleLoginSuccess = async (session: Record<string, any>) => {
  const isCustomerExists = await prisma.customer.findUnique({ where: { userID: session.user.id } });
  if (!isCustomerExists) {
    await prisma.customer.create({ data: { userID: session.user.id, name: session.user.name, email: session.user.email } });
  }

  const accessToken = tokenUtils.getAccessToken({ userId: session.user.id, role: session.user.role, name: session.user.name });
  const refreshToken = tokenUtils.getRefreshToken({ userId: session.user.id, role: session.user.role, name: session.user.name });
  return { accessToken, refreshToken };
};

const requestEmailVerificationOTP = async (email: string) => {
  if (!email || !email.trim()) throw new AppError("Email is required", status.BAD_REQUEST);
  const isUserExist = await prisma.user.findUnique({ where: { email } });
  if (!isUserExist) throw new AppError("User not found", status.NOT_FOUND);
  if (isUserExist.emailVerified) throw new AppError("Email is already verified", status.BAD_REQUEST);
  if (isUserExist.isdeleted || isUserExist.status === userStatus.DELETED) throw new AppError("User not found", status.NOT_FOUND);

  const otp = await generateAndSaveOTP(email);

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await prisma.verification.create({ data: { id: crypto.randomUUID(), identifier: email, value: otp, expiresAt } });

  // Send simple text email - Frontend handles template display
  void sendEmail({ 
    to: email, 
    subject: "Verify your email",
    text: `Your email verification OTP is: ${otp}\n\nThis OTP will expire in 10 minutes.`
  });

  if (envVars.NODE_ENV === "production") {
    return { email, message: "OTP sent to email for verification" };
  }

  return { otp, email, message: "OTP generated successfully. Use this OTP to verify your email. (Valid for 10 minutes)" };
};

const requestPasswordResetOTPDirect = async (email: string) => {
  if (!email || !email.trim()) throw new AppError("Email is required", status.BAD_REQUEST);
  await ensureNotGoogleUserByEmail(email);
  const isUserExist = await prisma.user.findUnique({ where: { email } });
  if (!isUserExist) throw new AppError("User not found", status.NOT_FOUND);
  if (!isUserExist.emailVerified) throw new AppError("Email not verified", status.BAD_REQUEST);
  if (isUserExist.isdeleted || isUserExist.status === userStatus.DELETED) throw new AppError("User not found", status.NOT_FOUND);

  const otp = await generateAndSaveOTP(email);

  return { otp, email, message: "Password reset OTP generated. Use this OTP to reset your password." };
};

export const authService = {
  register, LoginUser, updateCustomer, changePassword, getNewToken, getMe,
  logoutUser, verifyEmail, forgetPassword, resetPassword, googleLoginSuccess,
  requestEmailVerificationOTP, requestPasswordResetOTPDirect,
};
