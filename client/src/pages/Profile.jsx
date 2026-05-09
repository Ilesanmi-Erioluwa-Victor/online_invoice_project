import { useEffect, useState } from 'react';
import api from '../api/axios';

const emptyProfile = {
  full_name: '',
  business_name: '',
  bank_name: '',
  account_number: '',
  account_name: '',
};

// Profile displays and updates the logged-in user's business and bank details for invoices and receipts.
export default function Profile() {
  const [profile, setProfile] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // This useEffect runs when the profile page opens to fetch current user and bank information.
  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await api.get('/api/profile');
        setProfile({
          full_name: response.data.full_name || '',
          business_name: response.data.business_name || '',
          bank_name: response.data.bank_name || '',
          account_number: response.data.account_number || '',
          account_name: response.data.account_name || '',
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load profile');
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  // updateField receives an input change event and stores the edited profile field.
  function updateField(event) {
    setProfile({ ...profile, [event.target.name]: event.target.value });
  }

  // handleSubmit receives the form submit event, saves profile data, and shows a success or error message.
  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const response = await api.put('/api/profile', profile);
      setProfile({
        full_name: response.data.full_name || '',
        business_name: response.data.business_name || '',
        bank_name: response.data.bank_name || '',
        account_number: response.data.account_number || '',
        account_name: response.data.account_name || '',
      });
      setMessage('Profile saved successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save profile');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">Loading profile...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-sm text-gray-600">Manage your business name and payment details.</p>
      </div>
      {message && <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{message}</div>}
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-gray-700">Full Name</label>
            <input name="full_name" value={profile.full_name} onChange={updateField} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-600" required />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Business Name</label>
            <input name="business_name" value={profile.business_name} onChange={updateField} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-600" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Bank Name</label>
            <input name="bank_name" value={profile.bank_name} onChange={updateField} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-600" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Account Number</label>
            <input name="account_number" value={profile.account_number} onChange={updateField} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-600" />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700">Account Name</label>
            <input name="account_name" value={profile.account_name} onChange={updateField} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-600" />
          </div>
        </div>
        <button type="submit" disabled={saving} className="mt-6 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-70">
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </form>
  );
}
