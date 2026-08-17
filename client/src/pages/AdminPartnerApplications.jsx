import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import "./AdminPartnerApplications.css";

const API_BASE =
  "http://localhost:5000";


function AdminPartnerApplications() {

  const [applications, setApplications] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [selectedApplication, setSelectedApplication] =
    useState(null);

  const [note, setNote] =
    useState("");

  const [processing, setProcessing] =
    useState(false);

  const [message, setMessage] =
    useState({
      type: "",
      text: "",
    });


  /* =========================================================
     TOKEN
  ========================================================= */

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      ""
    );
  };


  /* =========================================================
     LOAD APPLICATIONS
  ========================================================= */

  const loadApplications =
    async () => {

      try {

        setLoading(true);

        const token =
          getToken();

        if (!token) {
          throw new Error(
            "Admin login session not found."
          );
        }


        const response =
          await fetch(
            `${API_BASE}/api/admin/partner-applications`,
            {
              method: "GET",

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );


        const contentType =
          response.headers.get(
            "content-type"
          ) || "";


        let data = null;


        if (
          contentType.includes(
            "application/json"
          )
        ) {
          data =
            await response.json();
        } else {
          const text =
            await response.text();

          throw new Error(
            text ||
              "Server returned an invalid response."
          );
        }


        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Failed to load partner applications."
          );
        }


        setApplications(
          Array.isArray(
            data.applications
          )
            ? data.applications
            : []
        );

      } catch (error) {

        console.error(
          "LOAD PARTNER APPLICATIONS ERROR:",
          error
        );


        setMessage({
          type: "error",
          text:
            error.message ||
            "Failed to load applications.",
        });

      } finally {

        setLoading(false);

      }

    };


  useEffect(() => {
    loadApplications();
  }, []);


  /* =========================================================
     PENDING COUNT
  ========================================================= */

  const pendingCount =
    useMemo(() => {
      return applications.filter(
        (application) =>
          application.status ===
          "PENDING"
      ).length;
    }, [applications]);


  /* =========================================================
     OPEN APPLICATION
  ========================================================= */

  const openApplication =
    (application) => {

      setSelectedApplication(
        application
      );

      setNote("");

      setMessage({
        type: "",
        text: "",
      });
    };


  /* =========================================================
     CLOSE MODAL
  ========================================================= */

  const closeApplication =
    () => {

      if (processing) {
        return;
      }

      setSelectedApplication(
        null
      );

      setNote("");
    };


  /* =========================================================
     PROCESS APPLICATION
  ========================================================= */

  const processApplication =
    async (
      applicationId,
      action
    ) => {

      try {

        setProcessing(true);

        setMessage({
          type: "",
          text: "",
        });


        const token =
          getToken();


        if (!token) {
          throw new Error(
            "Admin login session not found."
          );
        }


        const response =
          await fetch(
            `${API_BASE}/api/admin/partner-applications/${applicationId}/${action}`,
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },

              body:
                JSON.stringify({
                  note:
                    note.trim() ||
                    null,
                }),
            }
          );


        const contentType =
          response.headers.get(
            "content-type"
          ) || "";


        let data = null;


        if (
          contentType.includes(
            "application/json"
          )
        ) {
          data =
            await response.json();
        } else {
          const text =
            await response.text();

          throw new Error(
            text ||
              "Server returned an invalid response."
          );
        }


        if (!response.ok) {
          throw new Error(
            data?.message ||
              `Failed to ${action} application.`
          );
        }


        setMessage({
          type: "success",

          text:
            action === "approve"
              ? "Partner application approved. The partner can now login."
              : "Partner application rejected.",
        });


        setSelectedApplication(
          null
        );

        setNote("");


        await loadApplications();

      } catch (error) {

        console.error(
          `${action.toUpperCase()} PARTNER APPLICATION ERROR:`,
          error
        );


        setMessage({
          type: "error",

          text:
            error.message ||
            `Failed to ${action} application.`,
        });

      } finally {

        setProcessing(false);

      }
    };


  /* =========================================================
     FORMAT DATE
  ========================================================= */

  const formatDate =
    (value) => {

      if (!value) {
        return "—";
      }

      const date =
        new Date(value);

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return "—";
      }

      return date.toLocaleString(
        undefined,
        {
          dateStyle: "medium",
          timeStyle: "short",
        }
      );
    };


  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="partner-applications-page">

        <div className="applications-loading">
          Loading partner applications...
        </div>

      </div>
    );
  }


  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <div className="partner-applications-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="partner-applications-header">

        <div>

          <span className="applications-eyebrow">
            ADMINISTRATION
          </span>

          <h1>
            Partner Applications
          </h1>

          <p>
            Review website signup applications
            before creating partner accounts.
          </p>

        </div>


        <div className="pending-count">

          <strong>
            {pendingCount}
          </strong>

          <span>
            Pending
          </span>

        </div>

      </header>


      {/* =====================================================
          MESSAGE
      ===================================================== */}

      {message.text && (
        <div
          className={`application-message ${message.type}`}
        >
          <span>
            {message.type ===
            "success"
              ? "✓"
              : "!"}
          </span>

          {message.text}
        </div>
      )}


      {/* =====================================================
          TABLE
      ===================================================== */}

      <section className="applications-card">

        <div className="applications-table-header">

          <span>
            APPLICANT
          </span>

          <span>
            PLAN
          </span>

          <span>
            COMPANY
          </span>

          <span>
            SUBMITTED
          </span>

          <span>
            STATUS
          </span>

          <span>
            ACTION
          </span>

        </div>


        {applications.length === 0 ? (

          <div className="applications-empty">

            <div className="empty-icon">
              ✓
            </div>

            <strong>
              No partner applications
            </strong>

            <span>
              New applications from the
              website will appear here.
            </span>

          </div>

        ) : (

          <div className="applications-list">

            {applications.map(
              (application) => (

                <div
                  className="application-row"
                  key={application.id}
                >

                  {/* APPLICANT */}

                  <div className="application-applicant">

                    <div className="application-avatar">

                      {application.profile_photo ? (

                        <img
                          src={
                            application.profile_photo
                          }
                          alt=""
                        />

                      ) : (

                        <span>
                          {(
                            application.name ||
                            "P"
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </span>

                      )}

                    </div>


                    <div className="application-person">

                      <strong>
                        {application.name}
                      </strong>

                      <span>
                        {application.email}
                      </span>

                    </div>

                  </div>


                  {/* PLAN */}

                  <div className="application-plan">

                    <span>
                      {application.plan_name}
                    </span>

                  </div>


                  {/* COMPANY */}

                  <div className="application-company">

                    <strong>
                      {application.company_name}
                    </strong>

                    <span>
                      {application.phone ||
                        "No phone"}
                    </span>

                  </div>


                  {/* DATE */}

                  <div className="application-date">

                    {formatDate(
                      application.created_at
                    )}

                  </div>


                  {/* STATUS */}

                  <div>

                    <span
                      className={`application-status ${application.status.toLowerCase()}`}
                    >
                      <i />
                      {application.status}
                    </span>

                  </div>


                  {/* ACTION */}

                  <div>

                    {application.status ===
                    "PENDING" ? (

                      <button
                        type="button"
                        className="review-application-button"
                        onClick={() =>
                          openApplication(
                            application
                          )
                        }
                      >
                        Review
                      </button>

                    ) : (

                      <span className="reviewed-label">
                        Reviewed
                      </span>

                    )}

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </section>


      {/* =====================================================
          REVIEW MODAL
      ===================================================== */}

      {selectedApplication && (

        <div
          className="application-modal-overlay"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {
              closeApplication();
            }

          }}
        >

          <div className="application-modal">

            {/* MODAL HEADER */}

            <div className="application-modal-header">

              <div>

                <span>
                  PARTNER APPLICATION
                </span>

                <h2>
                  Review Application
                </h2>

              </div>


              <button
                type="button"
                className="application-modal-close"
                onClick={
                  closeApplication
                }
                disabled={
                  processing
                }
              >
                ×
              </button>

            </div>


            {/* =================================================
                APPLICANT PROFILE
            ================================================= */}

            <div className="application-profile">

              <div className="application-profile-avatar">

                {selectedApplication.profile_photo ? (

                  <img
                    src={
                      selectedApplication.profile_photo
                    }
                    alt={
                      selectedApplication.name
                    }
                  />

                ) : (

                  <span>
                    {(
                      selectedApplication.name ||
                      "P"
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </span>

                )}

              </div>


              <div>

                <strong>
                  {
                    selectedApplication.name
                  }
                </strong>

                <span>
                  {
                    selectedApplication.email
                  }
                </span>

                <small>
                  {
                    selectedApplication.plan_name
                  }{" "}
                  Plan
                </small>

              </div>

            </div>


            {/* =================================================
                DETAILS
            ================================================= */}

            <div className="application-details-grid">

              <ApplicationDetail
                label="Full Name"
                value={
                  selectedApplication.name
                }
              />

              <ApplicationDetail
                label="Email"
                value={
                  selectedApplication.email
                }
              />

              <ApplicationDetail
                label="Company"
                value={
                  selectedApplication.company_name
                }
              />

              <ApplicationDetail
                label="Phone"
                value={
                  selectedApplication.phone ||
                  "Not provided"
                }
              />

              <ApplicationDetail
                label="Selected Plan"
                value={
                  selectedApplication.plan_name
                }
              />

              <ApplicationDetail
                label="Submitted"
                value={
                  formatDate(
                    selectedApplication.created_at
                  )
                }
              />

            </div>


            {/* =================================================
                PHOTO
            ================================================= */}

            {selectedApplication.profile_photo && (

              <div className="application-photo-section">

                <span>
                  PROFILE PHOTO
                </span>

                <img
                  src={
                    selectedApplication.profile_photo
                  }
                  alt={
                    selectedApplication.name
                  }
                />

              </div>

            )}


            {/* =================================================
                PASSWORD NOTICE
            ================================================= */}

            <div className="application-password-notice">

              <span>
                🔐
              </span>

              <div>

                <strong>
                  Password is protected
                </strong>

                <small>
                  The applicant's password is stored
                  securely as a hash and is never
                  displayed to the admin.
                </small>

              </div>

            </div>


            {/* =================================================
                NOTE
            ================================================= */}

            <div className="application-note">

              <label htmlFor="application-note">
                Admin Note
              </label>

              <textarea
                id="application-note"
                value={note}
                onChange={(event) =>
                  setNote(
                    event.target.value
                  )
                }
                placeholder="Optional note for this application..."
                disabled={
                  processing
                }
              />

            </div>


            {/* =================================================
                ACTIONS
            ================================================= */}

            <div className="application-actions">

              <button
                type="button"
                className="reject-application-button"
                disabled={
                  processing
                }
                onClick={() =>
                  processApplication(
                    selectedApplication.id,
                    "reject"
                  )
                }
              >
                Reject
              </button>


              <button
                type="button"
                className="approve-application-button"
                disabled={
                  processing
                }
                onClick={() =>
                  processApplication(
                    selectedApplication.id,
                    "approve"
                  )
                }
              >
                {processing
                  ? "Processing..."
                  : "Approve Partner"}
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}


/* =========================================================
   APPLICATION DETAIL
========================================================= */

function ApplicationDetail({
  label,
  value,
}) {
  return (
    <div className="application-detail">

      <span>
        {label}
      </span>

      <strong>
        {value || "Not provided"}
      </strong>

    </div>
  );
}


export default AdminPartnerApplications;
