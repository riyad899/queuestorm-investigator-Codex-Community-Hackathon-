import { auth } from "../../lib/auth.js";
import { fromNodeHeaders } from "better-auth/node";
import { hashPassword } from "better-auth/crypto";
import { IncomingHttpHeaders } from "http";
import { userStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import status from "http-status";
import AppError from "../../errorHelpers/appError.js";
import { tokenUtils } from "../../utils/token.js";
import { IchanegPasswordPayload } from "./auth.interface.js";
import { jwtUtils } from "../../utils/jwt.js";
import { envVars } from "../../../config/env.js";
import { JwtPayload } from "jsonwebtoken";
import { otpUtils } from "../../utils/otp.js";
import crypto from "crypto";

interface IRegisterUserPayload {
  name: string;
  email: string;
  password: string;
}

interface ILoginUserPayload {
  email: string;
  password: string;
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

const register = async (payload: IRegisterUserPayload, requestHeaders: IncomingHttpHeaders) => {
  const { name, email, password } = payload;

  const data = await auth.api.signUpEmail({
    body: { name, email, password },
    headers: fromNodeHeaders(requestHeaders),
  } as any) as any;

  if (!data?.user) {
    throw new AppError("Failed to create user", status.INTERNAL_SERVER_ERROR);
  }

  const accessToken = tokenUtils.getAccessToken({
    userId: data.user.id, email: data.user.email, role: data.user.role,
    status: data.user.status, isDeleted: data.user.isdeleted, emailVerified: data.user.emailVerified,
  });
  const refreshToken = tokenUtils.getRefreshToken({
    userId: data.user.id, email: data.user.email, role: data.user.role,
    status: data.user.status, isDeleted: data.user.isdeleted, emailVerified: data.user.emailVerified,
  });

  return { data: { ...data, accessToken, refreshToken } };
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
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError("User not found", status.NOT_FOUND);
  return user;
};

const getNewTokenFromRefresh = async (refreshToken: string) => {
  const verifiedRefreshToken = jwtUtils.verifyToken(refreshToken, envVars.REFRESH_TOKEN_SECRET);
  if (!verifiedRefreshToken.success || !verifiedRefreshToken.data) {
    throw new AppError("Invalid refresh token", status.UNAUTHORIZED);
  }

  const data = verifiedRefreshToken.data as JwtPayload;

  const user = await prisma.user.findUnique({
    where: { id: data.userId },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      isdeleted: true,
    },
  });

  if (!user || user.status === userStatus.BLOCKED || user.status === userStatus.DELETED || user.isdeleted) {
    throw new AppError("User account is inactive or deleted.", status.UNAUTHORIZED);
  }

  const newAccessToken = tokenUtils.getAccessToken({
    userId: user.id,
    role: user.role,
    name: data.name,
    email: user.email,
    status: user.status,
    isDeleted: user.isdeleted,
    emailVerified: data.emailVerified,
  });

  const newRefreshToken = tokenUtils.getRefreshToken({
    userId: user.id,
    role: user.role,
    name: data.name,
    email: user.email,
    status: user.status,
    isDeleted: user.isdeleted,
    emailVerified: data.emailVerified,
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

const logoutUser = async (sessionToken: string) => {
  return await auth.api.signOut({ headers: new Headers({ Authorization: `Bearer ${sessionToken}` }) });
};

const generateAndSaveOTP = async (email: string, expiryMinutes: number = 10) => {
  const otp = otpUtils.generateOTP();
  const otpExpiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

  await prisma.user.update({
    where: { email },
    data: { otp, otpExpiresAt },
  });

  return otp;
};

const verifyOTPFromDatabase = async (email: string, otp: string): Promise<boolean> => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new AppError("User not found", status.NOT_FOUND);
  }

  if (!user.otp) {
    throw new AppError("OTP not found or expired", status.BAD_REQUEST);
  }

  if (user.otpExpiresAt && user.otpExpiresAt < new Date()) {
    await prisma.user.update({
      where: { email },
      data: { otp: null, otpExpiresAt: null },
    });
    throw new AppError("OTP has expired", status.BAD_REQUEST);
  }

  const inputOTPNumber = parseInt((otp || "").trim(), 10);
  const storedOTPNumber = parseInt((user.otp || "").trim(), 10);

  if (isNaN(inputOTPNumber) || isNaN(storedOTPNumber)) {
    throw new AppError("Invalid OTP format", status.BAD_REQUEST);
  }

  if (storedOTPNumber !== inputOTPNumber) {
    throw new AppError("Invalid OTP", status.BAD_REQUEST);
  }

  await prisma.user.update({
    where: { email },
    data: { otp: null, otpExpiresAt: null },
  });

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

  const hashedPassword = await hashPassword(newPassword);
  await prisma.account.updateMany({
    where: { userId: isUserExist.id, providerId: "credential" },
    data: { password: hashedPassword },
  });

  if (isUserExist.needsPasswordReset) {
    await prisma.user.update({ where: { id: isUserExist.id }, data: { needsPasswordReset: false } });
  }
  await prisma.session.deleteMany({ where: { userId: isUserExist.id } });
};

const googleLoginSuccess = async (session: Record<string, any>) => {
  const accessToken = tokenUtils.getAccessToken({
    userId: session.user.id,
    role: session.user.role,
    name: session.user.name,
  });

  const refreshToken = tokenUtils.getRefreshToken({
    userId: session.user.id,
    role: session.user.role,
    name: session.user.name,
  });

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
  register, LoginUser, changePassword, getNewTokenFromRefresh, getMe,
  logoutUser, verifyEmail, forgetPassword, resetPassword, googleLoginSuccess,
  requestEmailVerificationOTP, requestPasswordResetOTPDirect,
};