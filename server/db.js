import pg from "pg";
import "dotenv/config";


const {
  Pool,
} = pg;


/* =========================================================
   DATABASE URL
========================================================= */

const databaseUrl =
  process.env.DATABASE_URL;


if (!databaseUrl) {
  console.error(
    "DATABASE_URL is not configured."
  );

  process.exit(1);
}


/* =========================================================
   POSTGRES CONNECTION POOL
========================================================= */

const pool =
  new Pool({
    connectionString:
      databaseUrl,

    /*
     * Render PostgreSQL requires SSL.
     * Local PostgreSQL does not.
     */
    ssl:
      process.env.NODE_ENV ===
      "production"
        ? {
            rejectUnauthorized:
              false,
          }
        : false,

    max: 10,

    idleTimeoutMillis:
      30000,

    connectionTimeoutMillis:
      10000,
  });


/* =========================================================
   CONNECTION EVENT
========================================================= */

pool.on(
  "connect",
  () => {
    console.log(
      "PostgreSQL connected"
    );
  }
);


/* =========================================================
   POOL ERROR
========================================================= */

pool.on(
  "error",
  (error) => {
    console.error(
      "PostgreSQL pool error:",
      error
    );
  }
);


/* =========================================================
   EXPORT
========================================================= */

export default pool;
