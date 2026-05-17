import jwt from "jsonwebtoken";
import crypto from "crypto";

const ACCESS_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "2m";
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

if (!ACCESS_SECRET) throw new Error("JWT_SECRET is missing");
if (!REFRESH_SECRET) throw new Error("JWT_REFRESH_SECRET is missing");

const parseDurationToMs = (value, fallbackMs) => {
  const match = /^(\d+)([smhd])$/i.exec(String(value || ""));
  if (!match) return fallbackMs;

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();

  const factor = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  }[unit];

  return amount * factor;
};

export const REFRESH_TOKEN_MAX_AGE_MS = parseDurationToMs(
  REFRESH_EXPIRES_IN,
  7 * 24 * 60 * 60 * 1000,
);

export const signAccessToken = (payload) => {
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRES_IN,
  });
};

export const signRefreshToken = (payload) => {
  const jti = crypto.randomUUID();
  const token = jwt.sign({ ...payload, jti }, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES_IN,
  });

  return {
    token,
    jti,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS),
  };
};

export const verifyAccessToken = (token) => jwt.verify(token, ACCESS_SECRET);
export const verifyRefreshToken = (token) => jwt.verify(token, REFRESH_SECRET);

export const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};
