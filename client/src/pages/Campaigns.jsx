import React from "react";
import { useNavigate } from "react-router-dom";
import "./Campaigns.css";

function Campaigns() {
  const navigate = useNavigate();

  const campaigns = [
    {
      type: "whatsapp",
      label: "WhatsApp",
      title: "WhatsApp Campaign",
      description:
        "Send approved WhatsApp templates directly to your customers.",
      icon: "whatsapp",
      path: "/campaigns/whatsapp",
      color: "green",
    },
    {
      type: "sms",
      label: "SMS",
      title: "SMS Campaign",
      description:
        "Send SMS messages to your customer database with ease.",
      icon: "sms",
      path: "/campaigns/sms",
      color: "blue",
    },
    {
      type: "mail",
      label: "Email",
      title: "Mail Campaign",
      description:
        "Create and send professional email campaigns to your customers.",
      icon: "mail",
      path: "/campaigns/mail",
      color: "orange",
    },
  ];

  const renderIcon = (type) => {
    if (type === "whatsapp") {
      return (
        <svg viewBox="0 0 24 24">
          <path d="M20 11.6a8 8 0 0 1-11.9 7L4 20l1.4-4A8 8 0 1 1 20 11.6Z" />
          <path d="M8.7 8.2c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.6 1.4c.1.2 0 .5-.2.7l-.5.5c.6 1.1 1.5 2 2.7 2.5l.5-.6c.2-.2.4-.3.7-.2l1.4.6c.3.1.4.3.3.6-.2.9-.8 1.5-1.7 1.6-1.1.1-2.9-.8-4.2-2-1.3-1.2-2.2-2.9-2.3-4 0-.5.2-.9.5-1.1Z" />
        </svg>
      );
    }

    if (type === "sms") {
      return (
        <svg viewBox="0 0 24 24">
          <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3h-11A2.5 2.5 0 0 0 4 5.5v8A2.5 2.5 0 0 0 6.5 16H8v4l4-4h5.5a2.5 2.5 0 0 0 2.5-2.5v-8Z" />
          <path d="M8 9h8" />
          <path d="M8 12h5" />
        </svg>
      );
    }

    return (
      <svg viewBox="0 0 24 24">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m4 7 8 6 8-6" />
      </svg>
    );
  };

  return (
    <div className="campaigns-page">
      <header className="campaigns-header">
        <div>
          <div className="campaigns-breadcrumb">
            WORKSPACE <span>/</span> CAMPAIGNS
          </div>

          <h1>Campaigns</h1>

          <p>
            Choose a messaging channel to create and manage your campaign.
          </p>
        </div>

        <div className="campaigns-header-badge">
          <span className="campaigns-live-dot" />
          3 channels available
        </div>
      </header>

      <section className="campaigns-intro">
        <div className="campaigns-intro-number">01</div>

        <div>
          <span>MESSAGING CHANNELS</span>
          <h2>Choose how you want to reach customers</h2>
        </div>
      </section>

      <section className="campaign-cards">
        {campaigns.map((campaign, index) => (
          <article
            key={campaign.type}
            className={`campaign-card campaign-card-${campaign.color}`}
            onClick={() => navigate(campaign.path)}
          >
            <div className="campaign-card-top">
              <div className="campaign-icon">
                {renderIcon(campaign.icon)}
              </div>

              <span className="campaign-number">
                0{index + 1}
              </span>
            </div>

            <div className="campaign-card-content">
              <span className="campaign-channel">
                {campaign.label}
              </span>

              <h3>{campaign.title}</h3>

              <p>{campaign.description}</p>
            </div>

            <button
              className="campaign-start-button"
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                navigate(campaign.path);
              }}
            >
              <span>Start campaign</span>
              <span className="campaign-arrow">→</span>
            </button>

            <div className="campaign-card-decoration" />
          </article>
        ))}
      </section>

      <section className="campaigns-help">
        <div className="help-icon">?</div>

        <div>
          <strong>Need help choosing a channel?</strong>

          <p>
            WhatsApp is ideal for approved business templates and
            customer notifications. SMS and Email are available for
            broader messaging campaigns.
          </p>
        </div>
      </section>
    </div>
  );
}

export default Campaigns;