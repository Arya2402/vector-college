import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Safely parse the env variable to get the base domain (stripping any trailing /api or /)
let BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
if (BASE.endsWith('/api')) BASE = BASE.slice(0, -4);
if (BASE.endsWith('/')) BASE = BASE.slice(0, -1);

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // CMS admin auth
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Academic auth (admin + student)
  const [academicUser, setAcademicUser] = useState(null);
  const [academicLoading, setAcademicLoading] = useState(true);

  // Verify CMS admin token on mount
  useEffect(() => {
    const token = localStorage.getItem('vectorAdminToken');
    if (token) {
      axios.get(`${BASE}/api/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          if (res.data.valid && res.data.role === 'admin') {
            setIsAdmin(true);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          } else {
            logoutCms();
          }
        })
        .catch(() => logoutCms())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Verify academic token on mount
  useEffect(() => {
    const token = localStorage.getItem('vectorAcademicToken');
    if (token) {
      axios.get(`${BASE}/api/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          if (res.data.valid) {
            setAcademicUser({
              userId: res.data.userId,
              role: res.data.role,
              token,
            });
          } else {
            logoutAcademic();
          }
        })
        .catch(() => logoutAcademic())
        .finally(() => setAcademicLoading(false));
    } else {
      setAcademicLoading(false);
    }
  }, []);

  // CMS admin login
  const login = async (username, password) => {
    try {
      const res = await axios.post(`${BASE}/api/auth/login`, { userId: parseInt(username) || username, password });
      if (res.data.success && res.data.role === 'admin') {
        localStorage.setItem('vectorAdminToken', res.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        setIsAdmin(true);
        return { success: true };
      }
      return { success: false, message: res.data.message || 'Not an admin account' };
    } catch (err) {
      const msg = err.response?.data?.message || 'Connection failed. Is the backend running?';
      return { success: false, message: msg };
    }
  };

  // Academic login (admin + student only)
  const academicLogin = async (userId, password) => {
    try {
      const res = await axios.post(`${BASE}/api/auth/login`, { userId: parseInt(userId), password });
      if (res.data.success) {
        localStorage.setItem('vectorAcademicToken', res.data.token);
        const user = {
          userId: res.data.userId,
          role: res.data.role,
          token: res.data.token,
        };
        setAcademicUser(user);

        // If admin, also set CMS token
        if (res.data.role === 'admin') {
          localStorage.setItem('vectorAdminToken', res.data.token);
          axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
          setIsAdmin(true);
        }

        return { success: true, role: res.data.role };
      }
      return { success: false, message: res.data.message };
    } catch (err) {
      const msg = err.response?.data?.message || 'Connection failed. Is the backend running?';
      return { success: false, message: msg };
    }
  };

  const logoutCms = () => {
    localStorage.removeItem('vectorAdminToken');
    delete axios.defaults.headers.common['Authorization'];
    setIsAdmin(false);
  };

  const logoutAcademic = () => {
    localStorage.removeItem('vectorAcademicToken');
    setAcademicUser(null);
  };

  const logout = () => {
    logoutCms();
    logoutAcademic();
  };

  return (
    <AuthContext.Provider value={{
      isAdmin, login, logout, loading,
      academicUser, academicLogin, logoutAcademic, academicLoading,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
