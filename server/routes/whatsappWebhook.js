import express from "express";

const router = express.Router();

/* =========================================================
   WEBHOOK VERIFY TOKEN

   Put this in .env:

   META_WEBHOOK_VERIFY_TOKEN=zaploft_wh_2026_k7x2m9
========================================================= */

const VERIFY_TOKEN =
  String(
    process.env.META_WEBHOOK_VERIFY_TOKEN ||
      "zaploft_wh_2026_k7x2m9"
  ).trim();


/* =========================================================
   VERIFY WEBHOOK

   GET /api/whatsapp/webhook
========================================================= */

router.get("/", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log("\n========================================");
  console.log("WHATSAPP WEBHOOK VERIFICATION");
  console.log("Mode:", mode);
  console.log("Token:", token);
  console.log("Challenge:", challenge);
  console.log("Expected Token:", VERIFY_TOKEN);
  console.log("========================================\n");

  // Prevent browser/ngrok caching
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  if (
    mode === "subscribe" &&
    token === VERIFY_TOKEN
  ) {
    console.log(
      "✅ WhatsApp webhook verified successfully"
    );

    return res
      .status(200)
      .type("text/plain")
      .send(challenge);
  }

  console.error(
    "❌ WhatsApp webhook verification failed"
  );

  return res
    .status(403)
    .send("Forbidden");
});

/* =========================================================
   RECEIVE WEBHOOK EVENTS

   POST /api/whatsapp/webhook
========================================================= */

router.post("/", async (req, res) => {

  try {

    const body = req.body;


    console.log(
      "\n========================================"
    );

    console.log(
      "WHATSAPP WEBHOOK RECEIVED"
    );

    console.log(
      JSON.stringify(
        body,
        null,
        2
      )
    );

    console.log(
      "========================================\n"
    );


    /* =====================================================
       VALIDATE META OBJECT
    ===================================================== */

    if (
      body?.object !==
      "whatsapp_business_account"
    ) {

      console.error(
        "Invalid WhatsApp webhook object"
      );

      return res.sendStatus(404);
    }


    /* =====================================================
       ENTRIES
    ===================================================== */

    const entries =
      Array.isArray(body.entry)
        ? body.entry
        : [];


    for (const entry of entries) {

      const changes =
        Array.isArray(entry.changes)
          ? entry.changes
          : [];


      for (const change of changes) {

        const value =
          change.value || {};


        /* =================================================
           STATUS UPDATES
        ================================================= */

        const statuses =
          Array.isArray(
            value.statuses
          )
            ? value.statuses
            : [];


        for (const status of statuses) {

          const messageId =
            status.id || null;

          const recipient =
            status.recipient_id || null;

          const messageStatus =
            String(
              status.status || ""
            ).toUpperCase();


          console.log(
            "\n========================================"
          );

          console.log(
            "WHATSAPP STATUS UPDATE"
          );

          console.log(
            "Message ID:",
            messageId
          );

          console.log(
            "Recipient:",
            recipient
          );

          console.log(
            "Status:",
            messageStatus
          );

          console.log(
            "Timestamp:",
            status.timestamp || ""
          );


          /* =============================================
             FAILED MESSAGE
          ============================================= */

          if (
            messageStatus === "FAILED"
          ) {

            console.error(
              "❌ WhatsApp message FAILED"
            );

            console.error(
              JSON.stringify(
                status.errors || [],
                null,
                2
              )
            );
          }


          /* =============================================
             SENT
          ============================================= */

          if (
            messageStatus === "SENT"
          ) {

            console.log(
              "✅ WhatsApp message SENT"
            );
          }


          /* =============================================
             DELIVERED
          ============================================= */

          if (
            messageStatus === "DELIVERED"
          ) {

            console.log(
              "✅ WhatsApp message DELIVERED"
            );
          }


          /* =============================================
             READ
          ============================================= */

          if (
            messageStatus === "READ"
          ) {

            console.log(
              "✅ WhatsApp message READ"
            );
          }


          console.log(
            "========================================\n"
          );
        }


        /* =================================================
           INCOMING MESSAGES
        ================================================= */

        const messages =
          Array.isArray(
            value.messages
          )
            ? value.messages
            : [];


        for (const message of messages) {

          console.log(
            "\n📩 INCOMING WHATSAPP MESSAGE"
          );

          console.log(
            JSON.stringify(
              message,
              null,
              2
            )
          );
        }
      }
    }


    /*
      Meta expects HTTP 200 quickly.
    */

    return res.sendStatus(200);


  } catch (error) {

    console.error(
      "❌ WhatsApp webhook error:",
      error
    );


    /*
      Acknowledge Meta.
    */

    return res.sendStatus(200);
  }
});


export default router;