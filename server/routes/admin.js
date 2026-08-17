/* =========================================================
   PARTNER APPLICATIONS

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
            r.id,

            r.payment_session_id,

            r.payment_token,

            r.plan_key,

            r.plan_name,

            r.name,

            r.email,

            r.company_name,

            r.phone,

            r.profile_photo,

            r.status,

            r.admin_id,

            r.admin_note,

            r.created_at,

            r.reviewed_at,

            p.status
              AS payment_status,

            p.amount
              AS payment_amount,

            p.currency
              AS payment_currency,

            p.razorpay_plan_id,

            p.razorpay_subscription_id,

            p.razorpay_payment_id,

            u.name
              AS admin_name

          FROM partner_signup_requests r

          LEFT JOIN
            partner_payment_sessions p

            ON p.id =
              r.payment_session_id

          LEFT JOIN users u

            ON u.id =
              r.admin_id

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
   GET ONE PARTNER APPLICATION

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
            r.*,

            p.status
              AS payment_status,

            p.amount
              AS payment_amount,

            p.currency
              AS payment_currency,

            p.razorpay_plan_id,

            p.razorpay_subscription_id,

            p.razorpay_payment_id

          FROM partner_signup_requests r

          LEFT JOIN
            partner_payment_sessions p

            ON p.id =
              r.payment_session_id

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

   PATCH /api/admin/partner-applications/:id/approve

   IMPORTANT:
   This is where the real users row is created.
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


      /*
       * Lock the application.
       */
      const applicationResult =
        await client.query(
          `
          SELECT
            r.id,

            r.payment_session_id,

            r.payment_token,

            r.plan_key,

            r.plan_name,

            r.name,

            r.email,

            r.password_hash,

            r.company_name,

            r.phone,

            r.profile_photo,

            r.status

          FROM partner_signup_requests r

          WHERE
            r.id = $1

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
            `Application has already been ${application.status.toLowerCase()}.`,
        });
      }


      /*
       * Make sure payment really
       * exists and is PAID.
       */

      if (
        !application.payment_session_id
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
            used_at

          FROM partner_payment_sessions

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
        paymentResult
          .rows[0];


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
            "The linked payment is not marked as paid.",
        });
      }


      /*
       * Check whether email
       * already exists.
       */

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
        existingUser.rows.length
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(
          409
        ).json({
          success: false,

          message:
            "An account with this email already exists.",
        });
      }


      /*
       * CREATE REAL PARTNER ACCOUNT.
       */

      const userResult =
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


      /*
       * Approve application.
       */

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
          userResult.rows[0],
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

   PATCH /api/admin/partner-applications/:id/reject
========================================================= */

router.patch(
  "/partner-applications/:id/reject",
  async (
    req,
    res
  ) => {
    try {
      const note =
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
            plan_key,
            plan_name,
            name,
            email,
            status,
            admin_note,
            reviewed_at
          `,
          [
            req.user.id,

            note ||
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