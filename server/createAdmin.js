import "dotenv/config";

import bcrypt from "bcrypt";

import pool from "./db.js";


async function createAdmin() {

  try {

    const password =
      "Admin@12345";


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
          phone
        )
        VALUES
        (
          $1,
          $2,
          $3,
          'ADMIN',
          $4,
          $5
        )
        RETURNING
          id,
          name,
          email,
          role
        `,
        [
          "Zaploft Admin",
          "admin@zaploft.com",
          passwordHash,
          "Zaploft",
          null,
        ]
      );


    console.log(
      "========================================"
    );

    console.log(
      "ADMIN CREATED"
    );

    console.log(
      result.rows[0]
    );

    console.log(
      "Email: admin@zaploft.com"
    );

    console.log(
      "Password: Admin@12345"
    );

    console.log(
      "========================================"
    );


  } catch (error) {

    console.error(
      "CREATE ADMIN ERROR:",
      error
    );

  } finally {

    await pool.end();

  }
}


createAdmin();