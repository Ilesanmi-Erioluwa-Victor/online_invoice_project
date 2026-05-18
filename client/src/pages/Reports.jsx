import { useEffect, useState } from 'react';
import api from '../api/axios';

const money = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' });

// Reports displays financial summaries grouped by invoice status.
export default function Reports() {
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // This useEffect runs when the reports page opens to fetch the user's invoice summary.
  useEffect(() => {
    async function loadSummary() {
      try {
        const response = await api.get('/api/reports/summary');
        setSummary(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load reports');
      } finally {
        setLoading(false);
      }
    }

    loadSummary();
  }, []);

  const cards = [
    { label: 'Total Invoiced', value: summary.total_invoiced },
    { label: 'Total Paid', value: summary.total_paid },
    { label: 'Total Pending', value: summary.total_pending },
    { label: 'Total Overdue', value: summary.total_overdue },
  ];

  const rows = [
    { status: 'Paid', count: summary.paid_count, total: summary.total_paid },
    { status: 'Pending', count: summary.pending_count, total: summary.total_pending },
    { status: 'Overdue', count: summary.overdue_count, total: summary.total_overdue },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-600">Financial summary of your invoice records.</p>
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
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Status Breakdown</h2>
        {loading ? (
          <div className="py-8 text-center text-sm text-gray-500">Loading reports...</div>
        ) : (
        <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Invoice Count</th>
              <th className="px-4 py-3">Total Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => (
              <tr key={row.status}>
                <td className="px-4 py-3 font-medium text-gray-900">{row.status}</td>
                <td className="px-4 py-3">{Number(row.count || 0)}</td>
                <td className="px-4 py-3">{money.format(Number(row.total || 0))}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        )}
      </div>
    </div>
  );
}
