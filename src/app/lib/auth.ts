import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma.js";
import { userStatus, Role } from "@prisma/client";
import { envVars } from "../../config/env.js";
import { bearer, emailOTP } from "better-auth/plugins";
import { sendEmail } from "../utils/email.js";

const useSecureCookies = envVars.BETTER_AUTH_URL.toLowerCase().startsWith("https://");
const authCookieSameSite = useSecureCookies ? "none" : "lax";


export const auth = betterAuth({
   baseURL: envVars.BETTER_AUTH_URL,
   secret: envVars.BETTER_AUTH_SECRET,
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword:{
        enabled: true,
        requireEmailVerification:true,
    },
      socialProviders:{
        google:{
            clientId: envVars.Google_Client_ID,
            clientSecret: envVars.Google_Client_Secret,
            // callbackUrl: envVars.GOOGLE_CALLBACK_URL,
            mapProfileToUser: ()=>{
                return {
                    role : Role.CUSTOMER,
                    status : userStatus.ACTIVE,
                    needPasswordChange : false,
                    emailVerified : true,
                    isDeleted : false,
                    deletedAt : null,
                }
            }
        }
    },
       emailVerification:{
        sendOnSignUp: true,
        sendOnSignIn: true,
        autoSignInAfterVerification: true,
    },


    user: {
      additionalFields: {
        role: {
          type: "string",
            required: true,
            defaultValue: Role.CUSTOMER,
        },
        status: {
          type: "string",
          required: true,
          defaultValue: userStatus.ACTIVE,
        },
        needsPasswordReset: {
          type: "boolean",
          required: true,
          defaultValue: false,
        },
        isdeleted: {
          type: "boolean",
          required: true,
          defaultValue: false,
        },
        deletedAt: {
          type: "date",
          required: false,
        }

      },
    },
    plugins: [
      bearer(),
   emailOTP({
            overrideDefaultEmailVerification: true,
            async sendVerificationOTP({email, otp, type}) {
                if(type === "email-verification"){
                  const user = await prisma.user.findUnique({
                    where : {
                        email,
                    }
                  })

                   if(!user){
                    console.error(`User with email ${email} not found. Cannot send verification OTP.`);
                    return;
                   }

                   if(user && user.role === Role.SUPER_ADMIN){
                    console.log(`User with email ${email} is a super admin. Skipping sending verification OTP.`);
                    return;
                   }

                    if (user && !user.emailVerified){
                    // Email sending is now handled by the frontend
                    // void sendEmail({
                    //     to : email,
                    //     subject : "Verify your email",
                    //     text : `Hi ${user.name},\n\nYour email verification OTP is: ${otp}\n\nThis OTP will expire in 10 minutes.\n\nPlease use this code to verify your email address.`
                    // })
                  }
                }else if(type === "forget-password"){
                    const user = await prisma.user.findUnique({
                        where : {
                            email,
                        }
                    })

                    if(user){
                        // Email sending is now handled by the frontend
                        // void sendEmail({
                        //     to : email,
                        //     subject : "Password Reset OTP",
                        //     text : `Hi ${user.name},\n\nYour password reset OTP is: ${otp}\n\nThis OTP will expire in 10 minutes.\n\nPlease use this code to reset your password.`
                        // })
                    }
                }
            },
            expiresIn : 2 * 60, // 2 minutes in seconds
            otpLength : 6,
        })
    ],

       session: {
        expiresIn: 60 * 60 * 60 * 24, // 1 day in seconds
        updateAge: 60 * 60 * 60 * 24, // 1 day in seconds
        cookieCache: {
          enabled: false,
            maxAge: 60 * 60 * 60 * 24, // 1 day in seconds
        }
    },
    redirectURLs:{
        signIn : `${envVars.BETTER_AUTH_URL}/api/v1/auth/google/success`,
    },
        trustedOrigins: [envVars.BETTER_AUTH_URL, envVars.FRONTEND_URL],
    advanced: {
        // disableCSRFCheck: true,
        useSecureCookies,
        cookies:{
            state:{
                attributes:{
                    sameSite: authCookieSameSite,
                    secure: useSecureCookies,
                    httpOnly: true,
                    path: "/",
                }
            },
            sessionToken:{
                attributes:{
                    sameSite: authCookieSameSite,
                    secure: useSecureCookies,
                    httpOnly: true,
                    path: "/",
                }
            }
        }
    }
});
