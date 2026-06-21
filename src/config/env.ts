import dotenv from "dotenv";
import AppError from "../app/errorHelpers/appError.js";
import status from "http-status";

dotenv.config();

interface EnvConfig {
    NODE_ENV: string;
    PORT: string;
    DATABASE_URL: string;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
    ACCESS_TOKEN_SECRET: string;
    REFRESH_TOKEN_SECRET: string;
    ACCESS_TOKEN_EXPIRES_IN: string;
    REFRESH_TOKEN_EXPIRES_IN: string;
    FRONTEND_URL: string;
    BETTER_AUTH_SESSION_EXPIRES_IN: string;
    BETTER_AUTH_SEASSION_UPDATE_AGE: string;
    EMAIL_SENDER?: {
        SMTP_USER: string;
        SMTP_PASS: string;
        SMTP_HOST: string;
        SMTP_PORT: string;
        SMTP_FROM: string;
    }
    // Google_Client_ID?: string;
    // Google_Client_Secret?: string;
    // Google_callbackURL?: string;
}

const requireEnv = (key: string): string => {
    const value = process.env[key];
    if (!value || value.trim() === "") {
        throw new AppError(`Missing required environment variable: ${key}`, status.INTERNAL_SERVER_ERROR);
    }
    return value;
};

const LoadEnvVarialbes = (): EnvConfig => {
    const emailVars =
        process.env.EMAIL_SENDER_SMTP_USER &&
        process.env.EMAIL_SENDER_SMTP_PASS &&
        process.env.EMAIL_SENDER_SMTP_HOST &&
        process.env.EMAIL_SENDER_SMTP_PORT &&
        process.env.EMAIL_SENDER_SMTP_FROM
            ? {
                SMTP_USER: process.env.EMAIL_SENDER_SMTP_USER,
                SMTP_PASS: process.env.EMAIL_SENDER_SMTP_PASS,
                SMTP_HOST: process.env.EMAIL_SENDER_SMTP_HOST,
                SMTP_PORT: process.env.EMAIL_SENDER_SMTP_PORT,
                SMTP_FROM: process.env.EMAIL_SENDER_SMTP_FROM,
            }
            : undefined;

    // const googleClientId = process.env.Google_Client_ID;
    // const googleClientSecret = process.env.Google_Client_Secret;
    // const googleCallbackURL = process.env.Google_callbackURL;

    return {
        NODE_ENV: requireEnv("NODE_ENV"),
        PORT: requireEnv("PORT"),
        DATABASE_URL: requireEnv("DATABASE_URL"),
        BETTER_AUTH_SECRET: requireEnv("BETTER_AUTH_SECRET"),
        BETTER_AUTH_URL: requireEnv("BETTER_AUTH_URL"),
        ACCESS_TOKEN_SECRET: requireEnv("ACCESS_TOKEN_SECRET"),
        REFRESH_TOKEN_SECRET: requireEnv("REFRESH_TOKEN_SECRET"),
        ACCESS_TOKEN_EXPIRES_IN: requireEnv("ACCESS_TOKEN_EXPIRES_IN"),
        REFRESH_TOKEN_EXPIRES_IN: requireEnv("REFRESH_TOKEN_EXPIRES_IN"),
        FRONTEND_URL: requireEnv("FRONTEND_URL"),
        BETTER_AUTH_SESSION_EXPIRES_IN: requireEnv("BETTER_AUTH_SESSION_EXPIRES_IN"),
        BETTER_AUTH_SEASSION_UPDATE_AGE: requireEnv("BETTER_AUTH_SEASSION_UPDATE_AGE"),
        EMAIL_SENDER: emailVars,
        // Google_Client_ID: googleClientId,
        // Google_Client_Secret: googleClientSecret,
        // Google_callbackURL: googleCallbackURL ? normalizeUrl(googleCallbackURL) : undefined,
    }
}


export const envVars = LoadEnvVarialbes();
