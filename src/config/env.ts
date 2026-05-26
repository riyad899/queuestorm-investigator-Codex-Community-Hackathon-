import dotenv from "dotenv";
import AppError from "../app/errorHelpers/appError.js";
import status from "http-status";

dotenv.config();

const normalizeUrl = (value: string, fallbackProtocol: "http" | "https" = "https") => {
    if (!value) {
        return value;
    }

    if (/^https?:\/\//i.test(value)) {
        return value;
    }

    const protocol = /^(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/i.test(value) ? "http" : fallbackProtocol;

    return `${protocol}://${value}`;
};

const getRenderExternalUrl = () => {
    if (process.env.RENDER_EXTERNAL_URL) {
        return process.env.RENDER_EXTERNAL_URL;
    }

    if (process.env.RENDER_EXTERNAL_HOSTNAME) {
        return `https://${process.env.RENDER_EXTERNAL_HOSTNAME}`;
    }

    return undefined;
};

const getVercelExternalUrl = () => {
    if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
        return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
    }

    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }

    return undefined;
};

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
    Google_Client_ID?: string;
    Google_Client_Secret?: string;
    Google_callbackURL?: string;
}

const LoadEnvVarialbes = (): EnvConfig => {
    const requiredEnvVars = [
        "DATABASE_URL",
        "BETTER_AUTH_SECRET",
        "ACCESS_TOKEN_SECRET",
        "REFRESH_TOKEN_SECRET",
        "ACCESS_TOKEN_EXPIRES_IN",
        "REFRESH_TOKEN_EXPIRES_IN",
        "BETTER_AUTH_SESSION_EXPIRES_IN",
        "BETTER_AUTH_SEASSION_UPDATE_AGE",
    ];
    requiredEnvVars.forEach((varName) => {
        if (!process.env[varName]) {
            throw new AppError(`Missing required environment variable: ${varName}`, status.INTERNAL_SERVER_ERROR);
        }
    });

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

    const googleClientId = process.env.Google_Client_ID;
    const googleClientSecret = process.env.Google_Client_Secret;
    const googleCallbackURL = process.env.Google_callbackURL;

    return {
        NODE_ENV: process.env.NODE_ENV ?? "production",
        PORT: process.env.PORT ?? "8000",
        DATABASE_URL: process.env.DATABASE_URL as string,
        BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET as string,
        BETTER_AUTH_URL: normalizeUrl(process.env.BETTER_AUTH_URL ?? getVercelExternalUrl() ?? getRenderExternalUrl() ?? "http://localhost:8000"),
        ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET as string,
        REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET as string,
        ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN as string,
        REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN as string,
        FRONTEND_URL: normalizeUrl(process.env.FRONTEND_URL ?? getRenderExternalUrl() ?? "http://localhost:3000", "http"),
        BETTER_AUTH_SESSION_EXPIRES_IN: process.env.BETTER_AUTH_SESSION_EXPIRES_IN as string,
        BETTER_AUTH_SEASSION_UPDATE_AGE: process.env.BETTER_AUTH_SEASSION_UPDATE_AGE as string,
        EMAIL_SENDER: emailVars,
        Google_Client_ID: googleClientId,
        Google_Client_Secret: googleClientSecret,
        Google_callbackURL: googleCallbackURL ? normalizeUrl(googleCallbackURL) : undefined,
    }
}


export const envVars = LoadEnvVarialbes();
