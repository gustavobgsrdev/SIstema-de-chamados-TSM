import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CreateServiceOrder from "./pages/CreateServiceOrder";
import EditServiceOrder from "./pages/EditServiceOrder";
import ViewServiceOrder from "./pages/ViewServiceOrder";
import UserManagement from "./pages/UserManagement";

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
