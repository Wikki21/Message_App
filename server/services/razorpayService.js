import Razorpay from "razorpay";

const keyId =
  process.env.RAZORPAY_KEY_ID;

const keySecret =
  process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
  console.warn(
    "WARNING: Razorpay credentials are not configured."
  );
}

const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});


const PLAN_CONFIG = {
  solo: {
    key: "solo",

    name:
      process.env.RAZORPAY_PLAN_SOLO_NAME ||
      "Solo",

    planId:
      process.env.RAZORPAY_PLAN_SOLO || "",

    amount: Number(
      process.env.RAZORPAY_PLAN_SOLO_AMOUNT || 0
    ),

    currency: "INR",
  },

  pro: {
    key: "pro",

    name:
      process.env.RAZORPAY_PLAN_PRO_NAME ||
      "Pro",

    planId:
      process.env.RAZORPAY_PLAN_PRO || "",

    amount: Number(
      process.env.RAZORPAY_PLAN_PRO_AMOUNT || 0
    ),

    currency: "INR",
  },

  business: {
    key: "business",

    name:
      process.env.RAZORPAY_PLAN_BUSINESS_NAME ||
      "Business",

    planId:
      process.env.RAZORPAY_PLAN_BUSINESS || "",

    amount: Number(
      process.env.RAZORPAY_PLAN_BUSINESS_AMOUNT || 0
    ),

    currency: "INR",
  },
};


export function getPlan(planKey) {
  const key = String(planKey || "")
    .trim()
    .toLowerCase();

  return PLAN_CONFIG[key] || null;
}


export function getAllPlans() {
  return Object.values(PLAN_CONFIG);
}


export async function createSubscription(plan) {
  if (!plan) {
    throw new Error(
      "Invalid Razorpay plan."
    );
  }

  if (!plan.planId) {
    throw new Error(
      `${plan.name} Razorpay plan ID is not configured.`
    );
  }

  const totalCount = Number(
    process.env.RAZORPAY_TOTAL_COUNT || 200
  );

  return razorpay.subscriptions.create({
    plan_id: plan.planId,

    total_count: totalCount,

    quantity: 1,

    customer_notify: true,

    notes: {
      plan_key: plan.key,
      plan_name: plan.name,
    },
  });
}


export default razorpay;