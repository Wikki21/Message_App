import express from "express";
import bcrypt from "bcryptjs";

import pool from "../db.js";

import {
  authenticateToken,
  requireAdmin,
} from "../middleware/authMiddleware.js";

const router = express.Router();


/* =========================================================
   ALL ADMIN ROUTES
========================================================= */

router.use(authenticateToken);
router.use(requireAdmin);


/* =========================================================
   ADMIN DASHBOARD
   GET /api/admin/dashboard
========================================================= */

router.get(
  "/dashboard",
  async (req, res) => {
    try {
      const partnersResult =
        await pool.query(`
          SELECT COUNT(*)::int AS count
          FROM users
          WHERE role = 'PARTNER'
        `);

      const customersResult =
        await pool.query(`
          SELECT COUNT(*)::int AS count
          FROM customers
        `);

      const campaignsResult =
        await pool.query(`
          SELECT COUNT(*)::int AS count
          FROM campaigns
        `);

      const messagesResult =
        await pool.query(`
          SELECT COUNT(*)::int AS count
          FROM messages
        `);

      const pendingApplicationsResult =
        await pool.query(`
          SELECT COUNT(*)::int AS count
          FROM partner_signup_requests
          WHERE status = 'PENDING'
        `);

      const pendingProfileRequestsResult =
        await pool.query(`
          SELECT COUNT(*)::int AS count
          FROM partner_profile_requests
          WHERE status = 'PENDING'
        `);

      return res.json({
        success: true,

        stats: {
          partners:
            partnersResult.rows[0].count,

          customers:
            customersResult.rows[0].count,

          campaigns:
            campaignsResult.rows[0].count,

          messages:
            messagesResult.rows[0].count,

          pending_partner_applications:
            pendingApplicationsResult
              .rows[0]
              .count,

          pending_profile_requests:
            pendingProfileRequestsResult
              .rows[0]
              .count,
        },
      });
    } catch (error) {
      console.error(
        "ADMIN DASHBOARD ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load admin dashboard.",
      });
    }
  }
);


/* =========================================================
   GET ALL PARTNERS
   GET /api/admin/partners
========================================================= */

router.get(
  "/partners",
  async (req, res) => {
    try {
      const result =
        await pool.query(`
          SELECT
            u.id,
            u.name,
            u.email,
            u.company_name,
            u.phone,
            u.profile_photo,
            u.role,
            u.is_active,
            u.created_at,
            u.updated_at,

            (
              SELECT COUNT(*)
              FROM customers c
              WHERE c.partner_id = u.id
            ) AS customer_count,

            (
              SELECT COUNT(*)
              FROM campaigns ca
              WHERE ca.partner_id = u.id
            ) AS campaign_count

          FROM users u

          WHERE u.role = 'PARTNER'

          ORDER BY u.created_at DESC
        `);

      return res.json({
        success: true,
        partners: result.rows,
      });
    } catch (error) {
      console.error(
        "GET PARTNERS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load partners.",
      });
    }
  }
);


/* =========================================================
   ADMIN CREATED PARTNER
   POST /api/admin/partners
========================================================= */

router.post(
  "/partners",
  async (req, res) => {
    try {
      const {
        name,
        email,
        password,
        company_name,
        phone,
      } = req.body;

      if (
        !name ||
        !email ||
        !password ||
        !company_name
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Name, email, password and company name are required.",
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message:
            "Password must contain at least 6 characters.",
        });
      }

      const cleanEmail =
        email.trim().toLowerCase();

      const existing =
        await pool.query(
          `
          SELECT id
          FROM users
          WHERE LOWER(email) = LOWER($1)
          LIMIT 1
          `,
          [cleanEmail]
        );

      if (existing.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message:
            "Email already exists.",
        });
      }

      const passwordHash =
        await bcrypt.hash(
          password,
          12
        );

      const result =
        await pool.query(
          `
          INSERT INTO users
          (
            name,
            email,
            password_hash,
            role,
            company_name,
            phone,
            profile_photo,
            is_active,
            created_at,
            updated_at
          )
          VALUES
          (
            $1,
            $2,
            $3,
            'PARTNER',
            $4,
            $5,
            NULL,
            true,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
          )
          RETURNING
            id,
            name,
            email,
            role,
            company_name,
            phone,
            profile_photo,
            is_active,
            created_at
          `,
          [
            name.trim(),
            cleanEmail,
            passwordHash,
            company_name.trim(),
            phone
              ? phone.trim()
              : null,
          ]
        );

      return res.status(201).json({
        success: true,
        message:
          "Partner created successfully.",
        partner:
          result.rows[0],
      });
    } catch (error) {
      console.error(
        "CREATE PARTNER ERROR:",
        error
      );

      if (error.code === "23505") {
        return res.status(409).json({
          success: false,
          message:
            "Email already exists.",
        });
      }

      return res.status(500).json({
        success: false,
        message:
          "Failed to create partner.",
      });
    }
  }
);


/* =========================================================
   ENABLE / DISABLE PARTNER
   PATCH /api/admin/partners/:id/status
========================================================= */

router.patch(
  "/partners/:id/status",
  async (req, res) => {
    try {
      const {
        is_active,
      } = req.body;

      const result =
        await pool.query(
          `
          UPDATE users
          SET
            is_active = $1,
            updated_at =
              CURRENT_TIMESTAMP
          WHERE
            id = $2
            AND role = 'PARTNER'
          RETURNING
            id,
            name,
            email,
            role,
            company_name,
            phone,
            profile_photo,
            is_active
          `,
          [
            Boolean(is_active),
            req.params.id,
          ]
        );

      if (
        result.rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Partner not found.",
        });
      }

      return res.json({
        success: true,
        partner:
          result.rows[0],
      });
    } catch (error) {
      console.error(
        "PARTNER STATUS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update partner.",
      });
    }
  }
);


/* =========================================================
   GET PARTNER SIGNUP APPLICATIONS

   GET /api/admin/partner-applications
========================================================= */

router.get(
  "/partner-applications",
  async (req, res) => {
    try {
      const result =
        await pool.query(
          `
          SELECT
            a.id,
            a.plan_name,
            a.name,
            a.email,
            a.company_name,
            a.phone,
            a.profile_photo,
            a.status,
            a.admin_id,
            a.admin_note,
            a.created_at,
            a.reviewed_at,

            admin_user.name
              AS admin_name

          FROM partner_signup_requests a

          LEFT JOIN users admin_user
            ON admin_user.id = a.admin_id

          ORDER BY
            CASE
              WHEN a.status = 'PENDING'
              THEN 0
              ELSE 1
            END,

            a.created_at DESC
          `
        );

      return res.json({
        success: true,
        applications:
          result.rows,
      });
    } catch (error) {
      console.error(
        "GET PARTNER APPLICATIONS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load partner applications.",
      });
    }
  }
);


/* =========================================================
   GET SINGLE PARTNER APPLICATION

   GET /api/admin/partner-applications/:id
========================================================= */

router.get(
  "/partner-applications/:id",
  async (req, res) => {
    try {
      const result =
        await pool.query(
          `
          SELECT
            id,
            plan_name,
            name,
            email,
            company_name,
            phone,
            profile_photo,
            status,
            admin_id,
            admin_note,
            created_at,
            reviewed_at
          FROM partner_signup_requests
          WHERE id = $1
          `,
          [req.params.id]
        );

      if (
        result.rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Partner application not found.",
        });
      }

      return res.json({
        success: true,
        application:
          result.rows[0],
      });
    } catch (error) {
      console.error(
        "GET PARTNER APPLICATION ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load partner application.",
      });
    }
  }
);


/* =========================================================
   APPROVE PARTNER APPLICATION

   PATCH
   /api/admin/partner-applications/:id/approve
========================================================= */

router.patch(
  "/partner-applications/:id/approve",
  async (req, res) => {
    const client =
      await pool.connect();

    try {
      await client.query(
        "BEGIN"
      );

      /* ---------------------------------------------------
         LOCK APPLICATION
      --------------------------------------------------- */

      const applicationResult =
        await client.query(
          `
          SELECT
            id,
            plan_name,
            name,
            email,
            password_hash,
            company_name,
            phone,
            profile_photo,
            status
          FROM partner_signup_requests
          WHERE id = $1
          FOR UPDATE
          `,
          [req.params.id]
        );

      if (
        applicationResult.rows.length ===
        0
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(404).json({
          success: false,
          message:
            "Partner application not found.",
        });
      }

      const application =
        applicationResult.rows[0];

      /* ---------------------------------------------------
         CHECK STATUS
      --------------------------------------------------- */

      if (
        application.status !==
        "PENDING"
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(409).json({
          success: false,
          message:
            `This application has already been ${application.status.toLowerCase()}.`,
        });
      }

      /* ---------------------------------------------------
         CHECK EMAIL
      --------------------------------------------------- */

      const existingUser =
        await client.query(
          `
          SELECT id
          FROM users
          WHERE LOWER(email) = LOWER($1)
          LIMIT 1
          `,
          [application.email]
        );

      if (
        existingUser.rows.length >
        0
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(409).json({
          success: false,
          message:
            "A user with this email already exists.",
        });
      }

      /* ---------------------------------------------------
         CREATE ACTUAL PARTNER ACCOUNT
      --------------------------------------------------- */

      const partnerResult =
        await client.query(
          `
          INSERT INTO users
          (
            name,
            email,
            password_hash,
            role,
            company_name,
            phone,
            profile_photo,
            is_active,
            created_at,
            updated_at
          )
          VALUES
          (
            $1,
            $2,
            $3,
            'PARTNER',
            $4,
            $5,
            $6,
            true,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
          )
          RETURNING
            id,
            name,
            email,
            role,
            company_name,
            phone,
            profile_photo,
            is_active,
            created_at
          `,
          [
            application.name,
            application.email,
            application.password_hash,
            application.company_name,
            application.phone,
            application.profile_photo,
          ]
        );

      /* ---------------------------------------------------
         UPDATE APPLICATION
      --------------------------------------------------- */

      const adminNote =
        typeof req.body.note ===
        "string"
          ? req.body.note.trim()
          : null;

      await client.query(
        `
        UPDATE partner_signup_requests
        SET
          status = 'APPROVED',
          admin_id = $1,
          admin_note = $2,
          reviewed_at =
            CURRENT_TIMESTAMP
        WHERE id = $3
        `,
        [
          req.user.id,
          adminNote,
          application.id,
        ]
      );

      await client.query(
        "COMMIT"
      );

      return res.json({
        success: true,

        message:
          "Partner application approved. Partner account has been created.",

        partner:
          partnerResult.rows[0],
      });
    } catch (error) {
      await client.query(
        "ROLLBACK"
      );

      console.error(
        "APPROVE PARTNER APPLICATION ERROR:",
        error
      );

      if (
        error.code === "23505"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "A partner account with this email already exists.",
        });
      }

      return res.status(500).json({
        success: false,
        message:
          "Failed to approve partner application.",
      });
    } finally {
      client.release();
    }
  }
);


/* =========================================================
   REJECT PARTNER APPLICATION

   PATCH
   /api/admin/partner-applications/:id/reject
========================================================= */

router.patch(
  "/partner-applications/:id/reject",
  async (req, res) => {
    try {
      const adminNote =
        typeof req.body.note ===
        "string"
          ? req.body.note.trim()
          : "";

      const result =
        await pool.query(
          `
          UPDATE partner_signup_requests
          SET
            status = 'REJECTED',
            admin_id = $1,
            admin_note = $2,
            reviewed_at =
              CURRENT_TIMESTAMP
          WHERE
            id = $3
            AND status = 'PENDING'
          RETURNING
            id,
            name,
            email,
            plan_name,
            status,
            admin_note,
            reviewed_at
          `,
          [
            req.user.id,
            adminNote ||
              "Partner application rejected by admin.",
            req.params.id,
          ]
        );

      if (
        result.rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Pending partner application not found.",
        });
      }

      return res.json({
        success: true,

        message:
          "Partner application rejected.",

        application:
          result.rows[0],
      });
    } catch (error) {
      console.error(
        "REJECT PARTNER APPLICATION ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to reject partner application.",
      });
    }
  }
);


/* =========================================================
   PARTNER PROFILE CHANGE REQUESTS
========================================================= */


/* =========================================================
   GET PROFILE REQUESTS

   GET /api/admin/profile-requests
========================================================= */

router.get(
  "/profile-requests",
  async (req, res) => {
    try {
      const result =
        await pool.query(
          `
          SELECT
            r.id,
            r.partner_id,
            r.requested_name,
            r.requested_company_name,
            r.requested_phone,
            r.requested_profile_photo,
            r.status,
            r.admin_id,
            r.admin_note,
            r.created_at,
            r.reviewed_at,

            u.name
              AS current_name,

            u.email
              AS current_email,

            u.company_name
              AS current_company_name,

            u.phone
              AS current_phone,

            u.profile_photo
              AS current_profile_photo

          FROM partner_profile_requests r

          INNER JOIN users u
            ON u.id = r.partner_id

          ORDER BY
            CASE
              WHEN r.status = 'PENDING'
              THEN 0
              ELSE 1
            END,

            r.created_at DESC
          `
        );

      return res.json({
        success: true,
        requests:
          result.rows,
      });
    } catch (error) {
      console.error(
        "GET PROFILE REQUESTS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load profile requests.",
      });
    }
  }
);


/* =========================================================
   APPROVE PROFILE CHANGE REQUEST

   PATCH
   /api/admin/profile-requests/:id/approve
========================================================= */

router.patch(
  "/profile-requests/:id/approve",
  async (req, res) => {
    const client =
      await pool.connect();

    try {
      await client.query(
        "BEGIN"
      );

      const requestResult =
        await client.query(
          `
          SELECT
            id,
            partner_id,
            requested_name,
            requested_company_name,
            requested_phone,
            requested_profile_photo,
            requested_password_hash,
            status
          FROM partner_profile_requests
          WHERE id = $1
          FOR UPDATE
          `,
          [req.params.id]
        );

      if (
        requestResult.rows.length ===
        0
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(404).json({
          success: false,
          message:
            "Profile request not found.",
        });
      }

      const request =
        requestResult.rows[0];

      if (
        request.status !==
        "PENDING"
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(409).json({
          success: false,
          message:
            `This request has already been ${request.status.toLowerCase()}.`,
        });
      }

      const adminNote =
        typeof req.body.note ===
        "string"
          ? req.body.note.trim()
          : null;

      const updatedPartner =
        await client.query(
          `
          UPDATE users
          SET
            name = $1,
            company_name = $2,
            phone = $3,
            profile_photo = $4,
            password_hash =
              COALESCE(
                $5,
                password_hash
              ),
            updated_at =
              CURRENT_TIMESTAMP
          WHERE
            id = $6
            AND role = 'PARTNER'
          RETURNING
            id,
            name,
            email,
            company_name,
            phone,
            profile_photo,
            role,
            is_active,
            updated_at
          `,
          [
            request.requested_name,
            request.requested_company_name,
            request.requested_phone,
            request.requested_profile_photo,
            request.requested_password_hash,
            request.partner_id,
          ]
        );

      if (
        updatedPartner.rows.length ===
        0
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(404).json({
          success: false,
          message:
            "Partner account not found.",
        });
      }

      await client.query(
        `
        UPDATE partner_profile_requests
        SET
          status = 'APPROVED',
          admin_id = $1,
          admin_note = $2,
          reviewed_at =
            CURRENT_TIMESTAMP
        WHERE id = $3
        `,
        [
          req.user.id,
          adminNote,
          request.id,
        ]
      );

      await client.query(
        "COMMIT"
      );

      return res.json({
        success: true,

        message:
          "Partner profile changes approved.",

        partner:
          updatedPartner.rows[0],
      });
    } catch (error) {
      await client.query(
        "ROLLBACK"
      );

      console.error(
        "APPROVE PROFILE REQUEST ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to approve profile request.",
      });
    } finally {
      client.release();
    }
  }
);


/* =========================================================
   REJECT PROFILE CHANGE REQUEST

   PATCH
   /api/admin/profile-requests/:id/reject
========================================================= */

router.patch(
  "/profile-requests/:id/reject",
  async (req, res) => {
    try {
      const adminNote =
        typeof req.body.note ===
        "string"
          ? req.body.note.trim()
          : "Profile change request rejected by admin.";

      const result =
        await pool.query(
          `
          UPDATE partner_profile_requests
          SET
            status = 'REJECTED',
            admin_id = $1,
            admin_note = $2,
            reviewed_at =
              CURRENT_TIMESTAMP
          WHERE
            id = $3
            AND status = 'PENDING'
          RETURNING
            id,
            partner_id,
            status,
            admin_note,
            reviewed_at
          `,
          [
            req.user.id,
            adminNote,
            req.params.id,
          ]
        );

      if (
        result.rows.length ===
        0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Pending profile request not found.",
        });
      }

      return res.json({
        success: true,

        message:
          "Partner profile change request rejected.",

        request:
          result.rows[0],
      });
    } catch (error) {
      console.error(
        "REJECT PROFILE REQUEST ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to reject profile request.",
      });
    }
  }
);


export default router;
