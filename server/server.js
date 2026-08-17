import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import whatsappRouter
  from "./routes/whatsapp.js";

import whatsappWebhookRouter
  from "./routes/whatsappWebhook.js";

import authRouter
  from "./routes/auth.js";

import adminRouter
  from "./routes/admin.js";

import partnerRouter
  from "./routes/partner.js";

import paymentRouter, {
  handleRazorpayWebhook,
} from "./routes/payment.js";


dotenv.config();


const app =
  express();


/* =========================================================
   CORS
========================================================= */

const allowedOrigins = [
  process.env.CLIENT_URL,

  "https://app.zaploft.in",

  "https://zaploft.in",

  "https://www.zaploft.in",

  "https://zaploft.vercel.app",
].filter(Boolean);


app.use(
  cors({
    origin(
      origin,
      callback
    ) {
      if (
        !origin ||
        allowedOrigins.includes(
          origin
        )
      ) {
        callback(
          null,
          true
        );

        return;
      }


      callback(
        new Error(
          "Not allowed by CORS"
        )
      );
    },
  })
);


/* =========================================================
   RAZORPAY WEBHOOK

   MUST COME BEFORE express.json()
========================================================= */

app.post(
  "/api/payment/webhook",
  express.raw({
    type: "application/json",
  }),
  handleRazorpayWebhook
);


/* =========================================================
   JSON
========================================================= */

app.use(
  express.json({
    limit: "10mb",
  })
);


/* =========================================================
   PAYMENT
========================================================= */

app.use(
  "/api/payment",
  paymentRouter
);


/* =========================================================
   WHATSAPP
========================================================= */

app.use(
  "/api/whatsapp",
  whatsappRouter
);


/* =========================================================
   TEMPLATES
========================================================= */

app.get(
  "/api/templates",
  async (
    req,
    res
  ) => {
    try {
      const {
        getTemplates,
      } = await import(
        "./services/whatsappService.js"
      );


      const data =
        await getTemplates();


      return res.json({
        success: true,

        templates:
          data?.data || [],
      });

    } catch (error) {
      console.error(
        "GET /api/templates ERROR:",
        error
      );


      return res.status(
        error.statusCode || 500
      ).json({
        success: false,

        message:
          error.message ||
          "Failed to load templates.",
      });
    }
  }
);


/* =========================================================
   WHATSAPP WEBHOOK
========================================================= */

app.use(
  "/api/whatsapp/webhook",
  whatsappWebhookRouter
);


/* =========================================================
   AUTH
========================================================= */

app.use(
  "/api/auth",
  authRouter
);


/* =========================================================
   ADMIN
========================================================= */

app.use(
  "/api/admin",
  adminRouter
);


/* =========================================================
   PARTNER
========================================================= */

app.use(
  "/api/partner",
  partnerRouter
);


/* =========================================================
   HEALTH
========================================================= */

app.get(
  "/",
  (
    req,
    res
  ) => {
    return res.json({
      success: true,

      message:
        "Zaploft API is running",
    });
  }
);


/* =========================================================
   GLOBAL ERROR
========================================================= */

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    console.error(
      "GLOBAL ERROR:",
      error
    );


    return res.status(
      error.status || 500
    ).json({
      success: false,

      message:
        error.message ||
        "Internal server error.",
    });
  }
);


/* =========================================================
   START
========================================================= */

const PORT =
  process.env.PORT ||
  5000;


app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      "========================================"
    );

    console.log(
      `Zaploft API running on port ${PORT}`
    );

    console.log(
      "Payment API:"
    );

    console.log(
      `https://api.zaploft.in/api/payment`
    );

    console.log(
      "Razorpay Webhook:"
    );

    console.log(
      `https://api.zaploft.in/api/payment/webhook`
    );

    console.log(
      "========================================"
    );
  }
);