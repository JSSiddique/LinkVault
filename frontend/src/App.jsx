import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import Upload from "./Upload";
import View from "./View";
import AuthPage from "./AuthPage";
import {
  API_BASE,
  clearAuthToken,
  getAuthToken,
  setAuthToken,
} from "./auth";

function App() {
  const [token, setToken] = useState(getAuthToken());
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (!token) {
        setUser(null);
        setCheckingAuth(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          clearAuthToken();
          setToken("");
          setUser(null);
          return;
        }

        const data = await res.json();
        setUser(data.user);
      } catch {
        clearAuthToken();
        setToken("");
        setUser(null);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, [token]);

  const handleAuthenticated = (newToken, newUser) => {
    setAuthToken(newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    clearAuthToken();
    setToken("");
    setUser(null);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center text-slate-600">
        Loading...
      </div>
    );
  }

  return (
    <Routes>
      {/* Upload page */}
      <Route
        path="/"
        element={
          user ? (
            <Upload authToken={token} user={user} onLogout={logout} />
          ) : (
            <AuthPage onAuthenticated={handleAuthenticated} />
          )
        }
      />

      {/* View shared content (text or file) */}
      <Route path="/view/:shareId" element={<View />} />
    </Routes>
  );
}

export default App;
