import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import StatusBadge from "../components/StatusBadge";

const money = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
});
const filters = ["all", "pending", "paid", "overdue"];

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");

  async function loadInvoices() {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/api/invoices");
      setInvoices(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load invoices");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInvoices();
  }, []);

  const filteredInvoices = useMemo(() => {
    if (activeFilter === "all") {
      return invoices;
    }

    return invoices.filter((invoice) => invoice.status === activeFilter);
  }, [activeFilter, invoices]);

  const overdueCount = invoices.filter(
    (invoice) => invoice.status === "overdue",
  ).length;

  async function runAction(label, callback) {
    setActionLoading(label);
    setMessage("");
    setError("");

    try {
      await callback();
    } catch (err) {
      setError(err.response?.data?.message || "Action failed");
    } finally {
      setActionLoading("");
    }
  }

  async function markPaid(id) {
    await runAction(`paid-${id}`, async () => {
      await api.put(`/api/invoices/${id}/status`, { status: "paid" });
      setMessage("Invoice marked as paid");
      await loadInvoices();
    });
  }

  async function sendInvoice(id) {
    await runAction(`send-${id}`, async () => {
      const response = await api.post(`/api/invoices/${id}/send`);
      setMessage(response.data.message);
    });
  }

  async function downloadPDF(invoice) {
    await runAction(`pdf-${invoice.id}`, async () => {
      const response = await api.get(`/api/invoices/${invoice.id}/pdf`, {
        responseType: "blob",
      });
      const blobUrl = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" }),
      );
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${invoice.invoice_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    });
  }

  async function createPaymentLink(id) {
    await runAction(`pay-${id}`, async () => {
      const response = await api.post(`/api/invoices/${id}/payment-link`);
      window.open(response.data.payment_link, "_blank", "noopener,noreferrer");
      await loadInvoices();
    });
  }

  async function sendRemindersNow() {
    await runAction("reminders", async () => {
      const response = await api.post("/api/invoices/send-reminders");
      setMessage(response.data.message);
    });
  }

  async function deleteInvoice(id) {
    if (!window.confirm("Delete this invoice?")) {
      return;
    }

    await runAction(`delete-${id}`, async () => {
      await api.delete(`/api/invoices/${id}`);
      setMessage("Invoice deleted successfully");
      await loadInvoices();
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <p className="text-sm text-gray-600">
          View invoices, mark payments, send emails, and manage payment links.
        </p>
      </div>
      {overdueCount > 0 && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p>
              You have {overdueCount} overdue invoice(s). Reminder emails have
              been scheduled to be sent to your clients automatically.
            </p>
            <button
              onClick={sendRemindersNow}
              disabled={actionLoading === "reminders"}
              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-70"
            >
              {actionLoading === "reminders"
                ? "Sending..."
                : "Send Reminders Now"}
            </button>
          </div>
        </div>
      )}
      {message && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="flex gap-2">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`rounded-lg px-4 py-2 text-sm font-medium capitalize ${
              activeFilter === filter
                ? "bg-indigo-600 text-white"
                : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        {loading ? (
          <div className="py-8 text-center text-sm text-gray-500">
            Loading invoices...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3">Invoice No.</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Issue Date</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {invoice.invoice_number}
                    </td>
                    <td className="px-4 py-3">{invoice.client_name}</td>
                    <td className="px-4 py-3">
                      {invoice.issue_date?.slice(0, 10)}
                    </td>
                    <td className="px-4 py-3">
                      {invoice.due_date?.slice(0, 10)}
                    </td>
                    <td className="px-4 py-3">
                      {money.format(Number(invoice.total))}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={invoice.status} />
                    </td>
                    <td className="flex flex-wrap gap-2 px-4 py-3">
                      {invoice.status !== "paid" && (
                        <button
                          onClick={() => markPaid(invoice.id)}
                          disabled={actionLoading === `paid-${invoice.id}`}
                          className="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600 disabled:opacity-70"
                        >
                          {actionLoading === `paid-${invoice.id}`
                            ? "Saving..."
                            : "Mark as Paid"}
                        </button>
                      )}
                      {/* {(invoice.status !== "pending" ||
                        invoice.status === "overdue") &&
                        invoice.status !== "paid" && (
                          <button
                            onClick={() => createPaymentLink(invoice.id)}
                            disabled={actionLoading === `pay-${invoice.id}`}
                            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-70"
                          >
                            {actionLoading === `pay-${invoice.id}`
                              ? "Opening..."
                              : "Pay Now"}
                          </button>
                        )} */}
                      {/* <button
                        onClick={() => downloadPDF(invoice)}
                        disabled={actionLoading === `pdf-${invoice.id}`}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-70"
                      >
                        {actionLoading === `pdf-${invoice.id}`
                          ? "Downloading..."
                          : "Download PDF"}
                      </button> */}
                      <button
                        onClick={() => sendInvoice(invoice.id)}
                        disabled={actionLoading === `send-${invoice.id}`}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-70"
                      >
                        {actionLoading === `send-${invoice.id}`
                          ? "Sending..."
                          : "Send to Client"}
                      </button>
                      <button
                        onClick={() => deleteInvoice(invoice.id)}
                        disabled={actionLoading === `delete-${invoice.id}`}
                        className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-70"
                      >
                        {actionLoading === `delete-${invoice.id}`
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredInvoices.length === 0 && (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-4 py-6 text-center text-gray-500"
                    >
                      No invoices found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
