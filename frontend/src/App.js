import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CreateServiceOrder from "./pages/CreateServiceOrder";
import EditServiceOrder from "./pages/EditServiceOrder";
import ViewServiceOrder from "./pages/ViewServiceOrder";
import UserManagement from "./pages/UserManagement";

// Suppress ResizeObserver errors (safe to ignore - caused by Radix UI)
window.addEventListener('error', e => {
  if (e.message === 'ResizeObserver loop completed with undelivered notifications.' ||
      e.message === 'ResizeObserver loop limit exceeded') {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
});

// Also suppress in console
const resizeObserverLoopErrRe = /^[^(ResizeObserver loop limit exceeded)]/;
const resizeObserverLoopErrRe2 = /^[^(ResizeObserver loop completed)]/;
window.addEventListener('error', (e) => {
  if (resizeObserverLoopErrRe.test(e.message) || resizeObserverLoopErrRe2.test(e.message)) {
    e.stopImmediatePropagation();
  }
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" />
              ) : (
                <Login setIsAuthenticated={setIsAuthenticated} />
              )
            }
          />
          <Route
            path="/dashboard"
            element={
              isAuthenticated ? (
                <Dashboard />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/create"
            element={
              isAuthenticated ? (
                <CreateServiceOrder />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/edit/:id"
            element={
              isAuthenticated ? (
                <EditServiceOrder />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/view/:id"
            element={
              isAuthenticated ? (
                <ViewServiceOrder />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/users"
            element={
              isAuthenticated ? (
                <UserManagement />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
