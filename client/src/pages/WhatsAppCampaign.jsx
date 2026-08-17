import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import * as XLSX from "xlsx";
import "./WhatsAppCampaign.css";

const API_BASE = "http://localhost:5000";

/* =========================================================
   HELPERS
========================================================= */

const normalizePhone = (value) =>
  value
    ? String(value)
        .replace(/\s+/g, "")
        .replace(/[^\d+]/g, "")
    : "";

const getCustomerPhone = (customer) =>
  customer.phone ||
  customer.mobile ||
  customer.contact ||
  customer.contact_number ||
  customer.whatsapp ||
  customer.whatsapp_number ||
  "";

const getCustomerKey = (customer) => {
  const phone = normalizePhone(getCustomerPhone(customer));

  if (phone) {
    return `phone:${phone}`;
  }

  const name = String(
    customer.customer_name || customer.name || ""
  )
    .trim()
    .toLowerCase();

  return `name:${name}`;
};

const getVariables = (text = "") =>
  [...String(text).matchAll(/{{(\d+)}}/g)]
    .map((match) => Number(match[1]))
    .filter(
      (value, index, array) =>
        array.indexOf(value) === index
    )
    .sort((a, b) => a - b);

/* =========================================================
   MAIN COMPONENT
========================================================= */

function WhatsAppCampaign() {
  /*
   IMPORTANT:
   Customers start EMPTY every time the page opens.

   We intentionally do NOT restore customers from localStorage.
   Customer list appears ONLY after uploading Excel.
  */

  const [customers, setCustomers] = useState([]);

  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] =
    useState(null);

  const [loadingTemplates, setLoadingTemplates] =
    useState(false);

  const [templateError, setTemplateError] =
    useState("");

  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  /* =========================================================
     EXCEL UPLOAD
  ========================================================= */

  const handleExcelUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = (loadEvent) => {
      try {
        const data = new Uint8Array(
          loadEvent.target.result
        );

        const workbook = XLSX.read(data, {
          type: "array",
        });

        if (!workbook.SheetNames.length) {
          throw new Error("No worksheet found.");
        }

        const worksheet =
          workbook.Sheets[workbook.SheetNames[0]];

        const rows = XLSX.utils.sheet_to_json(
          worksheet,
          {
            defval: "",
          }
        );

        if (!rows.length) {
          setMessage(
            "The Excel file is empty."
          );

          setCustomers([]);
          return;
        }

        /* -----------------------------------------------------
           REMOVE DUPLICATES FROM UPLOADED EXCEL
        ----------------------------------------------------- */

        const customerMap = new Map();

        let duplicateCount = 0;

        rows.forEach((row) => {
          const customer = {
            ...row,
            _status: "pending",
            _error: "",
          };

          const key = getCustomerKey(customer);

          if (customerMap.has(key)) {
            duplicateCount += 1;
            return;
          }

          customerMap.set(key, customer);
        });

        const uploadedCustomers = Array.from(
          customerMap.values()
        ).map((customer, index) => ({
          ...customer,
          _id: index + 1,
          _status:
            customer._status || "pending",
          _error:
            customer._error || "",
        }));

        setCustomers(uploadedCustomers);

        /* -----------------------------------------------------
           MESSAGE
        ----------------------------------------------------- */

        if (duplicateCount > 0) {
          setMessage(
            `${uploadedCustomers.length} customers loaded successfully. ${duplicateCount} duplicate ${
              duplicateCount === 1
                ? "row"
                : "rows"
            } skipped.`
          );
        } else {
          setMessage(
            `${uploadedCustomers.length} customers loaded successfully.`
          );
        }
      } catch (error) {
        console.error(
          "Excel upload failed:",
          error
        );

        setCustomers([]);

        setMessage(
          error.message ||
            "Failed to read Excel file."
        );
      } finally {
        event.target.value = "";
      }
    };

    reader.onerror = () => {
      setCustomers([]);

      setMessage(
        "Failed to read the selected Excel file."
      );

      event.target.value = "";
    };

    reader.readAsArrayBuffer(file);
  };

  /* =========================================================
     LOAD WHATSAPP TEMPLATES
  ========================================================= */

  const loadTemplates = useCallback(
    async () => {
      try {
        setLoadingTemplates(true);
        setTemplateError("");

        const response = await fetch(
          `${API_BASE}/api/templates`
        );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Failed to load templates."
          );
        }

        const approvedTemplates =
          (data.templates || []).filter(
            (template) =>
              String(
                template.status || ""
              ).toUpperCase() ===
              "APPROVED"
          );

        setTemplates(
          approvedTemplates
        );
      } catch (error) {
        console.error(
          "Template loading failed:",
          error
        );

        setTemplateError(
          error.message ||
            "Failed to load templates."
        );
      } finally {
        setLoadingTemplates(false);
      }
    },
    []
  );

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  /* =========================================================
     TEMPLATE CHANGE
  ========================================================= */

  const handleTemplateChange = (
    event
  ) => {
    const templateId =
      event.target.value;

    const template =
      templates.find(
        (item) =>
          String(item.id) ===
          String(templateId)
      );

    setSelectedTemplate(
      template || null
    );
  };

  /* =========================================================
     TEMPLATE VARIABLES
  ========================================================= */

  const templateVariableInfo =
    useMemo(() => {
      if (!selectedTemplate) {
        return {
          headerVariables: [],
          bodyVariables: [],
        };
      }

      const components =
        selectedTemplate.components ||
        [];

      const header =
        components.find(
          (component) =>
            String(
              component.type || ""
            ).toUpperCase() ===
            "HEADER"
        );

      const body =
        components.find(
          (component) =>
            String(
              component.type || ""
            ).toUpperCase() ===
            "BODY"
        );

      return {
        headerVariables:
          getVariables(
            header?.text || ""
          ),

        bodyVariables:
          getVariables(
            body?.text || ""
          ),
      };
    }, [selectedTemplate]);

  /* =========================================================
     SEND WHATSAPP
  ========================================================= */

  const handleSend = async () => {
    if (!customers.length) {
      window.alert(
        "Please upload an Excel file first."
      );

      return;
    }

    if (!selectedTemplate) {
      window.alert(
        "Please select a WhatsApp template."
      );

      return;
    }

    const invalidCustomer =
      customers.find(
        (customer) =>
          !getCustomerPhone(customer)
      );

    if (invalidCustomer) {
      window.alert(
        `Phone number is missing for customer #${invalidCustomer._id}.`
      );

      return;
    }

    setSending(true);

    setMessage(
      "Sending WhatsApp messages..."
    );

    try {
      const response =
        await fetch(
          `${API_BASE}/api/whatsapp/send`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              customers,

              templateName:
                selectedTemplate.name,

              languageCode:
                selectedTemplate.language,

              templateComponents:
                selectedTemplate.components ||
                [],
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to send WhatsApp messages."
        );
      }

      /* -----------------------------------------------------
         UPDATE CUSTOMER STATUS
      ----------------------------------------------------- */

      if (
        Array.isArray(
          data.results
        )
      ) {
        const resultMap =
          new Map(
            data.results
              .filter(
                (result) =>
                  result.customer
                    ?._id !==
                  undefined
              )
              .map(
                (result) => [
                  result.customer._id,
                  result,
                ]
              )
          );

        setCustomers(
          (currentCustomers) =>
            currentCustomers.map(
              (customer) => {
                const result =
                  resultMap.get(
                    customer._id
                  );

                if (!result) {
                  return customer;
                }

                return {
                  ...customer,

_status:
  result.status === "accepted"
    ? "accepted"
    : result.status || customer._status,

                  _error:
                    result.error ||
                    "",
                };
              }
            )
        );
      }

setMessage(
  `Completed: ${
    data.accepted || 0
  } accepted by Meta, ${
    data.failed || 0
  } failed. Delivery status will update from WhatsApp.`
);
    } catch (error) {
      console.error(
        "WhatsApp send failed:",
        error
      );

      setMessage(
        error.message ||
          "Failed to send WhatsApp messages."
      );
    } finally {
      setSending(false);
    }
  };

  /* =========================================================
     COUNTS
  ========================================================= */

  const totalCustomers =
    customers.length;

  const sentCount =
    customers.filter(
      (customer) =>
        String(
          customer._status || ""
        ).toLowerCase() ===
        "sent"
    ).length;

  const failedCount =
    customers.filter(
      (customer) =>
        String(
          customer._status || ""
        ).toLowerCase() ===
        "failed"
    ).length;

  const pendingCount =
    customers.filter(
      (customer) =>
        String(
          customer._status ||
            "pending"
        ).toLowerCase() ===
        "pending"
    ).length;

  /* =========================================================
     TEMPLATE PREVIEW
  ========================================================= */

  const renderTemplatePreview =
    () => {
      if (!selectedTemplate) {
        return (
          <div className="wa-preview-empty">
            <div className="preview-empty-icon">
              💬
            </div>

            <strong>
              Template preview
            </strong>

            <span>
              Select an approved template
              to preview your message.
            </span>
          </div>
        );
      }

      return (
        <div className="wa-preview">
          <div className="wa-preview-top">
            <div className="wa-preview-business">
              <div className="wa-preview-avatar">
                Z
              </div>

              <div>
                <strong>
                  Zaploft
                </strong>

                <span>
                  Business account
                </span>
              </div>
            </div>

            <span className="approved-pill">
              <span>✓</span>
              APPROVED
            </span>
          </div>

          <div className="wa-chat">
            <div className="wa-message">
              {(
                selectedTemplate.components ||
                []
              ).map(
                (
                  component,
                  index
                ) => {
                  const type =
                    String(
                      component.type ||
                        ""
                    ).toUpperCase();

                  if (
                    type ===
                    "HEADER"
                  ) {
                    return (
                      <div
                        className="wa-message-header"
                        key={`header-${index}`}
                      >
                        {
                          component.text
                        }
                      </div>
                    );
                  }

                  if (
                    type ===
                    "BODY"
                  ) {
                    return (
                      <div
                        className="wa-message-body"
                        key={`body-${index}`}
                      >
                        {
                          component.text
                        }
                      </div>
                    );
                  }

                  if (
                    type ===
                    "FOOTER"
                  ) {
                    return (
                      <div
                        className="wa-message-footer"
                        key={`footer-${index}`}
                      >
                        {
                          component.text
                        }
                      </div>
                    );
                  }

                  return null;
                }
              )}

              <div className="wa-time">
                12:00 PM
                <span>
                  ✓✓
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="whatsapp-page">

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <header className="wa-page-header">
        <div className="wa-header-left">

          <div className="wa-breadcrumb">
            WORKSPACE
            <span>/</span>
            CAMPAIGNS
            <span>/</span>
            WHATSAPP
          </div>

          <div className="wa-title-row">

            <div className="wa-title-icon">
              💬
            </div>

            <div>
              <h1>
                WhatsApp Campaign
              </h1>

              <p>
                Send approved WhatsApp
                templates directly to
                your customers.
              </p>
            </div>

          </div>

        </div>

        <div className="wa-header-actions">

          <div className="partner-pill">
            <span />
            Partner Dashboard
          </div>

          <div className="wa-user-avatar">
            Z
          </div>

        </div>
      </header>

      {/* =====================================================
          STATS
      ===================================================== */}

      <section
        className="wa-stats"
        aria-label="Campaign statistics"
      >

        <StatCard
          type="purple"
          icon="users"
          title="Total Customers"
          value={totalCustomers}
        />

        <StatCard
          type="orange"
          icon="clock"
          title="Pending"
          value={pendingCount}
        />

        <StatCard
          type="green"
          icon="check"
          title="Messages Sent"
          value={sentCount}
        />

        <StatCard
          type="red"
          icon="error"
          title="Failed"
          value={failedCount}
        />

      </section>

      {/* =====================================================
          MAIN WORKSPACE
      ===================================================== */}

      <section className="wa-workspace">

        {/* ===================================================
            LEFT COLUMN
        =================================================== */}

        <div className="wa-left-column">

          {/* UPLOAD PANEL */}

          <div className="wa-panel upload-panel">

            <PanelHeader
              step="01"
              title="Customer data"
              description="Upload your Excel customer list to begin."
            />

            <div
              className={`upload-zone ${
                customers.length
                  ? "has-customers"
                  : ""
              }`}
            >

              <div className="upload-icon-wrap">

                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12 16V4" />
                  <path d="m7 9 5-5 5 5" />
                  <path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
                </svg>

              </div>

              <h3>
                {customers.length
                  ? `${customers.length} customers loaded`
                  : "Upload your Excel file"}
              </h3>

              <p>
                Drag and drop your
                XLSX/XLS file here, or
                browse from your computer.
              </p>

              <label className="browse-button">

                <span>
                  Browse Excel
                </span>

                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={
                    handleExcelUpload
                  }
                />

              </label>

              <div className="upload-format">
                XLSX / XLS
                <span>•</span>
                Excel customer data
              </div>

            </div>

            {message && (
              <div className="wa-message-alert">
                <span>✓</span>
                {message}
              </div>
            )}

          </div>

          {/* =================================================
              CUSTOMER LIST

              IMPORTANT:
              This entire panel is hidden until
              customers.length > 0.
          ================================================= */}

          {customers.length > 0 && (
            <div className="wa-panel customer-panel">

              <PanelHeader
                title="Customer list"
                description="Customers imported from your Excel file."
                right={
                  <span className="customer-count">
                    {customers.length}
                  </span>
                }
              />

              <div className="customer-table-wrap">

                <table className="customer-table">

                  <thead>
                    <tr>
                      <th>#</th>
                      <th>CUSTOMER</th>
                      <th>PHONE</th>
                      <th>DUE DATE</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>

                  <tbody>

                    {customers.map(
                      (customer) => {
                        const name =
                          customer.customer_name ||
                          customer.name ||
                          "Customer";

                        const letter =
                          String(name)
                            .charAt(0)
                            .toUpperCase();

                        const phone =
                          getCustomerPhone(
                            customer
                          );

                        const dueDate =
                          customer.due_date ||
                          customer.end_date ||
                          "-";

                        return (
                          <tr
                            key={
                              customer._id
                            }
                          >

                            <td>
                              {
                                customer._id
                              }
                            </td>

                            <td>
                              <div className="customer-info">

                                <div className="customer-avatar">
                                  {letter}
                                </div>

                                <strong>
                                  {name}
                                </strong>

                              </div>
                            </td>

                            <td>
                              {phone || "-"}
                            </td>

                            <td>
                              {dueDate}
                            </td>

                            <td>
                              <StatusBadge
                                status={
                                  customer._status
                                }
                              />
                            </td>

                          </tr>
                        );
                      }
                    )}

                  </tbody>

                </table>

              </div>

            </div>
          )}

        </div>

        {/* ===================================================
            RIGHT COLUMN
        =================================================== */}

        <div className="wa-right-column">

          {/* TEMPLATE PANEL */}

          <div className="wa-panel template-panel">

            <PanelHeader
              step="02"
              title="WhatsApp template"
              description="Choose an approved Meta WhatsApp template."
            />

            <div className="template-body">

              {loadingTemplates && (
                <div className="template-loading">
                  <span className="spinner small" />
                  Loading approved templates...
                </div>
              )}

              {templateError && (
                <div className="template-error">
                  {templateError}
                </div>
              )}

              <label className="field-label">
                Approved template
              </label>

              <div className="select-wrap">

                <select
                  value={
                    selectedTemplate?.id ||
                    ""
                  }
                  onChange={
                    handleTemplateChange
                  }
                  className="template-select"
                >

                  <option value="">
                    Select an approved template
                  </option>

                  {templates.map(
                    (template) => (
                      <option
                        key={
                          template.id
                        }
                        value={
                          template.id
                        }
                      >
                        {template.name} •{" "}
                        {
                          template.language
                        }
                      </option>
                    )
                  )}

                </select>

              </div>

              {selectedTemplate && (
                <div className="template-meta">

                  <div>
                    <span>
                      Name
                    </span>

                    <strong>
                      {
                        selectedTemplate.name
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Language
                    </span>

                    <strong>
                      {
                        selectedTemplate.language
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Category
                    </span>

                    <strong>
                      {
                        selectedTemplate.category ||
                        "MARKETING"
                      }
                    </strong>
                  </div>

                </div>
              )}

              <div className="preview-title">
                Message preview
              </div>

              {renderTemplatePreview()}

            </div>

          </div>

          {/* VARIABLE CARD */}

          {selectedTemplate && (
            <div className="variable-card">

              <div className="variable-check">
                ✓
              </div>

              <div>

                <strong>
                  Template variables detected
                </strong>

                <p>
                  Header:{" "}
                  {
                    templateVariableInfo
                      .headerVariables
                      .length
                  }

                  <span>
                    •
                  </span>

                  Body:{" "}
                  {
                    templateVariableInfo
                      .bodyVariables
                      .length
                  }
                </p>

              </div>

            </div>
          )}

          {/* SEND CARD */}

          <div className="send-card">

            <div className="send-card-heading">

              <div className="send-card-icon">
                →
              </div>

              <div>

                <span>
                  ZAPLOFT CAMPAIGN
                </span>

                <h3>
                  Ready to send?
                </h3>

              </div>

            </div>

            <div className="send-summary">

              <div>
                <span>
                  Customers
                </span>

                <strong>
                  {totalCustomers}
                </strong>
              </div>

              <div>
                <span>
                  Template
                </span>

                <strong>
                  {selectedTemplate
                    ? "Selected"
                    : "Not selected"}
                </strong>
              </div>

            </div>

            <p>
              Your approved WhatsApp
              template will be sent to the
              uploaded customer list.
            </p>

            <button
              className="send-button"
              type="button"
              onClick={handleSend}
              disabled={
                sending ||
                !customers.length ||
                !selectedTemplate
              }
            >

              {sending ? (
                <>
                  <span className="spinner" />
                  Sending...
                </>
              ) : (
                <>
                  Send WhatsApp Campaign
                  <span>→</span>
                </>
              )}

            </button>

            <div className="secure-note">
              <span>🔒</span>
              Secured by Zaploft
            </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="wa-footer">
        <span>
          © {new Date().getFullYear()} Zaploft Message Campaign Automation
        </span>
      </footer>

    </div>
  );
}

/* =========================================================
   PANEL HEADER
========================================================= */

function PanelHeader({
  step,
  title,
  description,
  right,
}) {
  return (
    <div className="panel-header">

      <div className="panel-header-content">

        {step && (
          <span className="panel-step">
            STEP {step}
          </span>
        )}

        <h2>
          {title}
        </h2>

        <p>
          {description}
        </p>

      </div>

      {right && (
        <div className="panel-header-right">
          {right}
        </div>
      )}

    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  icon,
  title,
  value,
  type,
}) {
  const icons = {
    users: (
      <svg viewBox="0 0 24 24">
        <path d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20" />
        <circle
          cx="9.5"
          cy="7"
          r="3.5"
        />
        <path d="M16 11a3.5 3.5 0 1 0 0-7" />
        <path d="M21 20v-1.5a4 4 0 0 0-3-3.87" />
      </svg>
    ),

    clock: (
      <svg viewBox="0 0 24 24">
        <circle
          cx="12"
          cy="12"
          r="8"
        />
        <path d="M12 8v4l2.5 1.5" />
      </svg>
    ),

    check: (
      <svg viewBox="0 0 24 24">
        <path d="m5 12 4.5 4.5L19 7" />
      </svg>
    ),

    error: (
      <svg viewBox="0 0 24 24">
        <path d="M12 4v10" />
        <path d="M12 18h.01" />
      </svg>
    ),
  };

  return (
    <div
      className={`stat-card ${type}`}
    >

      <div className="stat-icon">
        {icons[icon]}
      </div>

      <div className="stat-content">

        <span>
          {title}
        </span>

        <strong>
          {value}
        </strong>

      </div>

      <div className="stat-card-shine" />

    </div>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  status,
}) {
  const value = String(
    status || "pending"
  ).toLowerCase();

  if (value === "sent") {
    return (
      <span className="status-badge sent">
        <span>✓</span>
        Sent
      </span>
    );
  }

  if (value === "failed") {
    return (
      <span className="status-badge failed">
        <span>!</span>
        Failed
      </span>
    );
  }

  return (
    <span className="status-badge pending">
      <span>•</span>
      Pending
    </span>
  );
}

export default WhatsAppCampaign;