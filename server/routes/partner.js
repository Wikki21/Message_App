import express from "express";
import bcrypt from "bcryptjs";

import pool from "../db.js";

import {
  authenticateToken,
  requirePartner,
} from "../middleware/authMiddleware.js";

const router = express.Router();

/* =========================================================
   ALL PARTNER ROUTES
========================================================= */

router.use(authenticateToken);
router.use(requirePartner);


/* =========================================================
   GET PARTNER PROFILE
   GET /api/partner/profile
========================================================= */

router.get("/profile", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        id,
        name,
        email,
        company_name,
        phone,
        profile_photo,
        role,
        is_active,
        created_at,
        updated_at
      FROM users
      WHERE id = $1
        AND role = 'PARTNER'
      LIMIT 1
      `,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Partner not found.",
      });
    }

    return res.json({
      success: true,
      user: result.rows[0],
    });
  } catch (error) {
    console.error(
      "GET PARTNER PROFILE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load profile.",
    });
  }
});


/* =========================================================
   GET PARTNER PROFILE REQUESTS
   GET /api/partner/profile-requests
========================================================= */

router.get(
  "/profile-requests",
  async (req, res) => {
    try {
      const result = await pool.query(
        `
        SELECT
          id,
          partner_id,

          requested_name,
          requested_company_name,
          requested_phone,
          requested_profile_photo,

          status,
          admin_id,
          admin_note,

          created_at,
          reviewed_at

        FROM partner_profile_requests

        WHERE partner_id = $1

        ORDER BY created_at DESC
        `,
        [req.user.id]
      );

      return res.json({
        success: true,
        requests: result.rows,
      });
    } catch (error) {
      console.error(
        "GET PARTNER PROFILE REQUESTS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load profile requests.",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : undefined,
      });
    }
  }
);


/* =========================================================
   SUBMIT PROFILE CHANGE REQUEST
   POST /api/partner/profile-request

   Allowed:
   - name
   - company_name
   - phone
   - profile_photo
   - password

   NOT ALLOWED:
   - email
   - role
   - is_active
========================================================= */

router.post(
  "/profile-request",
  async (req, res) => {
    try {
      const partnerId = req.user.id;

      const {
        name,
        company_name,
        phone,
        profile_photo,
        password,
      } = req.body;


      /* =====================================================
         GET CURRENT PARTNER
      ===================================================== */

      const partnerResult =
        await pool.query(
          `
          SELECT
            id,
            name,
            email,
            company_name,
            phone,
            profile_photo,
            role,
            is_active

          FROM users

          WHERE id = $1
            AND role = 'PARTNER'

          LIMIT 1
          `,
          [partnerId]
        );


      if (partnerResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message:
            "Partner account not found.",
        });
      }


      const currentPartner =
        partnerResult.rows[0];


      /* =====================================================
         CHECK ACCOUNT
      ===================================================== */

      if (!currentPartner.is_active) {
        return res.status(403).json({
          success: false,
          message:
            "Your partner account is inactive.",
        });
      }


      /* =====================================================
         CHECK EXISTING PENDING REQUEST
      ===================================================== */

      const pendingResult =
        await pool.query(
          `
          SELECT id

          FROM partner_profile_requests

          WHERE partner_id = $1
            AND status = 'PENDING'

          LIMIT 1
          `,
          [partnerId]
        );


      if (pendingResult.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message:
            "You already have a profile change request waiting for admin approval.",
          request_id:
            pendingResult.rows[0].id,
        });
      }


      /* =====================================================
         REQUESTED VALUES
      ===================================================== */

      const requestedName =
        typeof name === "string"
          ? name.trim()
          : currentPartner.name;


      const requestedCompany =
        typeof company_name === "string"
          ? company_name.trim()
          : currentPartner.company_name;


      const requestedPhone =
        typeof phone === "string"
          ? phone.trim() || null
          : currentPartner.phone;


      const requestedPhoto =
        typeof profile_photo === "string"
          ? profile_photo.trim() || null
          : currentPartner.profile_photo;


      /* =====================================================
         VALIDATION
      ===================================================== */

      if (!requestedName) {
        return res.status(400).json({
          success: false,
          message:
            "Partner name is required.",
        });
      }


      if (!requestedCompany) {
        return res.status(400).json({
          success: false,
          message:
            "Company name is required.",
        });
      }


      /* =====================================================
         PHOTO VALIDATION
      ===================================================== */

      if (requestedPhoto) {
        if (
          !requestedPhoto.startsWith(
            "data:image/"
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid profile photo format.",
          });
        }

        if (
          requestedPhoto.length >
          6 * 1024 * 1024
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Profile photo is too large.",
          });
        }
      }


      /* =====================================================
         PASSWORD
      ===================================================== */

      let requestedPasswordHash =
        null;

      if (
        typeof password === "string" &&
        password.trim()
      ) {
        if (password.length < 6) {
          return res.status(400).json({
            success: false,
            message:
              "Password must contain at least 6 characters.",
          });
        }

        requestedPasswordHash =
          await bcrypt.hash(
            password,
            12
          );
      }


      /* =====================================================
         CHECK ACTUAL CHANGES
      ===================================================== */

      const currentName =
        currentPartner.name || "";

      const currentCompany =
        currentPartner.company_name || "";

      const currentPhone =
        currentPartner.phone || "";

      const currentPhoto =
        currentPartner.profile_photo || "";

      const changed =
        requestedName !== currentName ||
        requestedCompany !== currentCompany ||
        requestedPhone !== currentPhone ||
        requestedPhoto !== currentPhoto ||
        requestedPasswordHash !== null;


      if (!changed) {
        return res.status(400).json({
          success: false,
          message:
            "No changes were made.",
        });
      }


      /* =====================================================
         INSERT REQUEST
      ===================================================== */

      const result =
        await pool.query(
          `
          INSERT INTO partner_profile_requests
          (
            partner_id,

            requested_name,

            requested_company_name,

            requested_phone,

            requested_profile_photo,

            requested_password_hash,

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
            'PENDING',
            CURRENT_TIMESTAMP
          )

          RETURNING
            id,
            partner_id,
            requested_name,
            requested_company_name,
            requested_phone,
            requested_profile_photo,
            status,
            created_at
          `,
          [
            partnerId,
            requestedName,
            requestedCompany,
            requestedPhone,
            requestedPhoto,
            requestedPasswordHash,
          ]
        );


      return res.status(201).json({
        success: true,

        message:
          "Profile changes submitted for admin approval.",

        request:
          result.rows[0],
      });

    } catch (error) {
      console.error(
        "SUBMIT PARTNER PROFILE REQUEST ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to submit profile change request.",

        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : undefined,
      });
    }
  }
);


/* =========================================================
   PARTNER DASHBOARD
   GET /api/partner/dashboard
========================================================= */

router.get(
  "/dashboard",
  async (req, res) => {
    try {
      const partnerId = req.user.id;


      const profile =
        await pool.query(
          `
          SELECT
            id,
            name,
            email,
            company_name,
            phone,
            profile_photo,
            role,
            is_active

          FROM users

          WHERE id = $1
            AND role = 'PARTNER'
          `,
          [partnerId]
        );


      const customers =
        await pool.query(
          `
          SELECT COUNT(*)::int AS count

          FROM customers

          WHERE partner_id = $1
          `,
          [partnerId]
        );


      const campaigns =
        await pool.query(
          `
          SELECT COUNT(*)::int AS count

          FROM campaigns

          WHERE partner_id = $1
          `,
          [partnerId]
        );


      const messages =
        await pool.query(
          `
          SELECT COUNT(*)::int AS count

          FROM messages

          WHERE partner_id = $1
          `,
          [partnerId]
        );


      const delivered =
        await pool.query(
          `
          SELECT COUNT(*)::int AS count

          FROM messages

          WHERE partner_id = $1
            AND UPPER(status) = 'DELIVERED'
          `,
          [partnerId]
        );


      const failed =
        await pool.query(
          `
          SELECT COUNT(*)::int AS count

          FROM messages

          WHERE partner_id = $1
            AND UPPER(status) = 'FAILED'
          `,
          [partnerId]
        );


      const pendingRequest =
        await pool.query(
          `
          SELECT
            id,
            status,
            admin_note,
            created_at,
            reviewed_at

          FROM partner_profile_requests

          WHERE partner_id = $1

          ORDER BY created_at DESC

          LIMIT 1
          `,
          [partnerId]
        );


      return res.json({
        success: true,

        user:
          profile.rows.length > 0
            ? profile.rows[0]
            : null,

        stats: {
          customers:
            customers.rows[0].count,

          campaigns:
            campaigns.rows[0].count,

          messages:
            messages.rows[0].count,

          delivered:
            delivered.rows[0].count,

          failed:
            failed.rows[0].count,
        },

        profile_request:
          pendingRequest.rows.length > 0
            ? pendingRequest.rows[0]
            : null,
      });

    } catch (error) {
      console.error(
        "PARTNER DASHBOARD ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load partner dashboard.",
      });
    }
  }
);


/* =========================================================
   PARTNER CUSTOMERS
   GET /api/partner/customers
========================================================= */

router.get(
  "/customers",
  async (req, res) => {
    try {
      const result =
        await pool.query(
          `
          SELECT
            id,
            customer_name,
            phone,
            due_date,
            start_date,
            end_date,
            gender,
            age,
            subscription,
            created_at,
            updated_at

          FROM customers

          WHERE partner_id = $1

          ORDER BY created_at DESC
          `,
          [req.user.id]
        );


      return res.json({
        success: true,
        customers:
          result.rows,
      });

    } catch (error) {
      console.error(
        "PARTNER CUSTOMERS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load customers.",
      });
    }
  }
);


/* =========================================================
   PARTNER CAMPAIGNS
   GET /api/partner/campaigns
========================================================= */

router.get(
  "/campaigns",
  async (req, res) => {
    try {
      const result =
        await pool.query(
          `
          SELECT
            id,
            template_name,
            language_code,
            total_count,
            accepted_count,
            sent_count,
            delivered_count,
            failed_count,
            created_at

          FROM campaigns

          WHERE partner_id = $1

          ORDER BY created_at DESC
          `,
          [req.user.id]
        );


      return res.json({
        success: true,
        campaigns:
          result.rows,
      });

    } catch (error) {
      console.error(
        "PARTNER CAMPAIGNS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load campaigns.",
      });
    }
  }
);


/* =========================================================
   PARTNER MESSAGES
   GET /api/partner/messages
========================================================= */

router.get(
  "/messages",
  async (req, res) => {
    try {
      const result =
        await pool.query(
          `
          SELECT
            m.id,
            m.phone,
            m.template_name,
            m.message_id,
            m.status,
            m.error,
            m.sent_at,
            m.delivered_at,
            m.failed_at,
            m.created_at,

            c.customer_name

          FROM messages m

          LEFT JOIN customers c
            ON c.id = m.customer_id

          WHERE m.partner_id = $1

          ORDER BY m.created_at DESC
          `,
          [req.user.id]
        );


      return res.json({
        success: true,
        messages:
          result.rows,
      });

    } catch (error) {
      console.error(
        "PARTNER MESSAGES ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load messages.",
      });
    }
  }
);


export default router;