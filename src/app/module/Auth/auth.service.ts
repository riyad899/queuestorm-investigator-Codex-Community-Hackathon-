
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
import * as bcrypt from "better-auth/crypto";

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

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError("Email already registered", status.CONFLICT);
  }

  try {
    // Hash password
    const hashedPassword = await bcrypt.hashPassword(password);

    // Create user and account in a transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create the user
      const newUser = await tx.user.create({
        data: {
          id: crypto.randomUUID?.() || Math.random().toString(),
          name,
          email,
          role: "CUSTOMER" as any,
          status: "ACTIVE" as any,
        },
      });

      // Create the account with password
      await tx.account.create({
        data: {
          id: crypto.randomUUID?.() || Math.random().toString(),
          userId: newUser.id,
          accountId: newUser.id,
          providerId: "credential",
          password: hashedPassword,
        },
      });

      // Create the customer profile
      const customer = await tx.customer.create({
        data: {
          name,
          email,
          ...(age !== undefined ? { age } : {}),
          ...(address !== undefined ? { address: address.trim() } : {}),
          ...(contact !== undefined ? { contact } : {}),
          user: { connect: { id: newUser.id } },
        },
      });

      return { user: newUser, customer };
    });

    const accessToken = tokenUtils.getAccessToken({
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role,
      status: result.user.status,
      isDeleted: result.user.isdeleted,
      emailVerified: result.user.emailVerified,
    });
    const refreshToken = tokenUtils.getRefreshToken({
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role,
      status: result.user.status,
      isDeleted: result.user.isdeleted,
      emailVerified: result.user.emailVerified,
    });

    return {
      data: {
        user: result.user,
        customer: result.customer,
        accessToken,
        refreshToken,
        token: "",
      },
    };
  } catch (error: any) {
    if (error?.code === "P2002") {
      throw new AppError("Email already registered", status.CONFLICT);
    }
    throw new AppError("Failed to create user account", status.INTERNAL_SERVER_ERROR);
  }
};

const LoginUser = async (payload: ILoginUserPayload) => {
  const { email, password } = payload;

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError("Invalid email or password", status.UNAUTHORIZED);
  }

  // Find the password account for this user
  const account = await prisma.account.findFirst({
    where: { 
      userId: user.id,
      providerId: "credential",
    },
  });

  if (!account || !account.password) {
    throw new AppError("Invalid email or password", status.UNAUTHORIZED);
  }

  // Verify password using better-auth's crypto
  const isPasswordValid = await bcrypt.verifyPassword({
    hash: account.password,
    password,
  });

  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", status.UNAUTHORIZED);
  }

  // Check user status
  if (user.status === userStatus.INACTIVE) {
    throw new AppError("User account is inactive. Please contact support.", status.FORBIDDEN);
  }
  if (user.status === userStatus.DELETED || user.isdeleted) {
    throw new AppError("User account is deleted. Please contact support.", status.FORBIDDEN);
  }

  // Generate tokens
  const accessToken = tokenUtils.getAccessToken({
    userId: user.id, 
    email: user.email, 
    role: user.role,
    status: user.status, 
    isDeleted: user.isdeleted, 
    emailVerified: user.emailVerified,
  });
  const refreshToken = tokenUtils.getRefreshToken({
    userId: user.id, 
    email: user.email, 
    role: user.role,
    status: user.status, 
    isDeleted: user.isdeleted, 
    emailVerified: user.emailVerified,
  });

  return { 
    user,
    accessToken, 
    refreshToken,
    token: "", // better-auth session token
  };
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

const verifyEmail = async (email: string, otp: string) => {
  await ensureNotGoogleUserByEmail(email);
  const result = await auth.api.verifyEmailOTP({ body: { email, otp } });
  if (result.status && !result.user.emailVerified) {
    await prisma.user.update({ where: { email }, data: { emailVerified: true } });
  }
};

const forgetPassword = async (email: string) => {
  if (!email || !email.trim()) throw new AppError("Email is required", status.BAD_REQUEST);
  await ensureNotGoogleUserByEmail(email);
  const isUserExist = await prisma.user.findUnique({ where: { email } });
  if (!isUserExist) throw new AppError("User not found", status.NOT_FOUND);
  if (!isUserExist.emailVerified) throw new AppError("Email not verified", status.BAD_REQUEST);
  if (isUserExist.isdeleted || isUserExist.status === userStatus.DELETED) throw new AppError("User not found", status.NOT_FOUND);
  await auth.api.requestPasswordResetEmailOTP({ body: { email } });
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

export const authService = {
  register, LoginUser, updateCustomer, changePassword, getNewToken, getMe,
  logoutUser, verifyEmail, forgetPassword, resetPassword, googleLoginSuccess,
};