import crypto from "node:crypto";
import { env, HAS_RAZORPAY } from "./env";

/**
 * Razorpay integration without the `razorpay` npm package.
 *
 * We talk to Razorpay's REST API directly with `fetch` and verify payment
 * signatures with Node's built-in `crypto`. This keeps the dependency tree
 * (and Vercel installs) untouched. All calls that need the Key Secret run
 * server-side only — the secret is never sent to the browser.
 *
 * Docs: https://razorpay.com/docs/api/orders / payments/#verify-signature
 */

const RAZORPAY_API = "https://api.razorpay.com/v1";

export { HAS_RAZORPAY };

export interface RazorpayOrder {
  id: string;
  amount: number; // in the smallest currency unit (paise for INR)
  currency: string;
  receipt?: string;
  status: string;
}

/** Basic-auth header for server-side Razorpay REST calls. */
function authHeader(): string {
  const token = Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString("base64");
  return `Basic ${token}`;
}

/**
 * Create a Razorpay order. `amount` is in the smallest currency unit
 * (e.g. paise for INR, cents for USD). Throws if Razorpay is not configured
 * or the API rejects the request.
 */
export async function createOrder(params: {
  amount: number;
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrder> {
  if (!HAS_RAZORPAY) {
    throw new Error("Razorpay is not configured (missing key id or secret).");
  }
  const res = await fetch(`${RAZORPAY_API}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader(),
    },
    body: JSON.stringify({
      amount: params.amount,
      currency: params.currency ?? "INR",
      receipt: params.receipt,
      notes: params.notes,
    }),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.description ?? `Razorpay order failed (${res.status})`;
    throw new Error(msg);
  }
  return data as RazorpayOrder;
}

/**
 * Verify a Razorpay Checkout success payload. Razorpay signs
 * `${orderId}|${paymentId}` with HMAC-SHA256 using the Key Secret; a matching
 * signature proves the payment is authentic and untampered. This MUST run
 * server-side — it is the authoritative check before granting access.
 */
export function verifyPaymentSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  if (!env.RAZORPAY_KEY_SECRET) return false;
  const expected = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(`${params.orderId}|${params.paymentId}`)
    .digest("hex");
  // Constant-time comparison to avoid timing attacks.
  const a = Buffer.from(expected);
  const b = Buffer.from(params.signature ?? "");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/** The public Key ID for the frontend checkout widget (safe to expose). */
export function publicKeyId(): string | null {
  return env.RAZORPAY_KEY_ID ?? null;
}
