import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import pool from "../db.js";


/* =========================================================
   JWT SECRET
========================================================= */

const JWT_SECRET =
  process.env.JWT_SECRET;

if (!JWT_SECRET) {

  console.warn(
    "WARNING: JWT_SECRET is not configured in .env"
  );
}


/* =========================================================
   LOGIN USER
========================================================= */

export async function loginUser(
  email,
  password
) {

  const cleanEmail =
    String(email)
      .trim()
      .toLowerCase();


  /* -------------------------------------------------------
     FIND USER
  ------------------------------------------------------- */

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
        is_active,
        created_at
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
      `,
      [cleanEmail]
    );


  if (
    result.rows.length === 0
  ) {

    throw new Error(
      "Invalid email or password."
    );
  }


  const user =
    result.rows[0];


  /* -------------------------------------------------------
     CHECK ACTIVE STATUS
  ------------------------------------------------------- */

  if (
    user.is_active === false
  ) {

    throw new Error(
      "Your account has been disabled. Please contact the administrator."
    );
  }


  /* -------------------------------------------------------
     CHECK PASSWORD
  ------------------------------------------------------- */

  const passwordMatches =
    await bcrypt.compare(
      password,
      user.password_hash
    );


  if (!passwordMatches) {

    throw new Error(
      "Invalid email or password."
    );
  }


  /* -------------------------------------------------------
     JWT
  ------------------------------------------------------- */

  if (!JWT_SECRET) {

    throw new Error(
      "Server authentication is not configured."
    );
  }


  const token =
    jwt.sign(
      {
        id: user.id,

        email: user.email,

        role: user.role,

        name: user.name,

        company_name:
          user.company_name || null,
      },

      JWT_SECRET,

      {
        expiresIn:
          "7d",
      }
    );


  /* -------------------------------------------------------
     RETURN USER

     Never return password_hash.
  ------------------------------------------------------- */

  return {

    token,

    user: {

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

      is_active:
        user.is_active,

    },

  };
}