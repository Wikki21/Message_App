import React, { useEffect, useState } from "react";
import "./AdminProfileRequests.css";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "http://localhost:5000";

function AdminProfileRequests() {
  const [requests, setRequests] = useState([]);

  const [loading, setLoading] = useState(true);

  const [selectedRequest, setSelectedRequest] =
    useState(null);

  const [reviewing, setReviewing] =
    useState(false);

  const [note, setNote] = useState("");

  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  const token =
    localStorage.getItem("token");

  /* =====================================================
     LOAD REQUESTS
  ===================================================== */

  const loadRequests = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE}/api/admin/profile-requests`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load requests."
        );
      }

      setRequests(
        data.requests || []
      );
    } catch (error) {
      console.error(error);

      setMessage({
        type: "error",
        text:
          error.message ||
          "Failed to load profile requests.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  /* =====================================================
     REVIEW
  ===================================================== */

  const handleReview = async (
    requestId,
    action
  ) => {
    try {
      setReviewing(true);

      const response = await fetch(
        `${API_BASE}/api/admin/profile-requests/${requestId}/${action}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            note,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Failed to ${action} request.`
        );
      }

      setMessage({
        type: "success",
        text:
          action === "approve"
            ? "Profile changes approved successfully."
            : "Profile change request rejected.",
      });

      setSelectedRequest(null);
      setNote("");

      await loadRequests();
    } catch (error) {
      console.error(error);

      setMessage({
        type: "error",
        text:
          error.message ||
          "Failed to process request.",
      });
    } finally {
      setReviewing(false);
    }
  };

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="admin-profile-requests">
        <div className="requests-loading">
          Loading profile requests...
        </div>
      </div>
    );
  }

  return (
    <div className="admin-profile-requests">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="requests-header">

        <div>
          <span>
            ADMINISTRATION
          </span>

          <h1>
            Profile Change Requests
          </h1>

          <p>
            Review partner profile changes
            before they become official.
          </p>
        </div>

        <div className="request-count">
          {
            requests.filter(
              (item) =>
                item.status === "PENDING"
            ).length
          }

          <small>
            Pending
          </small>
        </div>

      </div>


      {/* =================================================
          MESSAGE
      ================================================= */}

      {message.text && (
        <div
          className={`admin-request-message ${message.type}`}
        >
          {message.text}
        </div>
      )}


      {/* =================================================
          REQUEST LIST
      ================================================= */}

      <div className="requests-card">

        {requests.length === 0 ? (
          <div className="empty-requests">

            <div>
              ✓
            </div>

            <strong>
              No profile requests
            </strong>

            <span>
              Partner profile change requests
              will appear here.
            </span>

          </div>
        ) : (
          <div className="request-list">

            {requests.map((request) => (
              <RequestRow
                key={request.id}
                request={request}
                onReview={() =>
                  setSelectedRequest(
                    request
                  )
                }
              />
            ))}

          </div>
        )}

      </div>


      {/* =================================================
          REVIEW MODAL
      ================================================= */}

      {selectedRequest && (
        <div className="request-modal-overlay">

          <div className="request-modal">

            <div className="request-modal-header">

              <div>
                <span>
                  REVIEW REQUEST
                </span>

                <h2>
                  Partner Profile Changes
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedRequest(null)
                }
              >
                ×
              </button>

            </div>


            {/* CURRENT */}

            <div className="comparison-grid">

              <div className="comparison-column">

                <h3>
                  Current Information
                </h3>

                <InfoRow
                  label="Name"
                  value={
                    selectedRequest.current_name
                  }
                />

                <InfoRow
                  label="Email"
                  value={
                    selectedRequest.current_email
                  }
                />

                <InfoRow
                  label="Company"
                  value={
                    selectedRequest.current_company_name
                  }
                />

                <InfoRow
                  label="Phone"
                  value={
                    selectedRequest.current_phone ||
                    "Not provided"
                  }
                />

                <PhotoPreview
                  title="Current Photo"
                  src={
                    selectedRequest.current_profile_photo
                  }
                />

              </div>


              {/* REQUESTED */}

              <div className="comparison-column requested">

                <h3>
                  Requested Changes
                </h3>

                <InfoRow
                  label="Name"
                  value={
                    selectedRequest.requested_name
                  }
                />

                <InfoRow
                  label="Email"
                  value={
                    selectedRequest.current_email
                  }
                />

                <InfoRow
                  label="Company"
                  value={
                    selectedRequest.requested_company_name
                  }
                />

                <InfoRow
                  label="Phone"
                  value={
                    selectedRequest.requested_phone ||
                    "Not provided"
                  }
                />

                <PhotoPreview
                  title="Requested Photo"
                  src={
                    selectedRequest.requested_profile_photo
                  }
                />

              </div>

            </div>


            {/* PASSWORD NOTICE */}

            <div className="password-review-notice">

              🔐

              <span>
                This request may contain a
                password change. The password
                itself is never displayed to
                the admin.
              </span>

            </div>


            {/* NOTE */}

            <div className="review-note">

              <label>
                Admin Note
              </label>

              <textarea
                value={note}
                onChange={(event) =>
                  setNote(
                    event.target.value
                  )
                }
                placeholder="Optional note..."
              />

            </div>


            {/* ACTIONS */}

            <div className="review-actions">

              <button
                type="button"
                className="reject-button"
                disabled={reviewing}
                onClick={() =>
                  handleReview(
                    selectedRequest.id,
                    "reject"
                  )
                }
              >
                Reject
              </button>

              <button
                type="button"
                className="approve-button"
                disabled={reviewing}
                onClick={() =>
                  handleReview(
                    selectedRequest.id,
                    "approve"
                  )
                }
              >
                {reviewing
                  ? "Processing..."
                  : "Approve Changes"}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}


/* =========================================================
   REQUEST ROW
========================================================= */

function RequestRow({
  request,
  onReview,
}) {
  const initial =
    request.requested_name
      ?.charAt(0)
      ?.toUpperCase() || "P";

  return (
    <div className="request-row">

      <div className="request-avatar">

        {request.requested_profile_photo ? (
          <img
            src={
              request.requested_profile_photo
            }
            alt=""
          />
        ) : (
          initial
        )}

      </div>


      <div className="request-main">

        <strong>
          {request.requested_name}
        </strong>

        <span>
          {request.requested_company_name}
        </span>

        <small>
          Requested{" "}
          {new Date(
            request.created_at
          ).toLocaleString()}
        </small>

      </div>


      <div
        className={`request-status ${request.status.toLowerCase()}`}
      >
        {request.status}
      </div>


      {request.status ===
        "PENDING" && (
        <button
          type="button"
          className="review-button"
          onClick={onReview}
        >
          Review
        </button>
      )}

    </div>
  );
}


/* =========================================================
   INFO
========================================================= */

function InfoRow({
  label,
  value,
}) {
  return (
    <div className="info-row">

      <span>
        {label}
      </span>

      <strong>
        {value || "Not provided"}
      </strong>

    </div>
  );
}


/* =========================================================
   PHOTO
========================================================= */

function PhotoPreview({
  title,
  src,
}) {
  return (
    <div className="photo-preview">

      <span>
        {title}
      </span>

      {src ? (
        <img
          src={src}
          alt={title}
        />
      ) : (
        <div className="no-photo">
          No photo
        </div>
      )}

    </div>
  );
}


export default AdminProfileRequests;