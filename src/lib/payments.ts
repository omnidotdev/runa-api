import Stripe from "stripe";

import { STRIPE_API_KEY } from "lib/config/env.config";

export const stripe = new Stripe(STRIPE_API_KEY as string);
