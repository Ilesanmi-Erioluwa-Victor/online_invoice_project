import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

// Register handles new account creation and stores the returned JWT on success.
export default function Register() {
  const [form, setForm] = useState({
    full_name: '',
    business_name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/api/auth/register', form);
      login(response.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-100 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
        <p className="mt-2 text-sm text-gray-600">Register your business or freelance profile.</p>
        {error && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Full Name</label>
            <input name="full_name" value={form.full_name} onChange={updateField} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-600" required />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Business Name</label>
            <input name="business_name" value={form.business_name} onChange={updateField} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-600" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input name="email" type="email" value={form.email} onChange={updateField} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-600" required />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Password</label>
            <input name="password" type="password" value={form.password} onChange={updateField} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-600" required />
          </div>
          <button type="submit" disabled={loading} className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-70">
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600">
          Already registered? <Link to="/login" className="font-medium text-indigo-600">Login</Link>
        </p>
      </div>
    </div>
  );
}

