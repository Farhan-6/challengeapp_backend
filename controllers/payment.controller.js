import { createDepositIntent, handleStripeWebhook } from "../services/payment.service.js";
import stripe from "../libs/stripe.js";
import dotenv from "dotenv"

dotenv.config()

export const deposit = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.id; // from auth middleware
    if (!amount) return res.status(400).json({ error: "Amount required" });

    const result = await createDepositIntent(userId, parseFloat(amount));
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const webhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    const result = await handleStripeWebhook(event);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
