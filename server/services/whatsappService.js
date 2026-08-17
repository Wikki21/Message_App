const GRAPH_VERSION =
  process.env.META_GRAPH_VERSION || "v21.0";

const PHONE_NUMBER_ID =
  process.env.META_PHONE_NUMBER_ID ||
  "1173519339178890";

const WABA_ID =
  process.env.META_WABA_ID ||
  "1501922348086168";

const ACCESS_TOKEN =
  process.env.META_ACCESS_TOKEN || "EAAS2ZA4E8TIUBRzu6VaZBipJJ0GUIKfZAmJfeVcDZB5NP3yRjBumAVJphHof3nKCEiZAfiUHmhIQjreRVNUq6R238FHTOfAZBf8heDCnpvkZAVI9prAzu4c5U7QlzKDTJOHHO5ROaVHsmrIMZChafvqvrpIDDJg3SS4U0Op5ZBuAEnk9Use9UZBFoArcceC1fLNAZDZD";


/* =========================================================
COMMON HEADERS
========================================================= */

function getHeaders() {
  if (!ACCESS_TOKEN) {
    throw new Error(
      "META_ACCESS_TOKEN is missing in .env"
    );
  }

  return {
    Authorization: `Bearer ${ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  };
}


/* =========================================================
NORMALIZE WHATSAPP PHONE
=========================================================

India examples:

8667752372
918667752372
+91 8667752372

All become:

918667752372
========================================================= */

export function normalizeWhatsAppPhone(value) {
  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  let phone = String(value)
    .trim()
    .replace(/\s+/g, "")
    .replace(/-/g, "")
    .replace(/[()]/g, "");

  // Remove leading +
  phone = phone.replace(/^\+/, "");

  // Remove accidental decimal from Excel
  phone = phone.replace(/\.0$/, "");

  // If already starts with India country code
  if (
    phone.startsWith("91") &&
    phone.length === 12
  ) {
    return phone;
  }

  // Indian 10 digit number
  if (
    /^[6-9]\d{9}$/.test(phone)
  ) {
    return `91${phone}`;
  }

  // Generic international number
  if (
    /^\d{10,15}$/.test(phone)
  ) {
    return phone;
  }

  return "";
}


/* =========================================================
GET TEMPLATES
========================================================= */

export async function getTemplates() {
  if (!WABA_ID) {
    throw new Error(
      "META_WABA_ID is missing in .env"
    );
  }

  const url =
    `https://graph.facebook.com/` +
    `${GRAPH_VERSION}/${WABA_ID}/message_templates`;

  const response = await fetch(url, {
    method: "GET",
    headers: getHeaders(),
  });

  const data = await response.json();

  console.log(
    "\n========== META TEMPLATE RESPONSE =========="
  );

  console.log(
    JSON.stringify(
      data,
      null,
      2
    )
  );

  console.log(
    "============================================\n"
  );

  if (!response.ok) {
    const error = new Error(
      data?.error?.message ||
      `Meta API error: ${response.status}`
    );

    error.statusCode =
      response.status;

    throw error;
  }

  return data;
}


/* =========================================================
GET TEMPLATE VARIABLES

Example:

Hello {{1}}

returns:

[1]

Example:

Hello {{1}}, your due date is {{2}}

returns:

[1, 2]
========================================================= */

function getVariables(text = "") {
  const matches = [
    ...String(text).matchAll(
      /{{\s*(\d+)\s*}}/g
    ),
  ];

  return [
    ...new Set(
      matches.map(
        (match) =>
          Number(match[1])
      )
    ),
  ].sort(
    (a, b) => a - b
  );
}


/* =========================================================
GET CUSTOMER VALUE

This is the important mapping.

{{1}} -> customer_name
{{2}} -> due_date
{{3}} -> start_date
{{4}} -> end_date

Also supports explicit Excel columns.
========================================================= */

function getCustomerValue(
  customer,
  variableNumber
) {
  if (!customer) {
    return "";
  }


  /* -------------------------------------------------------
     FIRST: EXPLICIT VARIABLE COLUMNS
  ------------------------------------------------------- */

  const directKeys = [
    `variable_${variableNumber}`,
    `variable${variableNumber}`,

    `var_${variableNumber}`,
    `var${variableNumber}`,

    `header_${variableNumber}`,
    `header${variableNumber}`,

    `body_${variableNumber}`,
    `body${variableNumber}`,

    `template_${variableNumber}`,
    `template${variableNumber}`,

    `param_${variableNumber}`,
    `param${variableNumber}`,

    `value_${variableNumber}`,
    `value${variableNumber}`,
  ];


  for (
    const key of directKeys
  ) {
    const value =
      customer[key];

    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      return String(value);
    }
  }


  /* -------------------------------------------------------
     {{1}} -> CUSTOMER NAME
  ------------------------------------------------------- */

  if (
    variableNumber === 1
  ) {
    const name =
      customer.customer_name ??
      customer.customerName ??
      customer.name ??
      customer.full_name ??
      customer.fullName;

    if (
      name !== undefined &&
      name !== null &&
      String(name).trim() !== ""
    ) {
      return String(name);
    }
  }


  /* -------------------------------------------------------
     {{2}} -> DUE DATE
  ------------------------------------------------------- */

  if (
    variableNumber === 2
  ) {
    const dueDate =
      customer.due_date ??
      customer.dueDate;

    if (
      dueDate !== undefined &&
      dueDate !== null &&
      String(dueDate).trim() !== ""
    ) {
      return String(dueDate);
    }
  }


  /* -------------------------------------------------------
     {{3}} -> START DATE
  ------------------------------------------------------- */

  if (
    variableNumber === 3
  ) {
    const startDate =
      customer.start_date ??
      customer.startDate;

    if (
      startDate !== undefined &&
      startDate !== null &&
      String(startDate).trim() !== ""
    ) {
      return String(startDate);
    }
  }


  /* -------------------------------------------------------
     {{4}} -> END DATE
  ------------------------------------------------------- */

  if (
    variableNumber === 4
  ) {
    const endDate =
      customer.end_date ??
      customer.endDate;

    if (
      endDate !== undefined &&
      endDate !== null &&
      String(endDate).trim() !== ""
    ) {
      return String(endDate);
    }
  }


  /* -------------------------------------------------------
     OTHER COMMON VALUES
  ------------------------------------------------------- */

  const commonValues = [
    customer.phone,
    customer.mobile,
    customer.email,
    customer.gender,
    customer.age,
    customer.subscription,
    customer.customer_subscription,
  ];

  const index =
    variableNumber - 5;

  if (
    index >= 0 &&
    index < commonValues.length
  ) {
    const value =
      commonValues[index];

    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      return String(value);
    }
  }


  return "";
}


/* =========================================================
BUILD TEMPLATE PARAMETERS
========================================================= */

export function buildTemplateParameters({
  customer,
  templateComponents = [],
}) {
  const components =
    Array.isArray(
      templateComponents
    )
      ? templateComponents
      : [];


  const headerComponent =
    components.find(
      (component) =>
        String(
          component?.type || ""
        ).toUpperCase() ===
        "HEADER"
    );


  const bodyComponent =
    components.find(
      (component) =>
        String(
          component?.type || ""
        ).toUpperCase() ===
        "BODY"
    );


  /* =======================================================
     HEADER
  ======================================================= */

  const headerText =
    headerComponent?.text || "";

  const headerVariables =
    getVariables(
      headerText
    );


  const headerParameters =
    headerVariables.map(
      (variableNumber) =>
        getCustomerValue(
          customer,
          variableNumber
        )
    );


  /* =======================================================
     BODY
  ======================================================= */

  const bodyText =
    bodyComponent?.text || "";

  const bodyVariables =
    getVariables(
      bodyText
    );


  const bodyParameters =
    bodyVariables.map(
      (variableNumber) =>
        getCustomerValue(
          customer,
          variableNumber
        )
    );


  return {
    headerVariables,
    bodyVariables,
    headerParameters,
    bodyParameters,
  };
}


/* =========================================================
CONVERT PARAMETERS
========================================================= */

function convertParameters(
  values = []
) {
  return values.map(
    (value) => ({
      type: "text",
      text: String(
        value ?? ""
      ),
    })
  );
}


/* =========================================================
SEND WHATSAPP TEMPLATE
========================================================= */

export async function sendTemplateMessage({
  to,
  templateName,
  languageCode,

  headerParameters = [],
  bodyParameters = [],

  customer = null,
  templateComponents = [],
}) {

  if (!PHONE_NUMBER_ID) {
    throw new Error(
      "META_PHONE_NUMBER_ID is missing in .env"
    );
  }


  if (!templateName) {
    throw new Error(
      "Template name is required"
    );
  }


  if (!languageCode) {
    throw new Error(
      "Template language is required"
    );
  }


  if (!to) {
    throw new Error(
      "WhatsApp phone number is required"
    );
  }


  /* =======================================================
     AUTOMATIC PARAMETER GENERATION
  ======================================================= */

  if (
    customer &&
    Array.isArray(
      templateComponents
    )
  ) {

    const generated =
      buildTemplateParameters({
        customer,
        templateComponents,
      });


    /*
      Only replace parameters when
      caller has not supplied them.
    */

    if (
      headerParameters.length === 0 &&
      generated.headerParameters.length > 0
    ) {
      headerParameters =
        generated.headerParameters;
    }


    if (
      bodyParameters.length === 0 &&
      generated.bodyParameters.length > 0
    ) {
      bodyParameters =
        generated.bodyParameters;
    }


    console.log(
      "\n========== TEMPLATE VARIABLES =========="
    );

    console.log(
      "Customer:",
      customer.customer_name ||
      customer.name ||
      "Customer"
    );

    console.log(
      "Header variables:",
      generated.headerVariables
    );

    console.log(
      "Header values:",
      headerParameters
    );

    console.log(
      "Body variables:",
      generated.bodyVariables
    );

    console.log(
      "Body values:",
      bodyParameters
    );

    console.log(
      "========================================\n"
    );
  }


  /* =======================================================
     BUILD COMPONENTS
  ======================================================= */

  const components = [];


  /* -------------------------------------------------------
     HEADER
  ------------------------------------------------------- */

  if (
    headerParameters.length > 0
  ) {
    components.push({
      type: "header",

      parameters:
        convertParameters(
          headerParameters
        ),
    });
  }


  /* -------------------------------------------------------
     BODY
  ------------------------------------------------------- */

  if (
    bodyParameters.length > 0
  ) {
    components.push({
      type: "body",

      parameters:
        convertParameters(
          bodyParameters
        ),
    });
  }


  /* =======================================================
     PAYLOAD
  ======================================================= */

  const payload = {
    messaging_product:
      "whatsapp",

    to: String(to),

    type: "template",

    template: {
      name:
        templateName,

      language: {
        code:
          languageCode,
      },

      components,
    },
  };


  console.log(
    "\n========================================"
  );

  console.log(
    "WHATSAPP REQUEST"
  );

  console.log(
    JSON.stringify(
      payload,
      null,
      2
    )
  );

  console.log(
    "========================================\n"
  );


  /* =======================================================
     SEND TO META
  ======================================================= */

  const url =
    `https://graph.facebook.com/` +
    `${GRAPH_VERSION}/${PHONE_NUMBER_ID}/messages`;


  const response =
    await fetch(
      url,
      {
        method: "POST",

        headers:
          getHeaders(),

        body:
          JSON.stringify(
            payload
          ),
      }
    );


  const data =
    await response.json();


  console.log(
    "\n========== META RESPONSE =========="
  );

  console.log(
    JSON.stringify(
      data,
      null,
      2
    )
  );

  console.log(
    "===================================\n"
  );


  /* =======================================================
     META ERROR
  ======================================================= */

  if (!response.ok) {

    const error =
      new Error(
        data?.error?.message ||
        `Meta API error: ${response.status}`
      );

    error.statusCode =
      response.status;

    error.metaError =
      data?.error || null;

    throw error;
  }


  /* =======================================================
     RETURN NORMALIZED RESPONSE
  ======================================================= */

  return {
    messageId:
      data?.messages?.[0]?.id ||
      null,

    messageStatus:
      data?.messages?.[0]?.message_status ||
      "accepted",

    raw:
      data,
  };
}