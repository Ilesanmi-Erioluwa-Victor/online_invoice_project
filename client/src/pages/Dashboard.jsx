import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import StatusBadge from '../components/StatusBadge';

const money = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' });

// Dashboard shows key invoice totals and the five newest invoices.
export default function Dashboard() {
  const [summary, setSummary] = useState({});
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // This useEffect runs when the dashboard opens to load report totals and recent invoices.
  useEffect(() => {
    async function loadDashboard() {
      try {
        const [summaryResponse, invoicesResponse] = await Promise.all([
          api.get('/api/reports/summary'),
          api.get('/api/invoices'),
        ]);
        setSummary(summaryResponse.data);
        setInvoices(invoicesResponse.data.slice(0, 5));
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load dashboard');
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const cards = [
    { label: 'Total Invoiced', value: summary.total_invoiced },
    { label: 'Total Paid', value: summary.total_paid },
    { label: 'Total Pending', value: summary.total_pending },
    { label: 'Total Overdue', value: summary.total_overdue },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-600">Overview of your invoices and payments.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <Link to="/clients" className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-100">Add Client</Link>
          <Link to="/invoices/create" className="rounded-lg bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-indigo-700">Create Invoice</Link>
        </div>
      </div>
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="mt-2 break-words text-xl font-bold text-gray-900 sm:text-2xl">{money.format(Number(card.value || 0))}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Recent Invoices</h2>
        {loading ? (
          <div className="py-8 text-center text-sm text-gray-500">Loading dashboard data...</div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3">Invoice No.</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">{invoice.invoice_number}</td>
                  <td className="px-4 py-3">{invoice.client_name}</td>
                  <td className="px-4 py-3">{money.format(Number(invoice.total))}</td>
                  <td className="px-4 py-3"><StatusBadge status={invoice.status} /></td>
                  <td className="px-4 py-3">{invoice.due_date?.slice(0, 10)}</td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr><td colSpan="5" className="px-4 py-6 text-center text-gray-500">No invoices yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  );
}
