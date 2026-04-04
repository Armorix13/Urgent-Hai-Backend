/**
 * RevenueCat REST API v1 — GET /v1/subscribers/{app_user_id}
 * @see https://www.revenuecat.com/docs/integrations/webhooks
 */

function getBaseUrl() {
  return (process.env.REVENUE_CAT_BACKEND_URL || "https://api.revenuecat.com/v1").replace(/\/$/, "");
}

/**
 * @param {string} appUserId — typically same as your Mongo user _id string
 * @returns {Promise<object|null>} Full JSON body, or null if subscriber does not exist (404)
 */
export async function fetchRevenueCatSubscriber(appUserId) {
  const token = process.env.REVENUE_CAT_TOKEN;
  const base = getBaseUrl();
  if (!token || appUserId == null || String(appUserId).trim() === "") {
    return null;
  }

  const url = `${base}/subscribers/${encodeURIComponent(String(appUserId))}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`RevenueCat ${res.status}: ${text.slice(0, 300)}`);
  }

  return res.json();
}

/**
 * Product identifiers for one-time / non-subscription purchases are the object keys
 * under `subscriber.non_subscriptions` (e.g. vocal_course, abc_product).
 * @param {object|null|undefined} revenueCatJson — body from GET /subscribers/:id
 * @returns {Set<string>}
 */
export function extractNonSubscriptionProductKeys(revenueCatJson) {
  const ns = revenueCatJson?.subscriber?.non_subscriptions;
  if (!ns || typeof ns !== "object") {
    return new Set();
  }
  return new Set(Object.keys(ns));
}

/**
 * Keep enrollments whose course.identifierId matches a non-subscriptions product key.
 * @param {Array} enrollments — lean with populated course
 * @param {Set<string>} productKeys
 */
export function filterEnrollmentsByRevenueCatProducts(enrollments, productKeys) {
  if (!enrollments?.length || !productKeys?.size) {
    return [];
  }
  return enrollments.filter((e) => {
    const raw = e.course?.identifierId;
    if (raw == null) return false;
    const id = String(raw).trim();
    if (!id) return false;
    return productKeys.has(id);
  });
}
