import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import StatusBadge from '../components/StatusBadge';

const money = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' });

// PayInvoice displays a public invoice payment page and lets the client confirm manual payment.
export default function PayInvoice() {
  const { invoice_number } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // loadInvoice receives no parameters, fetches public invoice payment data, and updates page state.
  async function loadInvoice() {
    setLoading(true);
    setError('');

    try {
      const response = await api.get(`/api/pay/${invoice_number}`);
      setInvoice(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load invoice');
    } finally {
      setLoading(false);
    }
  }

  // This useEffect runs when the public payment page opens to fetch invoice payment details.
  useEffect(() => {
    loadInvoice();
  }, [invoice_number]);

  // confirmPayment receives no parameters, marks the invoice paid, sends receipt email, and reloads the invoice.
  async function confirmPayment() {
    setConfirming(true);
    setMessage('');
    setError('');

    try {
      const response = await api.post(`/api/pay/${invoice_number}/confirm`);
      setMessage(`${response.data.message}. Thank you!`);
      await loadInvoice();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not confirm payment');
    } finally {
      setConfirming(false);
    }
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-700">Loading invoice...</div>;
  }

  if (error && !invoice) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-50 text-red-700">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-2xl rounded-xl border border-gray-100 bg-white p-8 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500">{invoice.business_name}</p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">Invoice #{invoice.invoice_number}</h1>
          </div>
          <StatusBadge status={invoice.status} />
        </div>
        {message && <div className="mt-6 rounded-lg bg-green-50 p-3 text-sm text-green-700">Payment Confirmed. Thank you!</div>}
        {error && <div className="mt-6 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <div className="mt-8 rounded-lg bg-gray-50 p-6">
          <p className="text-sm text-gray-500">Amount Due</p>
          <p className="mt-2 text-4xl font-bold text-gray-900">{money.format(Number(invoice.total || 0))}</p>
          <p className="mt-3 text-sm text-gray-600">Due Date: {invoice.due_date?.slice(0, 10)}</p>
        </div>
        <div className="mt-6 space-y-2 text-sm text-gray-700">
          <h2 className="text-base font-semibold text-gray-900">Bank Payment Details</h2>
          <p>Bank Name: {invoice.bank_name || '-'}</p>
          <p>Account Number: {invoice.account_number || '-'}</p>
          <p>Account Name: {invoice.account_name || '-'}</p>
          <p className="pt-2">Please use your invoice number as the payment reference.</p>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          {invoice.payment_link && invoice.status !== 'paid' && (
            <button onClick={() => window.location.assign(invoice.payment_link)} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              Pay Online with Paystack
            </button>
          )}
          {invoice.status !== 'paid' && (
            <button onClick={confirmPayment} disabled={confirming} className="rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-70">
              {confirming ? 'Confirming...' : 'I Have Made Payment'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
