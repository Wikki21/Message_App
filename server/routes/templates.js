import express from "express";

import {
  getTemplates
} from "../services/whatsappService.js";

const router =
  express.Router();


router.get("/", async (req, res) => {

  try {

    const data =
      await getTemplates();

    const templates =
      data.data || [];


    const formattedTemplates =
      templates.map(
        (template) => ({

          id:
            template.id,

          name:
            template.name,

          language:
            template.language,

          status:
            template.status,

          category:
            template.category,

          components:
            template.components || []

        })
      );


    res.json({

      success: true,

      templates:
        formattedTemplates

    });


  } catch (error) {

    console.error(
      "Template error:",
      error
    );


    res.status(500).json({

      success: false,

      message:
        error.message

    });

  }

});


export default router;