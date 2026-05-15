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
  const data = await authService.updateCustomer(id, req.body);
  sendResponse(res, { httpStatus: status.OK, success: true, message: "Customer updated successfully", data });
});

const getNewToken = catchAsync(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;
  const betterAuthSessionToken = req.cookies["better-auth.session_token"];
  if (!refreshToken) {
    throw new AppError("Refresh token is missing", status.UNAUTHORIZED);
  }
  const result = await authService.getNewToken(refreshToken, betterAuthSessionToken);
  const { accessToken, refreshToken: newRefreshToken, sessionToken } = result;

  tokenUtils.setAccessTokenCookie(res, accessToken);
  tokenUtils.setRefreshTokenCookie(res, newRefreshToken);
  tokenUtils.setBetterAuthSessionCookie(res, sessionToken);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "New tokens generated successfully",
    data: { accessToken, refreshToken: newRefreshToken, sessionToken },
  });
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const betterAuthSessionToken = req.cookies["better-auth.session_token"];
  const result = await authService.changePassword(payload, betterAuthSessionToken);
  const { accessToken, refreshToken, token } = result;

  tokenUtils.setAccessTokenCookie(res, accessToken);
  tokenUtils.setRefreshTokenCookie(res, refreshToken);
  tokenUtils.setBetterAuthSessionCookie(res, token as string);

  sendResponse(res, { httpStatus: status.OK, success: true, message: "Password changed successfully", data: result });
});

const logoutUser = catchAsync(async (req: Request, res: Response) => {
  const betterAuthSessionToken = req.cookies["better-auth.session_token"];
  const result = await authService.logoutUser(betterAuthSessionToken);
  CookieUtils.clearCookie(res, 'accessToken', { httpOnly: true, secure: true, sameSite: "none" });
  CookieUtils.clearCookie(res, 'refreshToken', { httpOnly: true, secure: true, sameSite: "none" });
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
const googleLogin = catchAsync((req: Request, res: Response) => {
    const redirectPath = req.query.redirect || "/";

    const encodedRedirectPath = encodeURIComponent(redirectPath as string);

    const callbackURL = `${envVars.BETTER_AUTH_URL}/api/v1/auth/google/success?redirect=${encodedRedirectPath}`;

    res.setHeader('Content-Type', 'text/html');
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Google Login</title>
</head>
<body>
    <div>
        <p>Redirecting To Google...</p>
    </div>
</body>
<script>
    (
        async () => {
            try {
                const response = await fetch("${envVars.BETTER_AUTH_URL}/api/auth/sign-in/social", {
                    method : "POST",
                    headers : {
                        "Content-Type" : "application/json"
                    },
                    credentials : "include",
                    body: JSON.stringify({
                        provider : "google",
                        callbackURL: "${callbackURL}"
                    })
                })

                const data = await response.json();

                if(data.url){
                    window.location.href = data.url
                }else{
                    document.body.innerHTML = \`<div>
                    <p>
                        Error Occurred While Redirecting To Google. Please Try Again Later.
                    </p>
                    </div>\`
                }
            } catch (error) {
                document.body.innerHTML = \`<div>
                    <p>
                        Error Occurred While Redirecting To Google. Please Try Again Later.
                        \${error.message}
                    </p>
                    </div>\`
            }
        }
    )()
</script>
</html>`);
})

const googleLoginSuccess = catchAsync(async (req: Request, res: Response) => {
    const redirectPath = req.query.redirect as string || "/";

    const sessionToken = req.cookies["better-auth.session_token"];

    if(!sessionToken){
        return res.redirect(`${envVars.FRONTEND_URL}/login?error=oauth_failed`);
    }

    const session = await auth.api.getSession({
        headers:{
            "Cookie" : `better-auth.session_token=${sessionToken}`
        }
    })

    if (!session) {
        return res.redirect(`${envVars.FRONTEND_URL}/login?error=no_session_found`);
    }


    if(session && !session.user){
        return res.redirect(`${envVars.FRONTEND_URL}/login?error=no_user_found`);
    }

    const result = await authService.googleLoginSuccess(session);

    const {accessToken, refreshToken} = result;

    tokenUtils.setAccessTokenCookie(res, accessToken);
    tokenUtils.setRefreshTokenCookie(res, refreshToken);
 // ?redirect=//profile -> /profile
    const isValidRedirectPath = redirectPath.startsWith("/") && !redirectPath.startsWith("//");
    const finalRedirectPath = isValidRedirectPath ? redirectPath : "/";

    res.redirect(`${envVars.FRONTEND_URL}${finalRedirectPath}`);
})

const handleOAuthError = catchAsync((req: Request, res: Response) => {
  const error = req.query.error as string || "oauth_failed";
  res.redirect(`${envVars.FRONTEND_URL}/login?error=${error}`);
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
  register, LoginUser, updateCustomer, getMe, getRole, getNewToken, changePassword,
  logoutUser, verifyEmail, forgetPassword, resetPassword, googleLogin, googleLoginSuccess, handleOAuthError,
  requestEmailVerificationOTP, requestPasswordResetOTP,
};
