import { deviceType as deviceTypeEnum } from "./enum.js";

/**
 * Normalize client device identifiers to 1 (iOS) or 2 (Android).
 */
export const normalizeDeviceType = (value) => {
  if (value == null || value === "") return undefined;
  if (typeof value === "number" && [1, 2].includes(value)) {
    return value;
  }
  const s = String(value).toLowerCase().trim();
  if (s === "1" || s === "ios" || s === "iphone" || s === "ipad") {
    return deviceTypeEnum.IOS;
  }
  if (
    s === "2" ||
    s === "android" ||
    s === "mobile" ||
    s === "web"
  ) {
    return deviceTypeEnum.ANDROID;
  }
  return undefined;
};

const LANGUAGE_MAP = {
  en: "English",
  english: "English",
  hi: "Hindi",
  hindi: "Hindi",
  pa: "Punjabi",
  punjabi: "Punjabi",
  ur: "Urdu",
  urdu: "Urdu",
  fa: "Faarsi",
  faarsi: "Faarsi",
  fr: "French",
  french: "French",
  es: "Spanish",
  spanish: "Spanish",
};

const VALID_LANGUAGES = [
  "Punjabi",
  "Urdu",
  "Faarsi",
  "Hindi",
  "English",
  "Spanish",
  "French",
];

/**
 * Map short codes (en, hi) to model enum values; pass through if already valid.
 */
export const normalizeLanguage = (value) => {
  if (value == null || value === "") return undefined;
  const s = String(value).trim();
  if (VALID_LANGUAGES.includes(s)) return s;
  const lower = s.toLowerCase();
  return LANGUAGE_MAP[lower];
};
