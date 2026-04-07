import User from "../models/user.model.js";
import { deviceType, genderType, roleType } from "./enum.js";

/** Mongoose select string for client-safe profile (no password, tokens, OTP, jti). */
export const PUBLIC_USER_SELECT =
  "_id userName email role phoneNumber countryCode profileImage isVerified gender age language deviceType createdAt updatedAt address timeZone latitude longitude provider socialId providerId isOtpVerified";

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
    genderName:
      u.gender === genderType.MALE
        ? "male"
        : u.gender === genderType.FEMALE
          ? "female"
          : u.gender === genderType.OTHER
            ? "other"
            : null,
    deviceTypeName:
      u.deviceType === deviceType.IOS
        ? "ios"
        : u.deviceType === deviceType.ANDROID
          ? "android"
          : null,
  };
}

/** After `.populate("userId", PUBLIC_USER_SELECT).lean()`, add roleName / genderName / deviceTypeName. */
export function enrichPopulatedUserField(doc, path = "userId") {
  if (!doc) return doc;
  const nested = doc[path];
  if (nested && typeof nested === "object" && nested._id) {
    return { ...doc, [path]: enrichPublicUser(nested) };
  }
  return doc;
}

export function enrichPopulatedUserFields(docs, path = "userId") {
  if (!Array.isArray(docs)) return docs;
  return docs.map((d) => enrichPopulatedUserField(d, path));
}

/**
 * After enrich: `{ userId: "<mongoId>", user: { ...public profile } }`.
 * Keeps a string `userId` for filters/keys and full `user` for display.
 */
export function splitUserRefToIdAndUser(doc, path = "userId") {
  if (!doc) return doc;
  const nested = doc[path];
  if (nested && typeof nested === "object" && nested._id) {
    return {
      ...doc,
      [path]: nested._id.toString(),
      user: nested,
    };
  }
  return { ...doc, user: null };
}

export function enrichPopulatedUserFieldAndSplit(doc, path = "userId") {
  if (!doc) return doc;
  return splitUserRefToIdAndUser(enrichPopulatedUserField(doc, path), path);
}

export function enrichPopulatedUserFieldsAndSplit(docs, path = "userId") {
  if (!Array.isArray(docs)) return docs;
  return docs.map((d) => enrichPopulatedUserFieldAndSplit(d, path));
}
