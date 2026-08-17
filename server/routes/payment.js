import express from "express";
import crypto from "crypto";

import pool from "../db.js";

import {
  getPlan,
  getAllPlans,
  createSubscription,
} from "../services/razorpayService.js";


const router =
  express.Router();


/* =========================================================
   GET PLANS

   GET /api/payment/plans
========================================================= */

router.get(
  "/plans",
  async (
    req,
    res
  ) => {
    try {
      const plans =
        getAllPlans()
          .filter(
            (plan) =>
              Boolean(
                plan.planId
              )
          )
          .map(
            (plan) => ({
              key:
                plan.key,

              name:
                plan.name,

              amount:
                plan.amount,

              currency:
                plan.currency,
            })
          );


      return res.json({
        success: true,

        razorpayKeyId:
          process.env.RAZORPAY_KEY_ID,

        plans,
      });

    } catch (error) {
      console.error(
        "GET PAYMENT PLANS ERROR:",
        error
      );


      return res.status(
        500
      ).json({
        success: false,

        message:
          "Failed to load payment plans.",
      });
    }
  }
);


/* =========================================================
   CREATE PAYMENT SESSION

   POST /api/payment/create
========================================================= */

router.post(
  "/create",
  async (
    req,
    res
  ) => {
    try {
      const {
        plan,
      } =
        req.body;


      const selectedPlan =
        getPlan(plan);


      if (!selectedPlan) {
        return res.status(
          400
        ).json({
          success: false,

          message:
            "Invalid plan selected.",
        });
      }


      if (
        !selectedPlan.planId
      ) {
        return res.status(
          500
        ).json({
          success: false,

          message:
            `${selectedPlan.name} plan is not configured.`,
        });
      }


      const paymentToken =
        crypto.randomUUID();


      const subscription =
        await createSubscription(
          selectedPlan
        );


      const result =
        await pool.query(
          `
          INSERT INTO partner_payment_sessions
          (
            payment_token,
            plan_key,
            plan_name,
            razorpay_plan_id,
            razorpay_subscription_id,
            amount,
            currency,
            status,
            created_at
          )

          VALUES
          (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            'PENDING',
            CURRENT_TIMESTAMP
          )

          RETURNING
            id,
            payment_token,
            plan_key,
            plan_name,
            razorpay_plan_id,
            razorpay_subscription_id,
            amount,
            currency,
            status
          `,
          [
            paymentToken,

            selectedPlan.key,

            selectedPlan.name,

            selectedPlan.planId,

            subscription.id,

            selectedPlan.amount,

            selectedPlan.currency,
          ]
        );


      const payment =
        result.rows[0];


      return res.status(
        201
      ).json({
        success: true,

        paymentToken:
          payment.payment_token,

        razorpayKeyId:
          process.env.RAZORPAY_KEY_ID,

        subscription: {
          id:
            payment.razorpay_subscription_id,

          planId:
            payment.razorpay_plan_id,

          planName:
            payment.plan_name,

          amount:
            payment.amount,

          currency:
            payment.currency,
        },
      });

    } catch (error) {
      console.error(
        "CREATE PAYMENT ERROR:",
        error
      );


      return res.status(
        500
      ).json({
        success: false,

        message:
          error.message ||
          "Failed to create payment.",
      });
    }
  }
);


/* =========================================================
   VERIFY RAZORPAY PAYMENT

   POST /api/payment/verify
========================================================= */

router.post(
  "/verify",
  async (
    req,
    res
  ) => {
    try {
      const {
        payment_token,
        razorpay_payment_id,
        razorpay_subscription_id,
        razorpay_signature,
      } =
        req.body;


      if (
        !payment_token ||
        !razorpay_payment_id ||
        !razorpay_subscription_id ||
        !razorpay_signature
      ) {
        return res.status(
          400
        ).json({
          success: false,

          message:
            "Incomplete Razorpay payment response.",
        });
      }


      const result =
        await pool.query(
          `
          SELECT
            id,
            payment_token,
            plan_key,
            plan_name,
            razorpay_plan_id,
            razorpay_subscription_id,
            status,
            used_at

          FROM partner_payment_sessions

          WHERE payment_token = $1

          LIMIT 1
          `,
          [
            payment_token,
          ]
        );


      if (
        result.rows.length ===
        0
      ) {
        return res.status(
          404
        ).json({
          success: false,

          message:
            "Payment session not found.",
        });
      }


      const payment =
        result.rows[0];


      if (
        payment.used_at
      ) {
        return res.status(
          409
        ).json({
          success: false,

          message:
            "This payment has already been used.",
        });
      }


      if (
        payment.razorpay_subscription_id !==
        razorpay_subscription_id
      ) {
        return res.status(
          400
        ).json({
          success: false,

          message:
            "Razorpay subscription mismatch.",
        });
      }


      const signaturePayload =
        `${razorpay_payment_id}|${razorpay_subscription_id}`;


      const expectedSignature =
        crypto
          .createHmac(
            "sha256",
            process.env
              .RAZORPAY_KEY_SECRET
          )
          .update(
            signaturePayload
          )
          .digest(
            "hex"
          );


      const receivedBuffer =
        Buffer.from(
          razorpay_signature,
          "utf8"
        );


      const expectedBuffer =
        Buffer.from(
          expectedSignature,
          "utf8"
        );


      if (
        receivedBuffer.length !==
        expectedBuffer.length
      ) {
        return res.status(
          400
        ).json({
          success: false,

          message:
            "Invalid Razorpay signature.",
        });
      }


      const valid =
        crypto.timingSafeEqual(
          receivedBuffer,
          expectedBuffer
        );


      if (!valid) {
        return res.status(
          400
        ).json({
          success: false,

          message:
            "Invalid Razorpay signature.",
        });
      }


      await pool.query(
        `
        UPDATE partner_payment_sessions

        SET
          razorpay_payment_id = $1,

          razorpay_signature = $2,

          status = 'PAID',

          paid_at =
            CURRENT_TIMESTAMP

        WHERE id = $3
        `,
        [
          razorpay_payment_id,

          razorpay_signature,

          payment.id,
        ]
      );


      return res.json({
        success: true,

        paid: true,

        paymentToken:
          payment.payment_token,

        plan:
          payment.plan_key,

        planName:
          payment.plan_name,
      });

    } catch (error) {
      console.error(
        "VERIFY PAYMENT ERROR:",
        error
      );


      return res.status(
        500
      ).json({
        success: false,

        message:
          "Failed to verify payment.",
      });
    }
  }
);


/* =========================================================
   VERIFY PAYMENT TOKEN

   GET /api/payment/verify-token/:token
========================================================= */

router.get(
  "/verify-token/:token",
  async (
    req,
    res
  ) => {
    try {
      const result =
        await pool.query(
          `
          SELECT
            id,
            payment_token,
            plan_key,
            plan_name,
            amount,
            currency,
            status,
            used_at

          FROM partner_payment_sessions

          WHERE payment_token = $1

          LIMIT 1
          `,
          [
            req.params.token,
          ]
        );


      if (
        result.rows.length ===
        0
      ) {
        return res.status(
          404
        ).json({
          success: false,

          paid: false,

          message:
            "Payment session not found.",
        });
      }


      const payment =
        result.rows[0];


      return res.json({
        success: true,

        paid:
          payment.status ===
          "PAID",

        used:
          Boolean(
            payment.used_at
          ),

        payment: {
          plan:
            payment.plan_key,

          planName:
            payment.plan_name,

          amount:
            payment.amount,

          currency:
            payment.currency,
        },
      });

    } catch (error) {
      console.error(
        "VERIFY PAYMENT TOKEN ERROR:",
        error
      );


      return res.status(
        500
      ).json({
        success: false,

        message:
          "Failed to verify payment token.",
      });
    }
  }
);


/* =========================================================
   RAZORPAY WEBHOOK

   POST /api/payment/webhook
========================================================= */

export async function handleRazorpayWebhook(
  req,
  res
) {
  try {
    const webhookSecret =
      process.env
        .RAZORPAY_WEBHOOK_SECRET;


    const signature =
      req.headers[
        "x-razorpay-signature"
      ];


    if (!webhookSecret) {
      console.error(
        "RAZORPAY_WEBHOOK_SECRET is not configured."
      );

      return res.status(
        500
      ).json({
        success: false,

        message:
          "Webhook secret is not configured.",
      });
    }


    if (!signature) {
      return res.status(
        400
      ).json({
        success: false,

        message:
          "Missing webhook signature.",
      });
    }


    const rawBody =
      Buffer.isBuffer(
        req.body
      )
        ? req.body
        : Buffer.from(
            JSON.stringify(
              req.body
            )
          );


    const expectedSignature =
      crypto
        .createHmac(
          "sha256",
          webhookSecret
        )
        .update(
          rawBody
        )
        .digest(
          "hex"
        );


    const receivedBuffer =
      Buffer.from(
        signature,
        "utf8"
      );


    const expectedBuffer =
      Buffer.from(
        expectedSignature,
        "utf8"
      );


    if (
      receivedBuffer.length !==
      expectedBuffer.length
    ) {
      return res.status(
        400
      ).json({
        success: false,

        message:
          "Invalid webhook signature.",
      });
    }


    const valid =
      crypto.timingSafeEqual(
        receivedBuffer,
        expectedBuffer
      );


    if (!valid) {
      return res.status(
        400
      ).json({
        success: false,

        message:
          "Invalid webhook signature.",
      });
    }


    const event =
      JSON.parse(
        rawBody.toString(
          "utf8"
        )
      );


    const subscription =
      event?.payload
        ?.subscription
        ?.entity;


    const payment =
      event?.payload
        ?.payment
        ?.entity;


    const subscriptionId =
      subscription?.id;


    if (!subscriptionId) {
      return res.json({
        success: true,
      });
    }


    if (
      event.event ===
        "subscription.authenticated" ||
      event.event ===
        "subscription.activated" ||
      event.event ===
        "subscription.charged"
    ) {
      await pool.query(
        `
        UPDATE partner_payment_sessions

        SET
          status = 'PAID',

          razorpay_payment_id =
            COALESCE(
              $1,
              razorpay_payment_id
            ),

          paid_at =
            COALESCE(
              paid_at,
              CURRENT_TIMESTAMP
            )

        WHERE
          razorpay_subscription_id = $2
        `,
        [
          payment?.id ||
            null,

          subscriptionId,
        ]
      );
    }


    if (
      event.event ===
        "subscription.halted" ||
      event.event ===
        "subscription.cancelled"
    ) {
      await pool.query(
        `
        UPDATE partner_payment_sessions

        SET
          status = 'FAILED'

        WHERE
          razorpay_subscription_id = $1
          AND status <> 'PAID'
        `,
        [
          subscriptionId,
        ]
      );
    }


    return res.status(
      200
    ).json({
      success: true,
    });

  } catch (error) {
    console.error(
      "RAZORPAY WEBHOOK ERROR:",
      error
    );


    return res.status(
      500
    ).json({
      success: false,

      message:
        "Webhook processing failed.",
    });
  }
}


export default router;