// services/payment.service.js
import stripe from "../libs/stripe.js";
import { v4 as uuidv4 } from "uuid";
import connectDB from "../libs/db.js";
import { Transaction } from "../models/transaction.model.js";
import { getOrCreateWallet, updateWalletBalance } from "./wallet.service.js";

export const createDepositIntent = async (userId, amount) => {
  const db = await connectDB();
  const id = uuidv4();

  // Create a pending transaction
  await Transaction.create(db, {
    id,
    user_id: userId,
    type: "deposit",
    amount,
    status: "pending",
    reference_id: null,
  });

  // Stripe PaymentIntent (auto-confirm for Postman testing)
    const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // paisa
        currency: "pkr",
        payment_method: "pm_card_visa",  // test Visa card
        confirm: true,                   // auto-confirm
        automatic_payment_methods: { enabled: true, allow_redirects: "never" },
        metadata: { transaction_id: id, user_id: userId },
    });


  return { clientSecret: paymentIntent.client_secret, transactionId: id };
};


export const handleStripeWebhook = async (event) => {
  const db = await connectDB();
  const paymentIntent = event.data.object;
  const transactionId = paymentIntent.metadata.transaction_id;
  const userId = paymentIntent.metadata.user_id;


  if (event.type === "payment_intent.succeeded") {
    console.log(" Payment succeeded for user:", userId);

    // Update transaction
    await Transaction.updateStatus(db, transactionId, "completed", paymentIntent.id);

    // Update wallet
    const wallet = await getOrCreateWallet(userId);
    console.log("💰 Wallet before:", wallet.balance);

    const updated = await updateWalletBalance(userId, paymentIntent.amount / 100, "add");
    console.log("💰 Wallet after:", updated.balance);

    return { success: true };
  }

  if (event.type === "payment_intent.payment_failed") {
    await Transaction.updateStatus(db, transactionId, "failed", paymentIntent.id);
    return { success: false };
  }

  return { ignored: true };
};

