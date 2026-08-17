import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import pool from "../db.js";


const router =
  express.Router();


/* =========================================================
   JWT
========================================================= */

const JWT_SECRET =
  process.env.JWT_SECRET;


if (!JWT_SECRET) {
  console.warn(
    "WARNING: JWT_SECRET is not configured in .env"
  );
}


/* =========================================================
   CREATE JWT
========================================================= */

function createToken(user) {
  return jwt.sign(
    {
      id:
        user.id,

      role:
        user.role,

      email:
        user.email,
    },

    JWT_SECRET,

    {
      expiresIn:
        "7d",
    }
  );
}


/* =========================================================
   LOGIN

   POST /api/auth/login
========================================================= */

router.post(
  "/login",
  async (
    req,
    res
  ) => {
    try {
      const {
        email,
        password,
      } =
        req.body;


      if (
        !email ||
        !password
      ) {
        return res.status(
          400
        ).json({
          success: false,

          message:
            "Email and password are required.",
        });
      }


      const cleanEmail =
        String(
          email
        )
          .trim()
          .toLowerCase();


      const result =
        await pool.query(
          `
          SELECT
            id,
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

          FROM users

          WHERE
            LOWER(email) =
            LOWER($1)

          LIMIT 1
          `,
          [
            cleanEmail,
          ]
        );


      if (
        result.rows.length ===
        0
      ) {
        return res.status(
          401
        ).json({
          success: false,

          message:
            "Invalid email or password.",
        });
      }


      const user =
        result.rows[0];


      if (
        !user.is_active
      ) {
        return res.status(
          403
        ).json({
          success: false,

          message:
            "Your account is currently inactive.",
        });
      }


      const passwordValid =
        await bcrypt.compare(
          password,
          user.password_hash
        );


      if (
        !passwordValid
      ) {
        return res.status(
          401
        ).json({
          success: false,

          message:
            "Invalid email or password.",
        });
      }


      const token =
        createToken(
          user
        );


      const safeUser = {
        id:
          user.id,

        name:
          user.name,

        email:
          user.email,

        role:
          user.role,

        company_name:
          user.company_name,

        phone:
          user.phone,

        profile_photo:
          user.profile_photo,

        is_active:
          user.is_active,

        created_at:
          user.created_at,

        updated_at:
          user.updated_at,
      };


      return res.json({
        success: true,

        token,

        user:
          safeUser,
      });

    } catch (error) {
      console.error(
        "LOGIN ERROR:",
        error
      );


      return res.status(
        500
      ).json({
        success: false,

        message:
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
  async (
    req,
    res
  ) => {
    /*
     * This route reads the JWT directly
     * so it doesn't depend on router ordering.
     */

    try {
      const authorization =
        req.headers.authorization ||
        "";


      if (
        !authorization.startsWith(
          "Bearer "
        )
      ) {
        return res.status(
          401
        ).json({
          success: false,

          message:
            "Authentication required.",
        });
      }


      const token =
        authorization.replace(
          "Bearer ",
          ""
        );


      const decoded =
        jwt.verify(
          token,
          JWT_SECRET
        );


      const result =
        await pool.query(
          `
          SELECT
            id,
            name,
            email,
            role,
            company_name,
            phone,
            profile_photo,
            is_active,
            created_at,
            updated_at

          FROM users

          WHERE
            id = $1

          LIMIT 1
          `,
          [
            decoded.id,
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
            "User not found.",
        });
      }


      const user =
        result.rows[0];


      if (
        !user.is_active
      ) {
        return res.status(
          403
        ).json({
          success: false,

          message:
            "Account is inactive.",
        });
      }


      return res.json({
        success: true,

        user,
      });

    } catch (error) {
      console.error(
        "AUTH ME ERROR:",
        error
      );


      return res.status(
        401
      ).json({
        success: false,

        message:
          "Invalid or expired token.",
      });
    }
  }
);


/* =========================================================
   PARTNER SELF-SIGNUP

   POST /api/auth/partner-signup

   PAYMENT MUST ALREADY BE VERIFIED.
========================================================= */

/* =========================================================
   PARTNER SIGNUP

   TEMPORARY FLOW:
   no_payment = true
   -> create pending application directly

   PRODUCTION FLOW:
   no_payment = false
   -> verified Razorpay payment required
========================================================= */

router.post(
  "/partner-signup",
  async (req, res) => {
    const client =
      await pool.connect();

    try {
      const {
        payment_token,
        no_payment,
        plan_key,
        plan_name,
        name,
        email,
        password,
        company_name,
        phone,
        profile_photo,
      } = req.body;

      const isNoPayment =
        no_payment === true ||
        no_payment === "true";


      /* =====================================================
         BASIC VALIDATION
      ===================================================== */

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


      if (
        password.length < 6
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Password must contain at least 6 characters.",
        });
      }


      const cleanEmail =
        String(email)
          .trim()
          .toLowerCase();


      /* =====================================================
         CHECK EXISTING USER
      ===================================================== */

      const existingUser =
        await client.query(
          `
          SELECT
            id,
            role

          FROM users

          WHERE
            LOWER(email) =
            LOWER($1)

          LIMIT 1
          `,
          [cleanEmail]
        );


      if (
        existingUser.rows.length > 0
      ) {
        return res.status(409).json({
          success: false,
          message:
            "An account with this email already exists.",
        });
      }


      /* =====================================================
         CHECK EXISTING PENDING APPLICATION
      ===================================================== */

      const existingApplication =
        await client.query(
          `
          SELECT
            id,
            status

          FROM partner_signup_requests

          WHERE
            LOWER(email) =
            LOWER($1)

          ORDER BY
            created_at DESC

          LIMIT 1
          `,
          [cleanEmail]
        );


      if (
        existingApplication.rows.length > 0
      ) {
        const existing =
          existingApplication.rows[0];

        if (
          existing.status ===
          "PENDING"
        ) {
          return res.status(409).json({
            success: false,
            message:
              "A partner application with this email is already pending.",
          });
        }
      }


      /* =====================================================
         PASSWORD HASH
      ===================================================== */

      const passwordHash =
        await bcrypt.hash(
          password,
          12
        );


      /* =====================================================
         BEGIN TRANSACTION
      ===================================================== */

      await client.query(
        "BEGIN"
      );


      /* =====================================================
         NO-PAYMENT FLOW
      ===================================================== */

      if (isNoPayment) {

        const selectedPlanKey =
          String(
            plan_key || "solo"
          )
            .trim()
            .toLowerCase();


        const allowedPlans = [
          "solo",
          "pro",
          "business",
        ];


        if (
          !allowedPlans.includes(
            selectedPlanKey
          )
        ) {
          await client.query(
            "ROLLBACK"
          );

          return res.status(400).json({
            success: false,
            message:
              "Invalid plan selected.",
          });
        }


        const selectedPlanName =
          String(
            plan_name ||
              selectedPlanKey
                .charAt(0)
                .toUpperCase() +
                selectedPlanKey.slice(1)
          ).trim();


        const result =
          await client.query(
            `
            INSERT INTO partner_signup_requests
            (
              payment_session_id,

              payment_token,

              plan_key,

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
              NULL,

              NULL,

              $1,

              $2,

              $3,

              $4,

              $5,

              $6,

              $7,

              $8,

              'PENDING',

              CURRENT_TIMESTAMP
            )

            RETURNING
              id,

              plan_key,

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
              selectedPlanKey,

              selectedPlanName,

              String(
                name
              ).trim(),

              cleanEmail,

              passwordHash,

              String(
                company_name
              ).trim(),

              phone
                ? String(phone).trim()
                : null,

              profile_photo ||
                null,
            ]
          );


        await client.query(
          "COMMIT"
        );


        return res.status(201).json({
          success: true,

          message:
            "Partner application submitted successfully. Your account is waiting for admin approval.",

          application:
            result.rows[0],
        });
      }


      /* =====================================================
         REAL RAZORPAY FLOW
      ===================================================== */

      if (!payment_token) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(400).json({
          success: false,
          message:
            "A verified payment is required.",
        });
      }


      /* =====================================================
         LOCK PAYMENT SESSION
      ===================================================== */

      const paymentResult =
        await client.query(
          `
          SELECT
            id,
            payment_token,
            plan_key,
            plan_name,
            status,
            used_at

          FROM partner_payment_sessions

          WHERE
            payment_token = $1

          FOR UPDATE
          `,
          [payment_token]
        );


      if (
        paymentResult.rows.length === 0
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(400).json({
          success: false,
          message:
            "Payment session not found.",
        });
      }


      const payment =
        paymentResult.rows[0];


      if (
        payment.status !==
        "PAID"
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(400).json({
          success: false,
          message:
            "Payment has not been confirmed.",
        });
      }


      if (
        payment.used_at
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(409).json({
          success: false,
          message:
            "This payment has already been used.",
        });
      }


      /* =====================================================
         CREATE APPLICATION AFTER PAYMENT
      ===================================================== */

      const result =
        await client.query(
          `
          INSERT INTO partner_signup_requests
          (
            payment_session_id,

            payment_token,

            plan_key,

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

            $8,

            $9,

            $10,

            'PENDING',

            CURRENT_TIMESTAMP
          )

          RETURNING
            id,

            payment_session_id,

            payment_token,

            plan_key,

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
            payment.id,

            payment.payment_token,

            payment.plan_key,

            payment.plan_name,

            String(
              name
            ).trim(),

            cleanEmail,

            passwordHash,

            String(
              company_name
            ).trim(),

            phone
              ? String(phone).trim()
              : null,

            profile_photo ||
              null,
          ]
        );


      /* =====================================================
         MARK PAYMENT USED
      ===================================================== */

      await client.query(
        `
        UPDATE partner_payment_sessions

        SET
          used_at =
            CURRENT_TIMESTAMP

        WHERE
          id = $1
        `,
        [payment.id]
      );


      await client.query(
        "COMMIT"
      );


      return res.status(201).json({
        success: true,

        message:
          "Partner application submitted successfully. Your account is waiting for admin approval.",

        application:
          result.rows[0],
      });

    } catch (error) {

      await client.query(
        "ROLLBACK"
      );

      console.error(
        "PARTNER SIGNUP ERROR:",
        error
      );


      if (
        error.code ===
        "23505"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "A partner application or account already exists for this email.",
        });
      }


      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to submit partner application.",
      });

    } finally {
      client.release();
    }
  }
);


export default router;