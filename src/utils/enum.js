export const roleType = {
  USER: 1,
  ADMIN: 2,
};

export const genderType = {
  MALE: 1,
  FEMALE: 2,
  OTHER: 3,
};

export const deviceType = {
  IOS: 1,
  ANDROID: 2,
};

export const professionType = {
  RAAGI: 1,
  DHADHI: 2,
  KATHA_VACHAK: 3,
};

/** Maps stored profession number → enum key string, e.g. 1 → "RAAGI" */
export function professionNumberToKey(profession) {
  if (profession == null || profession === "") return null;
  const num = Number(profession);
  const entry = Object.entries(professionType).find(([, v]) => v === num);
  return entry ? entry[0] : null;
}

export const currencyType = {
  INR: "INR",
  USD: "USD",
  EUR: "EUR",
};

export const subscriptionStatusType = {
  PENDING: 1,
  ACTIVE: 2,
  CANCELLED: 3,
  EXPIRED: 4,
};

export const paymentStatusType = {
  PENDING: 1,
  PAID: 2,
  FAILED: 3,
};