import { useEffect, useState } from "react";
import api from "../api/axios";

const emptyForm = { client_name: "", email: "", phone: "", address: "" };

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadClients() {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/api/clients");
      setClients(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load clients");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClients();
  }, []);

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  function startAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function startEdit(client) {
    setEditingId(client.id);
    setForm({
      client_name: client.client_name,
      email: client.email,
      phone: client.phone || "",
      address: client.address || "",
    });
    setShowForm(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (editingId) {
        await api.put(`/api/clients/${editingId}`, form);
      } else {
        await api.post("/api/clients", form);
      }

      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      await loadClients();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save client");
    } finally {
      setSaving(false);
    }
  }

  async function deleteClient(id) {
    if (
      !window.confirm(
        "Delete this client? Related invoices will also be removed.",
      )
    ) {
      return;
    }

    try {
      await api.delete(`/api/clients/${id}`);
      await loadClients();
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete client");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-600">
            Save client contact details for invoice creation.
          </p>
        </div>
        <button
          onClick={startAdd}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 sm:w-auto"
        >
          Add Client
        </button>
      </div>
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6"
        >
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            {editingId ? "Edit Client" : "Add Client"}
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input
              name="client_name"
              value={form.client_name}
              onChange={updateField}
              placeholder="Client Name"
              className="rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-600"
              required
            />
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={updateField}
              placeholder="Email"
              className="rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-600"
              required
            />
            <input
              name="phone"
              value={form.phone}
              onChange={updateField}
              placeholder="Phone"
              className="rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-600"
            />
            <input
              name="address"
              value={form.address}
              onChange={updateField}
              placeholder="Address"
              className="rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-600"
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:flex">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-70"
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Update Client"
                  : "Save Client"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
        {loading ? (
          <div className="py-8 text-center text-sm text-gray-500">
            Loading clients...
          </div>
        ) : (
          <>
          <div className="space-y-3 md:hidden">
            {clients.map((client) => (
              <article key={client.id} className="rounded-lg border border-gray-100 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-900">{client.client_name}</p>
                  <p className="truncate text-sm text-gray-600">{client.email}</p>
                </div>
                <dl className="mt-3 space-y-1 text-sm text-gray-700">
                  <div><span className="text-gray-500">Phone: </span>{client.phone || "-"}</div>
                  <div><span className="text-gray-500">Address: </span>{client.address || "-"}</div>
                </dl>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => startEdit(client)}
                    className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteClient(client.id)}
                    className="rounded-lg bg-red-500 px-3 py-2 text-xs font-medium text-white hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
            {clients.length === 0 && (
              <div className="py-6 text-center text-sm text-gray-500">No clients saved yet.</div>
            )}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Address</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {clients.map((client) => (
                  <tr key={client.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {client.client_name}
                    </td>
                    <td className="px-4 py-3">{client.email}</td>
                    <td className="px-4 py-3">{client.phone || "-"}</td>
                    <td className="px-4 py-3">{client.address || "-"}</td>
                    <td className="space-x-2 px-4 py-3">
                      <button
                        onClick={() => startEdit(client)}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteClient(client.id)}
                        className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {clients.length === 0 && (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-4 py-6 text-center text-gray-500"
                    >
                      No clients saved yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>
    </div>
  );
}
