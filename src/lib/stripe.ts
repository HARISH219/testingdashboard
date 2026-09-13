import Stripe from "stripe";
import { env, HAS_STRIPE } from "./env";

export const stripe = HAS_STRIPE
  ? new Stripe(env.STRIPE_SECRET_KEY!, {
      // Pin to the API version supported by the installed stripe types.
      apiVersion: "2025-02-24.acacia",
    })
  : null;

export { HAS_STRIPE };
