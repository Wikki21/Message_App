import express from "express";
import bcrypt from "bcryptjs";

import pool from "../db.js";

import {
  loginUser,
} from "../services/authService.js";

import {
  authenticateToken,
} from "../middleware/authMiddleware.js";

const router = express.Router();

/* =========================================================
   PARTNER SELF SIGNUP

   POST /api/auth/partner-signup

   Public route.

   Flow:
   Plan selected
      ↓
   Create account
      ↓
   partner_signup_requests
      ↓
   PENDING
      ↓
   Admin approval
========================================================= */

router.post(
  "/partner-signup",
  async (req, res) => {
    try {
      const {
        plan_name,
        name,
        email,
        password,
        company_name,
        phone,
        profile_photo,
      } = req.body;

      /* =====================================================
         VALIDATION
      ===================================================== */

      if (
        !plan_name ||
        !name ||
        !email ||
        !password ||
        !company_name
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Plan, name, email, password and company name are required.",
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

      /* =====================================================
         CHECK REAL USERS TABLE
      ===================================================== */

      const existingUser =
        await pool.query(
          `
          SELECT
            id,
            email,
            role,
            is_active
          FROM users
          WHERE LOWER(email) = LOWER($1)
          LIMIT 1
          `,
          [cleanEmail]
        );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message:
            "An account already exists with this email.",
        });
      }

      /* =====================================================
         CHECK PENDING APPLICATION
      ===================================================== */

      const pendingRequest =
        await pool.query(
          `
          SELECT
            id,
            status,
            created_at
          FROM partner_signup_requests
          WHERE LOWER(email) = LOWER($1)
            AND status = 'PENDING'
          LIMIT 1
          `,
          [cleanEmail]
        );

      if (pendingRequest.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message:
            "A partner application with this email is already waiting for admin approval.",
        });
      }

      /* =====================================================
         CHECK INVALID PHOTO
      ===================================================== */

      if (profile_photo) {
        if (
          typeof profile_photo !== "string" ||
          !profile_photo.startsWith("data:image/")
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid profile photo.",
          });
        }

        if (profile_photo.length > 6 * 1024 * 1024) {
          return res.status(400).json({
            success: false,
            message:
              "Profile photo is too large.",
          });
        }
      }

      /* =====================================================
         HASH PASSWORD
      ===================================================== */

      const passwordHash =
        await bcrypt.hash(
          password,
          12
        );

      /* =====================================================
         CREATE APPLICATION
      ===================================================== */

      const result =
        await pool.query(
          `
          INSERT INTO partner_signup_requests
          (
            plan_name,
            name,
            email,
            password_hash,
            company_name,
            phone,
            profile_photo,
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
            plan_name,
            name,
            email,
            company_name,
            phone,
            profile_photo,
            status,
            created_at
          `,
          [
            plan_name.trim(),
            name.trim(),
            cleanEmail,
            passwordHash,
            company_name.trim(),
            phone
              ? phone.trim()
              : null,
            profile_photo || null,
          ]
        );

      return res.status(201).json({
        success: true,

        message:
          "Your partner application has been submitted. Approval may take up to 24 hours.",

        application:
          result.rows[0],
      });
    } catch (error) {
      console.error(
        "PARTNER SIGNUP ERROR:",
        error
      );

      if (error.code === "23505") {
        return res.status(409).json({
          success: false,
          message:
            "An application or account already exists with this email.",
        });
      }

      return res.status(500).json({
        success: false,
        message:
          "Failed to submit partner application.",
      });
    }
  }
);


/* =========================================================
   LOGIN

   POST /api/auth/login

   Pending/rejected applications are blocked.
   Approved users login normally.
========================================================= */

router.post(
  "/login",
  async (req, res) => {
    try {
      const {
        email,
        password,
      } = req.body;

      if (
        !email ||
        !password
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Email and password are required.",
        });
      }

      const cleanEmail =
        email.trim().toLowerCase();

      /* ===================================================
         CHECK PENDING PARTNER APPLICATION
      =================================================== */

      const applicationResult =
        await pool.query(
          `
          SELECT
            id,
            status,
            admin_note,
            created_at,
            reviewed_at
          FROM partner_signup_requests
          WHERE LOWER(email) = LOWER($1)
          ORDER BY created_at DESC
          LIMIT 1
          `,
          [cleanEmail]
        );

      if (
        applicationResult.rows.length > 0
      ) {
        const application =
          applicationResult.rows[0];

        if (
          application.status ===
          "PENDING"
        ) {
          return res.status(403).json({
            success: false,
            code:
              "PARTNER_PENDING_APPROVAL",
            message:
              "Your partner account is waiting for admin approval. Approval may take up to 24 hours.",
          });
        }

        if (
          application.status ===
          "REJECTED"
        ) {
          return res.status(403).json({
            success: false,
            code:
              "PARTNER_APPLICATION_REJECTED",
            message:
              application.admin_note ||
              "Your partner application was rejected by the admin.",
          });
        }
      }

      /* ===================================================
         NORMAL LOGIN
      =================================================== */

      const result =
        await loginUser(
          cleanEmail,
          password
        );

      return res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error(
        "LOGIN ERROR:",
        error
      );

      return res.status(401).json({
        success: false,
        message:
          error.message ||
          "Login failed.",
      });
    }
  }
);


/* =========================================================
   CURRENT USER

   GET /api/auth/me
========================================================= */

router.get(
  "/me",
  authenticateToken,
  async (req, res) => {
    try {
      return res.json({
        success: true,
        user: req.user,
      });
    } catch (error) {
      console.error(
        "AUTH ME ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to get user.",
      });
    }
  }
);


export default router;
