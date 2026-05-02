import crypto from "crypto";
import AppError from "../errorHelpers/appError.js";
import status from "http-status";

// Simple in-memory OTP storage (for development/testing)
// In production, use a database or cache like Redis
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

const generateOTP = (length: number = 6): string => {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
};

const storeOTP = (email: string, otp: string, expiryMinutes: number = 10) => {
  const expiresAt = Date.now() + expiryMinutes * 60 * 1000;
  otpStore.set(email, { otp, expiresAt });
};

const verifyOTP = (email: string, otp: string): boolean => {
  const stored = otpStore.get(email);
  if (!stored) throw new AppError("OTP not found or expired", status.BAD_REQUEST);
  if (stored.expiresAt < Date.now()) {
    otpStore.delete(email);
    throw new AppError("OTP has expired", status.BAD_REQUEST);
  }
  if (stored.otp !== otp) throw new AppError("Invalid OTP", status.BAD_REQUEST);
  otpStore.delete(email);
  return true;
};

const clearOTP = (email: string) => {
  otpStore.delete(email);
};

export const otpUtils = {
  generateOTP,
  storeOTP,
  verifyOTP,
  clearOTP,
};
