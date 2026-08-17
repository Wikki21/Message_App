
import React from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useSearchParams,
} from "react-router-dom";

import DashboardLayout
  from "./layouts/DashboardLayout";

import Login
  from "./pages/Login";

import Dashboard
  from "./pages/Dashboard";

import Customers
  from "./pages/Customers";

import Campaigns
  from "./pages/Campaigns";

import Reports
  from "./pages/Reports";

import Templates
  from "./pages/Templates";

import WhatsAppCampaign
  from "./pages/WhatsAppCampaign";

import SmsCampaign
  from "./pages/SmsCampaign";

import MailCampaign
  from "./pages/MailCampaign";

import PartnerSettings
  from "./pages/PartnerSettings";

import PartnerCreateAccount
  from "./pages/PartnerCreateAccount";

import AdminPartnerApplications
  from "./pages/AdminPartnerApplications";

import AdminProfileRequests
  from "./pages/AdminProfileRequests";

import ProtectedRoute
  from "./components/ProtectedRoute";

import {
  useAuth,
} from "./context/AuthContext";

import Payment
  from "./pages/Payment";


/* =========================================================
   DEMO PAYMENT REDIRECT

   For today's demo:

   /payment?plan=solo
        ↓
   /create-account?plan=solo

   /payment?plan=pro
        ↓
   /create-account?plan=pro

   /payment?plan=business
        ↓
   /create-account?plan=business
========================================================= */

function DemoPaymentRedirect() {
  const [
    searchParams,
  ] = useSearchParams();


  const plan =
    (
      searchParams.get(
        "plan"
      ) || "solo"
    )
      .trim()
      .toLowerCase();


  const validPlans = [
    "solo",
    "pro",
    "business",
  ];


  const selectedPlan =
    validPlans.includes(
      plan
    )
      ? plan
      : "solo";


  return (
    <Navigate
      to={`/create-account?plan=${encodeURIComponent(
        selectedPlan
      )}`}
      replace
    />
  );
}


/* =========================================================
   PARTNER LAYOUT
========================================================= */

function PartnerLayout() {
  return (
    <ProtectedRoute
      allowedRoles={[
        "PARTNER",
      ]}
    >
      <DashboardLayout />
    </ProtectedRoute>
  );
}


/* =========================================================
   ADMIN LAYOUT
========================================================= */

function AdminLayout() {
  return (
    <ProtectedRoute
      allowedRoles={[
        "ADMIN",
      ]}
    >
      <DashboardLayout />
    </ProtectedRoute>
  );
}


/* =========================================================
   ROOT REDIRECT
========================================================= */

function RootRedirect() {

  const {
    isAuthenticated,
    role,
  } = useAuth();


  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }


  if (
    role === "ADMIN"
  ) {
    return (
      <Navigate
        to="/admin/dashboard"
        replace
      />
    );
  }


  if (
    role === "PARTNER"
  ) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }


  return (
    <Navigate
      to="/login"
      replace
    />
  );
}


/* =========================================================
   APP
========================================================= */

function App() {

  return (
    <BrowserRouter>

      <Routes>

        {/* =================================================
            PUBLIC LOGIN
        ================================================= */}

        <Route
          path="/login"
          element={
            <Login />
          }
        />


        {/* =================================================
            DEMO PAYMENT REDIRECT

            IMPORTANT:
            Payment page is bypassed for today's demo.
        ================================================= */}

        <Route
          path="/payment"
          element={
            <DemoPaymentRedirect />
          }
        />


        {/* =================================================
            KEEP PAYMENT COMPONENT AVAILABLE

            You can remove this later when real
            Razorpay flow is activated.

            For today's demo the route above handles
            /payment and redirects to Create Account.
        ================================================= */}

        {/* 
        <Route
          path="/payment-real"
          element={
            <Payment />
          }
        />
        */}


        {/* =================================================
            PUBLIC PARTNER CREATE ACCOUNT
        ================================================= */}

        <Route
          path="/create-account"
          element={
            <PartnerCreateAccount />
          }
        />


        {/* =================================================
            ROOT
        ================================================= */}

        <Route
          path="/"
          element={
            <RootRedirect />
          }
        />


        {/* =================================================
            PARTNER APPLICATION
        ================================================= */}

        <Route
          element={
            <PartnerLayout />
          }
        >

          {/* -----------------------------------------------
              DASHBOARD
          ----------------------------------------------- */}

          <Route
            path="/dashboard"
            element={
              <Dashboard />
            }
          />


          {/* -----------------------------------------------
              CUSTOMERS
          ----------------------------------------------- */}

          <Route
            path="/dashboard/customers"
            element={
              <Customers />
            }
          />


          {/* -----------------------------------------------
              CAMPAIGNS
          ----------------------------------------------- */}

          <Route
            path="/dashboard/campaigns"
            element={
              <Campaigns />
            }
          />


          {/* -----------------------------------------------
              REPORTS
          ----------------------------------------------- */}

          <Route
            path="/dashboard/reports"
            element={
              <Reports />
            }
          />


          {/* -----------------------------------------------
              TEMPLATES
          ----------------------------------------------- */}

          <Route
            path="/dashboard/templates"
            element={
              <Templates />
            }
          />


          {/* -----------------------------------------------
              SETTINGS
          ----------------------------------------------- */}

          <Route
            path="/dashboard/settings"
            element={
              <PartnerSettings />
            }
          />


          {/* -----------------------------------------------
              WHATSAPP
          ----------------------------------------------- */}

          <Route
            path="/campaigns/whatsapp"
            element={
              <WhatsAppCampaign />
            }
          />


          {/* -----------------------------------------------
              SMS
          ----------------------------------------------- */}

          <Route
            path="/campaigns/sms"
            element={
              <SmsCampaign />
            }
          />


          {/* -----------------------------------------------
              MAIL
          ----------------------------------------------- */}

          <Route
            path="/campaigns/mail"
            element={
              <MailCampaign />
            }
          />


          {/* -----------------------------------------------
              COMPATIBILITY ROUTES
          ----------------------------------------------- */}

          <Route
            path="/dashboard/whatsapp"
            element={
              <WhatsAppCampaign />
            }
          />

          <Route
            path="/dashboard/sms"
            element={
              <SmsCampaign />
            }
          />

          <Route
            path="/dashboard/mail"
            element={
              <MailCampaign />
            }
          />

        </Route>


        {/* =================================================
            ADMIN
        ================================================= */}

        <Route
          element={
            <AdminLayout />
          }
        >

          {/* -----------------------------------------------
              ADMIN DASHBOARD
          ----------------------------------------------- */}

          <Route
            path="/admin/dashboard"
            element={
              <Dashboard />
            }
          />


          {/* -----------------------------------------------
              PARTNER APPLICATIONS
          ----------------------------------------------- */}

          <Route
            path="/admin/partner-applications"
            element={
              <AdminPartnerApplications />
            }
          />


          {/* -----------------------------------------------
              PROFILE CHANGE REQUESTS
          ----------------------------------------------- */}

          <Route
            path="/admin/profile-requests"
            element={
              <AdminProfileRequests />
            }
          />

        </Route>


        {/* =================================================
            FALLBACK
        ================================================= */}
{/* check */}
        <Route
          path="*"
          element={
            <RootRedirect />
          }
        />

      </Routes>

    </BrowserRouter>
  );
}


export default App;
