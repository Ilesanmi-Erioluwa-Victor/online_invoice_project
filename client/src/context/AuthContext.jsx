import { createContext, useContext, useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

// AuthProvider stores the logged-in user and exposes login/logout helpers to the whole app.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // This useEffect runs once when the app loads to restore the user from the saved JWT.
  useEffect(() => {
    const savedToken = localStorage.getItem('token');

    if (!savedToken) {
      return;
    }

    try {
      const decodedUser = jwtDecode(savedToken);
      setToken(savedToken);
      setUser(decodedUser);
    } catch (error) {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    }
  }, []);

  function login(newToken) {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(jwtDecode(newToken));
  }

  function logout() {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

