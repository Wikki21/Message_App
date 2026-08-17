import express from "express";

import pool from "../db.js";

import {
  authenticateToken,
  requireAdmin,
} from "../middleware/authMiddleware.js";


const router =
  express.Router();


/* =========================================================
   ALL ADMIN ROUTES REQUIRE ADMIN LOGIN
========================================================= */

router.use(
  authenticateToken
);

router.use(
  requireAdmin
);


/* =========================================================
   ADMIN DASHBOARD

   GET /api/admin/dashboard
========================================================= */

router.get(
  "/dashboard",
  async (
    req,
    res
  ) => {
    try {

      /* -----------------------------------------------------
         TOTAL PARTNERS
      ----------------------------------------------------- */

      const partnersResult =
        await pool.query(
          `
          SELECT
            COUNT(*)::int AS count

          FROM users

          WHERE role = 'PARTNER'
          `
        );


      /* -----------------------------------------------------
         TOTAL CUSTOMERS
      ----------------------------------------------------- */

      const customersResult =
        await pool.query(
          `
          SELECT
            COUNT(*)::int AS count

          FROM customers
          `
        );


      /* -----------------------------------------------------
         TOTAL CAMPAIGNS
      ----------------------------------------------------- */

      const campaignsResult =
        await pool.query(
          `
          SELECT
            COUNT(*)::int AS count

          FROM campaigns
          `
        );


      /* -----------------------------------------------------
         TOTAL MESSAGES
      ----------------------------------------------------- */

      const messagesResult =
        await pool.query(
          `
          SELECT
            COUNT(*)::int AS count

          FROM messages
          `
        );


      /* -----------------------------------------------------
         PENDING PARTNER APPLICATIONS
      ----------------------------------------------------- */

      const pendingApplicationsResult =
        await pool.query(
          `
          SELECT
            COUNT(*)::int AS count

          FROM partner_signup_requests

          WHERE status = 'PENDING'
          `
        );


      /* -----------------------------------------------------
         PENDING PROFILE REQUESTS
      ----------------------------------------------------- */

      const pendingProfileRequestsResult =
        await pool.query(
          `
          SELECT
            COUNT(*)::int AS count

          FROM partner_profile_requests

          WHERE status = 'PENDING'
          `
        );


      return res.json({

        success: true,

        stats: {

          partners:
            partnersResult
              .rows[0]
              .count,

          customers:
            customersResult
              .rows[0]
              .count,

          campaigns:
            campaignsResult
              .rows[0]
              .count,

          messages:
            messagesResult
              .rows[0]
              .count,

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


      return res.status(
        500
      ).json({

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
  async (
    req,
    res
  ) => {
    try {

      const result =
        await pool.query(
          `
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
              SELECT
                COUNT(*)

              FROM customers c

              WHERE
                c.partner_id =
                u.id

            ) AS customer_count,


            (
              SELECT
                COUNT(*)

              FROM campaigns ca

              WHERE
                ca.partner_id =
                u.id

            ) AS campaign_count


          FROM users u


          WHERE
            u.role = 'PARTNER'


          ORDER BY
            u.created_at DESC
          `
        );


      return res.json({

        success: true,

        partners:
          result.rows,

      });

    } catch (error) {

      console.error(
        "GET PARTNERS ERROR:",
        error
      );


      return res.status(
        500
      ).json({

        success: false,

        message:
          "Failed to load partners.",

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
  async (
    req,
    res
  ) => {
    try {

      const {
        is_active,
      } =
        req.body;


      const result =
        await pool.query(
          `
          UPDATE users

          SET

            is_active =
              $1,

            updated_at =
              CURRENT_TIMESTAMP


          WHERE

            id = $2

            AND role =
              'PARTNER'


          RETURNING

            id,

            name,

            email,

            role,

            company_name,

            phone,

            profile_photo,

            is_active,

            updated_at
          `,
          [
            Boolean(
              is_active
            ),

            req.params.id,
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


      return res.status(
        500
      ).json({

        success: false,

        message:
          "Failed to update partner.",

      });
    }
  }
);


/* =========================================================
   PARTNER SIGNUP APPLICATIONS

   These are created only after
   Razorpay payment verification.

   GET /api/admin/partner-applications
========================================================= */

router.get(
  "/partner-applications",
  async (
    req,
    res
  ) => {
    try {

      const result =
        await pool.query(
          `
          SELECT

            a.id,

            a.payment_session_id,

            a.payment_token,

            a.plan_key,

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


            p.status
              AS payment_status,

            p.amount
              AS payment_amount,

            p.currency
              AS payment_currency,

            p.razorpay_plan_id,

            p.razorpay_subscription_id,

            p.razorpay_payment_id,


            admin_user.name
              AS admin_name


          FROM
            partner_signup_requests a


          LEFT JOIN
            partner_payment_sessions p

            ON p.id =
              a.payment_session_id


          LEFT JOIN users admin_user

            ON admin_user.id =
              a.admin_id


          ORDER BY

            CASE

              WHEN a.status =
                'PENDING'

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


      return res.status(
        500
      ).json({

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
  async (
    req,
    res
  ) => {
    try {

      const result =
        await pool.query(
          `
          SELECT

            a.id,

            a.payment_session_id,

            a.payment_token,

            a.plan_key,

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


            p.status
              AS payment_status,

            p.amount
              AS payment_amount,

            p.currency
              AS payment_currency,

            p.razorpay_plan_id,

            p.razorpay_subscription_id,

            p.razorpay_payment_id


          FROM
            partner_signup_requests a


          LEFT JOIN
            partner_payment_sessions p

            ON p.id =
              a.payment_session_id


          WHERE
            a.id = $1


          LIMIT 1
          `,
          [
            req.params.id,
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


      return res.status(
        500
      ).json({

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


   IMPORTANT:

   This is the ONLY place where the
   pending application becomes a real
   PARTNER user account.
========================================================= */

router.patch(
  "/partner-applications/:id/approve",
  async (
    req,
    res
  ) => {

    const client =
      await pool.connect();


    try {

      await client.query(
        "BEGIN"
      );


      /* -----------------------------------------------------
         LOCK APPLICATION
      ----------------------------------------------------- */

      const applicationResult =
        await client.query(
          `
          SELECT

            id,

            payment_session_id,

            plan_key,

            plan_name,

            name,

            email,

            password_hash,

            company_name,

            phone,

            profile_photo,

            status


          FROM
            partner_signup_requests


          WHERE
            id = $1


          FOR UPDATE
          `,
          [
            req.params.id,
          ]
        );


      if (
        applicationResult
          .rows
          .length ===
        0
      ) {

        await client.query(
          "ROLLBACK"
        );


        return res.status(
          404
        ).json({

          success: false,

          message:
            "Partner application not found.",

        });
      }


      const application =
        applicationResult
          .rows[0];


      /* -----------------------------------------------------
         CHECK APPLICATION STATUS
      ----------------------------------------------------- */

      if (
        application.status !==
        "PENDING"
      ) {

        await client.query(
          "ROLLBACK"
        );


        return res.status(
          409
        ).json({

          success: false,

          message:
            `This application has already been ${application.status.toLowerCase()}.`,

        });
      }


      /* -----------------------------------------------------
         VERIFY LINKED PAYMENT
      ----------------------------------------------------- */

      if (
        !application
          .payment_session_id
      ) {

        await client.query(
          "ROLLBACK"
        );


        return res.status(
          400
        ).json({

          success: false,

          message:
            "This application does not have a linked payment.",

        });
      }


      const paymentResult =
        await client.query(
          `
          SELECT

            id,

            status,

            plan_key,

            plan_name,

            amount,

            currency,

            razorpay_plan_id,

            razorpay_subscription_id,

            razorpay_payment_id


          FROM
            partner_payment_sessions


          WHERE
            id = $1


          FOR UPDATE
          `,
          [
            application
              .payment_session_id,
          ]
        );


      if (
        paymentResult.rows.length ===
        0
      ) {

        await client.query(
          "ROLLBACK"
        );


        return res.status(
          400
        ).json({

          success: false,

          message:
            "Linked payment session was not found.",

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


        return res.status(
          400
        ).json({

          success: false,

          message:
            "The linked payment has not been verified.",

        });
      }


      /* -----------------------------------------------------
         VERIFY PLAN MATCH
      ----------------------------------------------------- */

      if (
        application.plan_key &&
        payment.plan_key &&
        application.plan_key !==
          payment.plan_key
      ) {

        await client.query(
          "ROLLBACK"
        );


        return res.status(
          400
        ).json({

          success: false,

          message:
            "Application plan does not match the paid plan.",

        });
      }


      /* -----------------------------------------------------
         CHECK EMAIL
      ----------------------------------------------------- */

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


          FOR UPDATE
          `,
          [
            application.email,
          ]
        );


      if (
        existingUser.rows.length >
        0
      ) {

        await client.query(
          "ROLLBACK"
        );


        return res.status(
          409
        ).json({

          success: false,

          message:
            "A user with this email already exists.",

        });
      }


      /* -----------------------------------------------------
         CREATE REAL PARTNER ACCOUNT
      ----------------------------------------------------- */

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

            created_at,

            updated_at
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


      /* -----------------------------------------------------
         ADMIN NOTE
      ----------------------------------------------------- */

      const adminNote =
        typeof req.body.note ===
        "string"
          ? req.body.note.trim()
          : null;


      /* -----------------------------------------------------
         MARK APPLICATION APPROVED
      ----------------------------------------------------- */

      await client.query(
        `
        UPDATE partner_signup_requests

        SET

          status =
            'APPROVED',

          admin_id =
            $1,

          admin_note =
            $2,

          reviewed_at =
            CURRENT_TIMESTAMP


        WHERE
          id = $3
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
          "Partner application approved and partner account created successfully.",

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
        error.code ===
        "23505"
      ) {

        return res.status(
          409
        ).json({

          success: false,

          message:
            "A partner account with this email already exists.",

        });
      }


      return res.status(
        500
      ).json({

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
  async (
    req,
    res
  ) => {
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

            status =
              'REJECTED',

            admin_id =
              $1,

            admin_note =
              $2,

            reviewed_at =
              CURRENT_TIMESTAMP


          WHERE

            id = $3

            AND status =
              'PENDING'


          RETURNING

            id,

            payment_session_id,

            plan_key,

            plan_name,

            name,

            email,

            company_name,

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
        result.rows.length ===
        0
      ) {

        return res.status(
          404
        ).json({

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


      return res.status(
        500
      ).json({

        success: false,

        message:
          "Failed to reject partner application.",

      });
    }
  }
);


/* =========================================================
   PARTNER PROFILE CHANGE REQUESTS

   These remain exactly separate from
   first-time partner applications.
========================================================= */


/* =========================================================
   GET PROFILE REQUESTS

   GET /api/admin/profile-requests
========================================================= */

router.get(
  "/profile-requests",
  async (
    req,
    res
  ) => {
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


          FROM
            partner_profile_requests r


          INNER JOIN users u

            ON u.id =
              r.partner_id


          ORDER BY

            CASE

              WHEN r.status =
                'PENDING'

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


      return res.status(
        500
      ).json({

        success: false,

        message:
          "Failed to load profile requests.",

      });
    }
  }
);


/* =========================================================
   GET SINGLE PROFILE REQUEST

   GET /api/admin/profile-requests/:id
========================================================= */

router.get(
  "/profile-requests/:id",
  async (
    req,
    res
  ) => {
    try {

      const result =
        await pool.query(
          `
          SELECT

            r.*,

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


          FROM
            partner_profile_requests r


          INNER JOIN users u

            ON u.id =
              r.partner_id


          WHERE
            r.id = $1


          LIMIT 1
          `,
          [
            req.params.id,
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
            "Profile request not found.",

        });
      }


      return res.json({

        success: true,

        request:
          result.rows[0],

      });

    } catch (error) {

      console.error(
        "GET PROFILE REQUEST ERROR:",
        error
      );


      return res.status(
        500
      ).json({

        success: false,

        message:
          "Failed to load profile request.",

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
  async (
    req,
    res
  ) => {

    const client =
      await pool.connect();


    try {

      await client.query(
        "BEGIN"
      );


      /* -----------------------------------------------------
         LOCK REQUEST
      ----------------------------------------------------- */

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


          FROM
            partner_profile_requests


          WHERE
            id = $1


          FOR UPDATE
          `,
          [
            req.params.id,
          ]
        );


      if (
        requestResult.rows.length ===
        0
      ) {

        await client.query(
          "ROLLBACK"
        );


        return res.status(
          404
        ).json({

          success: false,

          message:
            "Profile request not found.",

        });
      }


      const request =
        requestResult
          .rows[0];


      /* -----------------------------------------------------
         CHECK STATUS
      ----------------------------------------------------- */

      if (
        request.status !==
        "PENDING"
      ) {

        await client.query(
          "ROLLBACK"
        );


        return res.status(
          409
        ).json({

          success: false,

          message:
            `This request has already been ${request.status.toLowerCase()}.`,

        });
      }


      /* -----------------------------------------------------
         OPTIONAL ADMIN NOTE
      ----------------------------------------------------- */

      const adminNote =
        typeof req.body.note ===
        "string"
          ? req.body.note.trim()
          : null;


      /* -----------------------------------------------------
         UPDATE PARTNER
      ----------------------------------------------------- */

      const updatedPartner =
        await client.query(
          `
          UPDATE users

          SET

            name =
              $1,

            company_name =
              $2,

            phone =
              $3,

            profile_photo =
              $4,

            password_hash =
              COALESCE(
                $5,
                password_hash
              ),

            updated_at =
              CURRENT_TIMESTAMP


          WHERE

            id = $6

            AND role =
              'PARTNER'


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


        return res.status(
          404
        ).json({

          success: false,

          message:
            "Partner account not found.",

        });
      }


      /* -----------------------------------------------------
         MARK APPROVED
      ----------------------------------------------------- */

      await client.query(
        `
        UPDATE partner_profile_requests

        SET

          status =
            'APPROVED',

          admin_id =
            $1,

          admin_note =
            $2,

          reviewed_at =
            CURRENT_TIMESTAMP


        WHERE
          id = $3
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
          "Partner profile changes approved successfully.",

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


      return res.status(
        500
      ).json({

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
  async (
    req,
    res
  ) => {
    try {

      const adminNote =
        typeof req.body.note ===
        "string"
          ? req.body.note.trim()
          : "";


      const result =
        await pool.query(
          `
          UPDATE partner_profile_requests

          SET

            status =
              'REJECTED',

            admin_id =
              $1,

            admin_note =
              $2,

            reviewed_at =
              CURRENT_TIMESTAMP


          WHERE

            id = $3

            AND status =
              'PENDING'


          RETURNING

            id,

            partner_id,

            status,

            admin_note,

            reviewed_at
          `,
          [
            req.user.id,

            adminNote ||
              "Profile change request rejected by admin.",

            req.params.id,
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


      return res.status(
        500
      ).json({

        success: false,

        message:
          "Failed to reject profile request.",

      });
    }
  }
);


/* =========================================================
   EXPORT
========================================================= */

export default router;
