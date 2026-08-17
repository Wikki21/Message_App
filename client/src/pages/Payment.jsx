import React, {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import "./Payment.css";


const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "http://localhost:5000";


function Payment() {
  const navigate =
    useNavigate();

  const [
    searchParams,
  ] = useSearchParams();


  const plan =
    (
      searchParams.get(
        "plan"
      ) || "solo"
    ).toLowerCase();


  const [
    paymentPlan,
    setPaymentPlan,
  ] = useState(null);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    processing,
    setProcessing,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  useEffect(() => {
    const loadPlan =
      async () => {
        try {
          setLoading(true);
          setError("");

          const response =
            await fetch(
              `${API_BASE}/api/payment/plans`
            );

          const data =
            await response.json();

          if (!response.ok) {
            throw new Error(
              data.message ||
                "Failed to load payment plans."
            );
          }


          const selected =
            data.plans?.find(
              (item) =>
                item.key === plan
            );


          if (!selected) {
            throw new Error(
              "Selected plan is not available."
            );
          }


          setPaymentPlan(
            selected
          );

        } catch (err) {
          console.error(
            "LOAD PAYMENT PLAN ERROR:",
            err
          );

          setError(
            err.message ||
              "Failed to load payment plan."
          );

        } finally {
          setLoading(false);
        }
      };


    loadPlan();

  }, [plan]);


  const loadRazorpay =
    () => {
      return new Promise(
        (resolve) => {
          if (
            window.Razorpay
          ) {
            resolve(true);
            return;
          }

          const script =
            document.createElement(
              "script"
            );

          script.src =
            "https://checkout.razorpay.com/v1/checkout.js";

          script.onload =
            () => resolve(true);

          script.onerror =
            () => resolve(false);

          document.body.appendChild(
            script
          );
        }
      );
    };


  const handlePayment =
    async () => {
      try {
        setProcessing(true);
        setError("");


        const loaded =
          await loadRazorpay();


        if (!loaded) {
          throw new Error(
            "Unable to load Razorpay Checkout."
          );
        }


        const createResponse =
          await fetch(
            `${API_BASE}/api/payment/create`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  plan,
                }),
            }
          );


        const createData =
          await createResponse.json();


        if (!createResponse.ok) {
          throw new Error(
            createData.message ||
              "Unable to create payment."
          );
        }


        const {
          paymentToken,
          razorpayKeyId,
          subscription,
        } = createData;


        const options = {
          key:
            razorpayKeyId,

          subscription_id:
            subscription.id,

          name:
            "Zaploft",

          description:
            `${subscription.planName} Partner Plan`,

          prefill: {
            name: "",
            email: "",
            contact: "",
          },

          theme: {
            color:
              "#7c3aed",
          },

          handler:
            async (
              response
            ) => {
              try {
                setProcessing(
                  true
                );


                const verifyResponse =
                  await fetch(
                    `${API_BASE}/api/payment/verify`,
                    {
                      method:
                        "POST",

                      headers: {
                        "Content-Type":
                          "application/json",
                      },

                      body:
                        JSON.stringify({
                          payment_token:
                            paymentToken,

                          razorpay_payment_id:
                            response.razorpay_payment_id,

                          razorpay_subscription_id:
                            response.razorpay_subscription_id,

                          razorpay_signature:
                            response.razorpay_signature,
                        }),
                    }
                  );


                const verifyData =
                  await verifyResponse.json();


                if (
                  !verifyResponse.ok ||
                  !verifyData.paid
                ) {
                  throw new Error(
                    verifyData.message ||
                      "Payment verification failed."
                  );
                }


                navigate(
                  `/create-account?plan=${encodeURIComponent(
                    verifyData.plan
                  )}&payment_token=${encodeURIComponent(
                    verifyData.paymentToken
                  )}`,
                  {
                    replace: true,
                  }
                );

              } catch (err) {
                console.error(
                  "PAYMENT VERIFY ERROR:",
                  err
                );

                setError(
                  err.message ||
                    "Payment verification failed."
                );

                setProcessing(
                  false
                );
              }
            },


          modal: {
            ondismiss:
              () => {
                setProcessing(
                  false
                );
              },
          },
        };


        const razorpay =
          new window.Razorpay(
            options
          );


        razorpay.on(
          "payment.failed",
          (
            response
          ) => {
            console.error(
              "RAZORPAY PAYMENT FAILED:",
              response
            );

            setError(
              response.error
                ?.description ||
                "Payment failed."
            );

            setProcessing(
              false
            );
          }
        );


        razorpay.open();

      } catch (err) {
        console.error(
          "PAYMENT ERROR:",
          err
        );

        setError(
          err.message ||
            "Unable to start payment."
        );

        setProcessing(
          false
        );
      }
    };


  if (loading) {
    return (
      <div className="payment-page">

        <div className="payment-card">

          <div className="payment-loading">
            Loading plan...
          </div>

        </div>

      </div>
    );
  }


  if (!paymentPlan) {
    return (
      <div className="payment-page">

        <div className="payment-card">

          <div className="payment-error">
            {error ||
              "Plan not found."}
          </div>

          <button
            type="button"
            onClick={() =>
              navigate("/")
            }
          >
            Back to Zaploft
          </button>

        </div>

      </div>
    );
  }


  return (
    <div className="payment-page">

      <div className="payment-card">

        <div className="payment-brand">

          <div>
            Z
          </div>

          <span>
            Zaploft
          </span>

        </div>


        <div className="payment-heading">

          <span>
            SELECTED PLAN
          </span>

          <h1>
            {paymentPlan.name}
          </h1>

          <p>
            Complete your payment before
            creating your Partner account.
          </p>

        </div>


        <div className="payment-summary">

          <div>

            <span>
              Plan
            </span>

            <strong>
              {paymentPlan.name}
            </strong>

          </div>


          <div>

            <span>
              Monthly
            </span>

            <strong>
              ₹
              {Number(
                paymentPlan.amount
              ).toLocaleString(
                "en-IN",
                {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }
              )}
            </strong>

          </div>

        </div>


        {error && (
          <div className="payment-error">
            {error}
          </div>
        )}


        <div className="payment-security">

          <span>
            🔒
          </span>

          <div>

            <strong>
              Secure Razorpay payment
            </strong>

            <small>
              Your Partner account form opens
              only after the payment is verified
              by the Zaploft server.
            </small>

          </div>

        </div>


        <button
          type="button"
          className="payment-button"
          onClick={
            handlePayment
          }
          disabled={
            processing
          }
        >

          {processing
            ? "Processing..."
            : `Pay ₹${Number(
                paymentPlan.amount
              ).toLocaleString(
                "en-IN",
                {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }
              )}`}

        </button>


        <button
          type="button"
          className="payment-back"
          onClick={() =>
            navigate("/")
          }
          disabled={
            processing
          }
        >
          ← Back to plans
        </button>

      </div>

    </div>
  );
}


export default Payment;