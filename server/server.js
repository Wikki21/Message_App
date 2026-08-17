import "dotenv/config";

import express from "express";
import cors from "cors";

import whatsappRouter from "./routes/whatsapp.js";
import whatsappWebhookRouter from "./routes/whatsappWebhook.js";
import authRouter from "./routes/auth.js";
import adminRouter from "./routes/admin.js";
import partnerRouter from "./routes/partner.js";

const app = express();

/* =========================================================
CORS
========================================================= */

app.use(cors());

/* =========================================================
JSON BODY
========================================================= */

app.use(
  express.json({
    limit: "10mb",
  })
);

/* =========================================================
WHATSAPP API
========================================================= */

app.use(
  "/api/whatsapp",
  whatsappRouter
);

/* =========================================================
TEMPLATES

GET /api/templates
========================================================= */

app.get(
  "/api/templates",
  async (req, res) => {
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
        templates: data?.data || [],
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
META WHATSAPP WEBHOOK

GET:
/api/whatsapp/webhook

POST:
/api/whatsapp/webhook
========================================================= */

app.use(
  "/api/whatsapp/webhook",
  whatsappWebhookRouter
);

/* =========================================================
HEALTH CHECK
========================================================= */

app.get(
  "/",
  (req, res) => {
    return res.json({
      success: true,
      message:
        "Zaploft API is running",
    });
  }
);

/* =========================================================
GLOBAL ERROR HANDLER
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


app.use(
  "/api/auth",
  authRouter
);

app.use(
  "/api/admin",
  adminRouter
);

app.use(
  "/api/partner",
  partnerRouter
);
/* =========================================================
START SERVER
========================================================= */

const PORT =
  process.env.PORT || 5000;

app.listen(
  PORT,
  () => {
    console.log(
      "========================================"
    );

    console.log(
      `Zaploft API running on port ${PORT}`
    );

    console.log(
      `WhatsApp Send API:`
    );

    console.log(
      `http://localhost:${PORT}/api/whatsapp/send`
    );

    console.log(
      `WhatsApp Webhook:`
    );

    console.log(
      `http://localhost:${PORT}/api/whatsapp/webhook`
    );

    console.log(
      "========================================"
    );
  }
);