import status from "http-status";
import catchAsync from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { authService } from "./auth.service.js";
import AppError from "../../errorHelpers/appError.js";
import { tokenUtils } from "../../utils/token.js";
import { Request, Response } from "express";
import { CookieUtils } from "../../utils/cookie.js";
import { envVars } from "../../../config/env.js";
import { auth } from "../../lib/auth.js";

const getFrontendBaseUrl = (req: Request) => {
  const originCandidates = [req.headers.origin, req.headers.referer];

  for (const candidate of originCandidates) {
    if (typeof candidate !== "string" || candidate.length === 0) {
      continue;
    }

    try {
      return new URL(candidate).origin;
    } catch {
      continue;
    }
  }

  return envVars.FRONTEND_URL;
};

const register = catchAsync(async (req, res) => {
  const { name, email, password, age, address, contact } = req.body;
  const result = await authService.register(
    {
      name,
      email,
      password,
      age: age !== undefined ? Number(age) : undefined,
      address,
      contact,
    },
    req.headers
  );
  const { accessToken, refreshToken, token } = result.data;

  tokenUtils.setAccessTokenCookie(res, accessToken);
  tokenUtils.setRefreshTokenCookie(res, refreshToken);
  if (typeof token === "string" && token.length > 0) {
    tokenUtils.setBetterAuthSessionCookie(res, token);
  }
  res.clearCookie("better-auth.session_data", { path: "/" });

  sendResponse(res, {
    httpStatus: status.CREATED,
    success: true,
    message: "User registered successfully",
    data: result.data,
  });
});

const LoginUser = catchAsync(async (req, res) => {
  const payload = req.body;
  const result = await authService.LoginUser(payload);
  const { accessToken, refreshToken, token, ...rest } = result;

  tokenUtils.setAccessTokenCookie(res, accessToken);
  tokenUtils.setRefreshTokenCookie(res, refreshToken);
  tokenUtils.setBetterAuthSessionCookie(res, token);
  res.clearCookie("better-auth.session_data", { path: "/" });

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "User logged in successfully",
    data: { token, accessToken, refreshToken, ...rest },
  });
});

const getMe = catchAsync(async (req, res) => {
  const user = req.user;
  if (!user) {
    throw new AppError("Unauthorized access! User not found in request.", status.UNAUTHORIZED);
  }

  const result = await authService.getMe(user.userId);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "User profile retrieved successfully",
    data: result,
  });
});

const getMyCustomerProfile = catchAsync(async (req, res) => {
  const user = req.user;
  if (!user) {
    throw new AppError("Unauthorized access! User not found in request.", status.UNAUTHORIZED);
  }

  const result = await authService.getMyCustomerProfile(user.userId);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Customer profile retrieved successfully",
    data: result,
  });
});

const getRole = catchAsync(async (req, res) => {
  const user = req.user;
  if (!user) {
    throw new AppError("Unauthorized access! User not found in request.", status.UNAUTHORIZED);
  }

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Role fetched successfully",
    data: { role: user.role },
  });
});

const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  await authService.verifyEmail(email, otp);
  sendResponse(res, { httpStatus: status.OK, success: true, message: "Email verified successfully" });
});

const updateCustomer = catchAsync(async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    throw new AppError("Invalid customer id", status.BAD_REQUEST);
  }
  const user = req.user;
  if (!user) {
    throw new AppError("Unauthorized access! User not found in request.", status.UNAUTHORIZED);
  }

  const data = await authService.updateCustomerById(id, req.body, user);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Customer updated successfully",
    data,
  });
});

const getNewToken = catchAsync(async (req: Request, res: Response) => {
  // Accept refreshToken from body (Bearer token flow) or cookies (legacy)
  const refreshToken = req.body.refreshToken || req.cookies.refreshToken;
  if (!refreshToken) {
    throw new AppError("Refresh token is missing", status.UNAUTHORIZED);
  }
  const result = await authService.getNewTokenFromRefresh(refreshToken);
  const { accessToken, refreshToken: newRefreshToken } = result;

  // Also set cookies for backward compat
  tokenUtils.setAccessTokenCookie(res, accessToken);
  tokenUtils.setRefreshTokenCookie(res, newRefreshToken);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "New tokens generated successfully",
    data: { accessToken, refreshToken: newRefreshToken },
  });
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  // Accept session token from Authorization header or cookie
  const authHeader = req.headers.authorization;
  const betterAuthSessionToken = (authHeader && authHeader.startsWith("Bearer "))
    ? authHeader.slice(7)
    : req.cookies["better-auth.session_token"];
  const result = await authService.changePassword(payload, betterAuthSessionToken);
  const { accessToken, refreshToken, token } = result;

  tokenUtils.setAccessTokenCookie(res, accessToken);
  tokenUtils.setRefreshTokenCookie(res, refreshToken);
  if (typeof token === "string" && token.length > 0) {
    tokenUtils.setBetterAuthSessionCookie(res, token);
  }

  sendResponse(res, { httpStatus: status.OK, success: true, message: "Password changed successfully", data: { accessToken, refreshToken } });
});

const logoutUser = catchAsync(async (req: Request, res: Response) => {
  // Accept session token from Authorization header or cookie
  const authHeader = req.headers.authorization;
  const betterAuthSessionToken = (authHeader && authHeader.startsWith("Bearer "))
    ? authHeader.slice(7)
    : req.cookies["better-auth.session_token"];

  let result = null;
  if (betterAuthSessionToken) {
    try {
      result = await authService.logoutUser(betterAuthSessionToken);
    } catch {
      // If session token is invalid (JWT vs session token), just clear cookies
    }
  }

  CookieUtils.clearCookie(res, 'accessToken', { httpOnly: true, secure: true, sameSite: "none" });
  CookieUtils.clearCookie(res, 'refreshToken', { httpOnly: true, secure: true, sameSite: "none" });
  CookieUtils.clearCookie(res, 'token', { httpOnly: true, secure: true, sameSite: "none" });
  CookieUtils.clearCookie(res, 'better-auth.session_token', { httpOnly: true, secure: true, sameSite: "none" });
  sendResponse(res, { httpStatus: status.OK, success: true, message: "User logged out successfully", data: result });
});

const forgetPassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  const result = await authService.forgetPassword(email);
  sendResponse(res, { httpStatus: status.OK, success: true, message: "Password reset OTP sent to email successfully", data: result });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body;
  await authService.resetPassword(email, otp, newPassword);
  sendResponse(res, { httpStatus: status.OK, success: true, message: "Password reset successfully" });
});

// /api/v1/auth/login/google
const googleLogin = catchAsync(async (req: Request, res: Response) => {
  const redirectPath = req.query.redirect || "/";
  const encodedRedirectPath = encodeURIComponent(redirectPath as string);
  const callbackURL = `${envVars.BETTER_AUTH_URL}/api/v1/auth/google/success?redirect=${encodedRedirectPath}`;
  const frontendBaseUrl = getFrontendBaseUrl(req);

  const response = await fetch(`${envVars.BETTER_AUTH_URL}/api/auth/sign-in/social`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      provider: "google",
      callbackURL,
    }),
  });

  if (!response.ok) {
    return res.redirect(`${frontendBaseUrl}/login?error=oauth_failed`);
  }

  const data = await response.json() as { url?: string };

  const setCookieHeaders =
    // Node/undici exposes the full cookie list here when available.
    (response.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie?.() ??
    response.headers.get("set-cookie")?.split(/,(?=[^;]+=[^;]+)/g) ??
    [];

  if (setCookieHeaders.length > 0) {
    res.setHeader("Set-Cookie", setCookieHeaders);
  }

  if (!data.url) {
    return res.redirect(`${frontendBaseUrl}/login?error=oauth_failed`);
  }

  return res.redirect(data.url);
});

const googleLoginSuccess = catchAsync(async (req: Request, res: Response) => {
    const redirectPath = req.query.redirect as string || "/";
  const frontendBaseUrl = getFrontendBaseUrl(req);

  const sessionToken = req.cookies["better-auth.session_token"];
  const session = await auth.api.getSession({
    headers: {
      ...req.headers,
      ...(sessionToken ? { Cookie: `better-auth.session_token=${sessionToken}` } : {}),
    } as any,
  });

    if (!session) {
    return res.redirect(`${frontendBaseUrl}/signin?error=no_session_found`);
    }


    if(session && !session.user){
    return res.redirect(`${frontendBaseUrl}/signin?error=no_user_found`);
    }

    const result = await authService.googleLoginSuccess(session);

    const {accessToken, refreshToken} = result;

    // Also set cookies for backward compat (localhost)
    tokenUtils.setAccessTokenCookie(res, accessToken);
    tokenUtils.setRefreshTokenCookie(res, refreshToken);

    // Redirect to frontend social-success page with tokens in URL
    // The frontend page will save them to localStorage and redirect
    const isValidRedirectPath = redirectPath.startsWith("/") && !redirectPath.startsWith("//");
    const finalRedirectPath = isValidRedirectPath ? redirectPath : "/";

    const params = new URLSearchParams({
      token: accessToken,
      refreshToken: refreshToken,
      redirect: finalRedirectPath,
    });

    res.redirect(`${frontendBaseUrl}/auth/social-success?${params.toString()}`);
})

const handleOAuthError = catchAsync((req: Request, res: Response) => {
  const error = req.query.error as string || "oauth_failed";
  const frontendBaseUrl = getFrontendBaseUrl(req);
  res.redirect(`${frontendBaseUrl}/login?error=${error}`);
});

const requestEmailVerificationOTP = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  const result = await authService.requestEmailVerificationOTP(email);
  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "OTP generated successfully",
    data: result,
  });
});

const requestPasswordResetOTP = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  const result = await authService.requestPasswordResetOTPDirect(email);
  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "OTP generated successfully",
    data: result,
  });
});

export const AuthController = {
  register, LoginUser, updateCustomer, getMe, getMyCustomerProfile, getRole, getNewToken, changePassword,
  logoutUser, verifyEmail, forgetPassword, resetPassword, googleLogin, googleLoginSuccess, handleOAuthError,
  requestEmailVerificationOTP, requestPasswordResetOTP,
};
