import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET;


/* =========================================================
   AUTHENTICATE TOKEN
========================================================= */

export function authenticateToken(
  req,
  res,
  next
) {

  try {

    const authHeader =
      req.headers.authorization;


    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {

      return res.status(401).json({

        success: false,

        message:
          "Authentication required.",

      });
    }


    const token =
      authHeader.split(" ")[1];


    if (!JWT_SECRET) {

      return res.status(500).json({

        success: false,

        message:
          "JWT secret is not configured.",

      });
    }


    const decoded =
      jwt.verify(
        token,
        JWT_SECRET
      );


    req.user =
      decoded;


    next();

  } catch (error) {

    console.error(
      "AUTH TOKEN ERROR:",
      error.message
    );


    return res.status(401).json({

      success: false,

      message:
        "Invalid or expired authentication token.",

    });
  }
}


/* =========================================================
   REQUIRE ROLE
========================================================= */

export function requireRole(
  ...allowedRoles
) {

  return (
    req,
    res,
    next
  ) => {

    if (
      !req.user
    ) {

      return res.status(401).json({

        success: false,

        message:
          "Authentication required.",

      });
    }


    if (
      !allowedRoles.includes(
        req.user.role
      )
    ) {

      return res.status(403).json({

        success: false,

        message:
          "You do not have permission to access this resource.",

      });
    }


    next();
  };
}


/* =========================================================
   ADMIN ONLY
========================================================= */

export function requireAdmin(
  req,
  res,
  next
) {

  return requireRole(
    "ADMIN"
  )(
    req,
    res,
    next
  );
}


/* =========================================================
   PARTNER ONLY
========================================================= */

export function requirePartner(
  req,
  res,
  next
) {

  return requireRole(
    "PARTNER"
  )(
    req,
    res,
    next
  );
}