import express from "express";

import {
  getTemplates,
  sendTemplateMessage,
  normalizeWhatsAppPhone,
  buildTemplateParameters,
} from "../services/whatsappService.js";


const router =
  express.Router();


/* =========================================================
GET TEMPLATES

GET /api/whatsapp/templates
========================================================= */

router.get(
  "/templates",
  async (req, res) => {

    try {

      const data =
        await getTemplates();


      return res.json({
        success: true,

        templates:
          data?.data || [],
      });


    } catch (error) {

      console.error(
        "GET TEMPLATES ERROR:",
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
SEND WHATSAPP CAMPAIGN

POST /api/whatsapp/send
========================================================= */

router.post(
  "/send",
  async (req, res) => {

    try {

      const {
        customers = [],
        templateName,
        languageCode,
        templateComponents = [],
      } = req.body;


      /* ===================================================
         VALIDATION
      =================================================== */

      if (
        !Array.isArray(
          customers
        ) ||
        customers.length === 0
      ) {

        return res.status(400).json({

          success: false,

          message:
            "No customers provided.",
        });
      }


      if (!templateName) {

        return res.status(400).json({

          success: false,

          message:
            "Template name is required.",
        });
      }


      if (!languageCode) {

        return res.status(400).json({

          success: false,

          message:
            "Template language is required.",
        });
      }


      if (
        !Array.isArray(
          templateComponents
        )
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Template components are invalid.",
        });
      }


      console.log(
        "\n=========================================="
      );

      console.log(
        "WHATSAPP CAMPAIGN START"
      );

      console.log(
        "Template:",
        templateName
      );

      console.log(
        "Language:",
        languageCode
      );

      console.log(
        "Customers:",
        customers.length
      );

      console.log(
        "Template Components:"
      );

      console.log(
        JSON.stringify(
          templateComponents,
          null,
          2
        )
      );

      console.log(
        "==========================================\n"
      );


      /* ===================================================
         RESULTS
      =================================================== */

      const results = [];


      /* ===================================================
         SEND SEQUENTIALLY

         Do not use Promise.all.
      =================================================== */

      for (
        const customer
        of customers
      ) {

        const customerResult = {

          customer,

          status:
            "queued",

          error:
            "",

          response:
            null,

          messageId:
            null,

          messageStatus:
            null,
        };


        try {

          /* =============================================
             PHONE
          ============================================= */

          const rawPhone =
            customer.phone ??
            customer.mobile ??
            customer.contact ??
            customer.contact_number ??
            customer.whatsapp ??
            customer.whatsapp_number;


          const phone =
            normalizeWhatsAppPhone(
              rawPhone
            );


          if (!phone) {

            throw new Error(
              "WhatsApp phone number is missing or invalid."
            );
          }


          /* =============================================
             BUILD TEMPLATE PARAMETERS

             IMPORTANT FIX:

             We now use the SAME mapping for both
             HEADER and BODY.

             Example:

             Header {{1}}
             -> customer_name

             Body {{1}}
             -> customer_name

             Body {{2}}
             -> due_date
          ============================================= */

          const parameters =
            buildTemplateParameters({
              customer,
              templateComponents,
            });


          const {
            headerVariables,
            bodyVariables,
            headerParameters,
            bodyParameters,
          } = parameters;


          console.log(
            "\n------------------------------------------"
          );

          console.log(
            "CUSTOMER:",
            customer.customer_name ||
            customer.name ||
            "Unknown"
          );

          console.log(
            "PHONE:",
            phone
          );

          console.log(
            "HEADER VARIABLES:",
            headerVariables
          );

          console.log(
            "HEADER VALUES:",
            headerParameters
          );

          console.log(
            "BODY VARIABLES:",
            bodyVariables
          );

          console.log(
            "BODY VALUES:",
            bodyParameters
          );

          console.log(
            "------------------------------------------\n"
          );


          /* =============================================
             CHECK HEADER VARIABLES
          ============================================= */

          const missingHeader =
            headerParameters.some(
              (value) =>
                String(
                  value ?? ""
                ).trim() === ""
            );


          if (
            headerVariables.length > 0 &&
            missingHeader
          ) {

            throw new Error(
              "Required WhatsApp header variable is missing."
            );
          }


          /* =============================================
             CHECK BODY VARIABLES
          ============================================= */

          const missingBody =
            bodyParameters.some(
              (value) =>
                String(
                  value ?? ""
                ).trim() === ""
            );


          if (
            bodyVariables.length > 0 &&
            missingBody
          ) {

            throw new Error(
              "Required WhatsApp body variable is missing."
            );
          }


          /* =============================================
             SEND TO META
          ============================================= */

          const metaResult =
            await sendTemplateMessage({

              to:
                phone,

              templateName:
                templateName,

              languageCode:
                languageCode,

              headerParameters:
                headerParameters,

              bodyParameters:
                bodyParameters,
            });


          /* =============================================
             SAVE RESULT
          ============================================= */

          customerResult.status =
            metaResult.messageStatus ||
            "accepted";


          customerResult.messageId =
            metaResult.messageId;


          customerResult.messageStatus =
            metaResult.messageStatus;


          customerResult.response =
            metaResult.raw;


          customerResult.phone =
            phone;


          console.log(
            `WhatsApp accepted for ${phone}`
          );


          console.log(
            "Message ID:",
            metaResult.messageId
          );


        } catch (error) {

          customerResult.status =
            "failed";


          customerResult.error =
            error.message ||
            "Failed to send WhatsApp message.";


          console.error(
            `WhatsApp send failed for ${
              customer.customer_name ||
              customer.name ||
              "customer"
            }:`,
            error.message
          );


          if (error.metaError) {

            console.error(
              "META ERROR:",
              JSON.stringify(
                error.metaError,
                null,
                2
              )
            );
          }
        }


        results.push(
          customerResult
        );
      }


      /* ===================================================
         COUNTS
      =================================================== */

      const accepted =
        results.filter(
          (result) =>
            result.status ===
            "accepted"
        ).length;


      const failed =
        results.filter(
          (result) =>
            result.status ===
            "failed"
        ).length;


      /* ===================================================
         RESPONSE

         accepted = Meta accepted request.

         It does NOT mean delivered.

         Webhook will later tell you:
         sent
         delivered
         read
         failed
      =================================================== */

      return res.json({

        success:
          true,

        total:
          results.length,

        accepted,

        sent:
          0,

        delivered:
          0,

        failed,

        results,
      });


    } catch (error) {

      console.error(
        "WHATSAPP CAMPAIGN ERROR:",
        error
      );


      return res.status(
        error.statusCode || 500
      ).json({

        success:
          false,

        message:
          error.message ||
          "WhatsApp campaign failed.",
      });
    }
  }
);


export default router;