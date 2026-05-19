import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/axios";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const ref = searchParams.get("ref");
  const [status, setStatus] = useState("verifying");

  useEffect(() => {
    if (!ref) {
      setStatus("error");
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await api.get(`/api/pay/${ref}`);
        if (response.data.status === "paid") {
          setStatus("paid");
        } else {
          setStatus("pending");
        }
      } catch {
        setStatus("error");
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [ref]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm text-center">
        {status === "verifying" && (
          <>
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            <h1 className="text-xl font-bold text-gray-900">
              Verifying payment...
            </h1>
            <p className="mt-2 text-sm text-gray-500">Please wait a moment.</p>
          </>
        )}
        {status === "paid" && (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Payment Successful!
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Thank you for your payment. A receipt has been sent to your email.
            </p>
            <p className="mt-4 text-xs text-gray-400">Reference: {ref}</p>
          </>
        )}
        {status === "pending" && (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
              <svg
                className="h-8 w-8 text-yellow-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              Payment Processing
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Your payment is being processed. Check your email shortly for a
              receipt.
            </p>
          </>
        )}
        {status === "error" && (
          <>
            <h1 className="text-xl font-bold text-red-600">
              Something went wrong
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Could not verify your payment. Please contact support.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
