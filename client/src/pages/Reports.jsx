import React from "react";

function Reports() {
  return (
    <section className="page-content">
      <div className="page-header">
        <div>
          <span className="page-kicker">REPORTS</span>

          <h1>Reports</h1>

          <p>
            View your campaign performance and messaging reports.
          </p>
        </div>
      </div>

      <div className="report-grid">
        <div className="report-card">
          <div className="report-card-icon">◷</div>

          <div>
            <span>Total Campaigns</span>
            <strong>0</strong>
          </div>
        </div>

        <div className="report-card">
          <div className="report-card-icon">✓</div>

          <div>
            <span>Messages Sent</span>
            <strong>0</strong>
          </div>
        </div>

        <div className="report-card">
          <div className="report-card-icon">!</div>

          <div>
            <span>Failed Messages</span>
            <strong>0</strong>
          </div>
        </div>
      </div>

      <div className="page-panel">
        <div className="page-panel-header">
          <div>
            <h2>Campaign Reports</h2>

            <p>
              Your campaign reports will appear here.
            </p>
          </div>
        </div>

        <div className="empty-page">
          <div className="empty-page-icon">▧</div>

          <h3>No reports available</h3>

          <p>
            Send a campaign to start generating reports.
          </p>
        </div>
      </div>
    </section>
  );
}

export default Reports;