import User from "../models/user.model.js";
import { roleType } from "./enum.js";

/** Mongoose select string for client-safe profile (no password, tokens, OTP). */
export const PUBLIC_USER_SELECT =
  "_id userName email role phoneNumber countryCode profileImage isVerified gender age language deviceType createdAt updatedAt address timeZone latitude longitude provider isOtpVerified";

export async function getPublicUserById(userId) {
  if (!userId) return null;
  const u = await User.findById(userId).select(PUBLIC_USER_SELECT).lean();
  return enrichPublicUser(u);
}

/**
 * @param {object|null|undefined} u — lean user from DB
 */
export function enrichPublicUser(u) {
  if (!u) return null;
  return {
    ...u,
    roleName: u.role === roleType.ADMIN ? "admin" : "user",
  };
}
