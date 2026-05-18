import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const money = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
});

function today() {
  return new Date().toISOString().slice(0, 10);
}

function newItem() {
  return { description: "", quantity: 1, unit_price: 0 };
}
export default function CreateInvoice() {
  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState("");
  const [items, setItems] = useState([newItem()]);
  const [issueDate, setIssueDate] = useState(today());
  const [dueDate, setDueDate] = useState(today());
  const [taxRate, setTaxRate] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loadingClients, setLoadingClients] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadClients() {
      try {
        const response = await api.get("/api/clients");
        setClients(response.data);
        if (response.data.length > 0) {
          setClientId(String(response.data[0].id));
        }
      } catch (err) {
        setError(err.response?.data?.message || "Could not load clients");
      } finally {
        setLoadingClients(false);
      }
    }

    loadClients();
  }, []);

  const totals = useMemo(() => {
    const calculatedItems = items.map((item) => {
      const quantity = Number(item.quantity || 0);
      const unitPrice = Number(item.unit_price || 0);
      return { ...item, line_total: quantity * unitPrice };
    });
    const subtotal = calculatedItems.reduce(
      (sum, item) => sum + item.line_total,
      0,
    );
    const taxAmount = (subtotal * Number(taxRate || 0)) / 100;
    const grandTotal = subtotal + taxAmount - Number(discount || 0);

    return {
      calculatedItems,
      subtotal,
      taxAmount,
      grandTotal: grandTotal < 0 ? 0 : grandTotal,
    };
  }, [discount, items, taxRate]);

  function updateItem(index, field, value) {
    setItems((currentItems) =>
      currentItems.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  }

  function addItem() {
    setItems([...items, newItem()]);
  }

  function removeItem(index) {
    if (items.length === 1) {
      return;
    }

    setItems(items.filter((item, itemIndex) => itemIndex !== index));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    if (!clientId) {
      setError("Please add and select a client before creating an invoice.");
      setSubmitting(false);
      return;
    }

    const validItems = totals.calculatedItems.filter(
      (item) => item.description && Number(item.quantity) > 0,
    );

    if (validItems.length === 0) {
      setError("Add at least one valid line item.");
      setSubmitting(false);
      return;
    }

    try {
      await api.post("/api/invoices", {
        client_id: Number(clientId),
        issue_date: issueDate,
        due_date: dueDate,
        tax_rate: Number(taxRate || 0),
        discount: Number(discount || 0),
        subtotal: totals.subtotal,
        total: totals.grandTotal,
        notes,
        items: validItems,
      });

      navigate("/invoices");
    } catch (err) {
      setError(err.response?.data?.message || "Could not create invoice");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-gray-900">Create Invoice</h1>
        <p className="text-sm text-gray-600">
          Select a client, add billable items, and save the invoice.
        </p>
      </div>
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {loadingClients && (
        <div className="rounded-lg bg-indigo-50 p-3 text-sm text-indigo-700">
          Loading clients...
        </div>
      )}
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="text-sm font-medium text-gray-700">Client</label>
            <select
              value={clientId}
              onChange={(event) => setClientId(event.target.value)}
              disabled={loadingClients}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-600 disabled:bg-gray-100"
              required
            >
              <option value="">Select client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.client_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">
              Issue Date
            </label>
            <input
              type="date"
              value={issueDate}
              onChange={(event) => setIssueDate(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-600"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-600"
              required
            />
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Line Items</h2>
          <button
            type="button"
            onClick={addItem}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Add Line Item
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-3 py-3">Description</th>
                <th className="px-3 py-3">Qty</th>
                <th className="px-3 py-3">Unit Price</th>
                <th className="px-3 py-3">Line Total</th>
                <th className="px-3 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item, index) => {
                const lineTotal =
                  Number(item.quantity || 0) * Number(item.unit_price || 0);
                return (
                  <tr key={index}>
                    <td className="px-3 py-3">
                      <input
                        value={item.description}
                        onChange={(event) =>
                          updateItem(index, "description", event.target.value)
                        }
                        className="w-full min-w-64 rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-600"
                        required
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(event) =>
                          updateItem(index, "quantity", event.target.value)
                        }
                        className="w-24 rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-600"
                        required
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(event) =>
                          updateItem(index, "unit_price", event.target.value)
                        }
                        className="w-36 rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-600"
                        required
                      />
                    </td>
                    <td className="px-3 py-3 font-medium text-gray-900">
                      {money.format(lineTotal)}
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Invoice Details
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Tax Rate (%)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={taxRate}
                onChange={(event) => setTaxRate(event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Discount (₦)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={discount}
                onChange={(event) => setDiscount(event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-600"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows="4"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-600"
            />
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Totals</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <strong>{money.format(totals.subtotal)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Tax Amount</span>
              <strong>{money.format(totals.taxAmount)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Discount</span>
              <strong>{money.format(Number(discount || 0))}</strong>
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-3 text-lg">
              <span>Grand Total</span>
              <strong>{money.format(totals.grandTotal)}</strong>
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-70"
          >
            {submitting ? "Saving invoice..." : "Save Invoice"}
          </button>
        </div>
      </div>
    </form>
  );
}
