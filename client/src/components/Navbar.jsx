import { useAuth } from '../context/AuthContext';

// Navbar shows the current business name and logged-in user's email on protected pages.
export default function Navbar() {
  const { user } = useAuth();
  const businessName = user?.business_name || user?.full_name || 'Online Invoicing System';

  return (
    <header className="fixed left-0 right-0 top-0 z-10 flex h-16 items-center justify-between gap-4 border-b border-gray-200 bg-white px-4 sm:px-6 lg:left-64 lg:px-8">
      <div className="min-w-0">
        <p className="text-sm text-gray-500">Business</p>
        <h1 className="truncate text-base font-semibold text-gray-900 sm:text-lg">{businessName}</h1>
      </div>
      <p className="hidden max-w-[45%] truncate text-sm text-gray-600 sm:block">{user?.email}</p>
    </header>
  );
}
