import dotenv from "dotenv";
import AppError from "../app/errorHelpers/appError.js";
import status from "http-status";

dotenv.config();

// =====================================================
// Environment variables used by the SupportTicket module
// (the only module in this service).
// =====================================================
interface EnvConfig {
    NODE_ENV: string;
    PORT: string;
    FRONTEND_URL: string;
    OPENROUTER_API_KEY: string;
    OPENROUTER_LLM_MODEL: string;
    OPENROUTER_BASE_URL: string;
}

const requireEnv = (key: string): string => {
    const value = process.env[key];
    if (!value || value.trim() === "") {
        throw new AppError(`Missing required environment variable: ${key}`, status.INTERNAL_SERVER_ERROR);
    }
    return value;
};

const LoadEnvVariables = (): EnvConfig => {
    return {
        NODE_ENV: requireEnv("NODE_ENV"),
        PORT: requireEnv("PORT"),
        FRONTEND_URL: requireEnv("FRONTEND_URL"),
        OPENROUTER_API_KEY: requireEnv("OPENROUTER_API_KEY"),
        OPENROUTER_LLM_MODEL: requireEnv("OPENROUTER_LLM_MODEL"),
        OPENROUTER_BASE_URL:
            process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
    };
};

export const envVars = LoadEnvVariables();
