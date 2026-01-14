import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { toast } from "sonner";

import Login from "./components/Login";
import AdminDashboard from "./components/admin/AdminDashboard";
import TeacherDashboard from "./components/teacher/TeacherDashboard";
import StudentDashboard from "./components/student/StudentDashboard";

import { Toaster } from "./components/ui/sonner";

export default function App() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    const invalid =
      !storedUser ||
      !storedToken ||
      storedUser === "undefined" ||
      storedToken === "undefined";

    if (invalid) return;

    try {
      setUser(JSON.parse(storedUser));
    } catch (err) {
      console.error("Erreur parsing user depuis localStorage :", err);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
  }, []);

  const handleLogin = (loggedInUser: any) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    toast.success("Déconnexion réussie");
  };

  // ✅ Non connecté -> Login only
  if (!user) {
    return (
      <>
        <Routes>
          <Route
            path='/'
            element={<Login onLogin={handleLogin} />}
          />
          <Route
            path='*'
            element={
              <Navigate
                to='/'
                replace
              />
            }
          />
        </Routes>
        <Toaster />
      </>
    );
  }

  const role = String(user.role || "").toLowerCase();
  const defaultRoute =
    role === "admin" ? "/admin" : role === "teacher" ? "/teacher" : "/student";

  return (
    <>
      <Routes>
        <Route
          path='/admin'
          element={
            role === "admin" ? (
              <AdminDashboard
                user={user}
                onLogout={handleLogout}
              />
            ) : (
              <Navigate
                to={defaultRoute}
                replace
              />
            )
          }
        />
        <Route
          path='/teacher'
          element={
            role === "teacher" ? (
              <TeacherDashboard
                user={user}
                onLogout={handleLogout}
              />
            ) : (
              <Navigate
                to={defaultRoute}
                replace
              />
            )
          }
        />
        <Route
          path='/student'
          element={
            role === "student" ? (
              <StudentDashboard
                user={user}
                onLogout={handleLogout}
              />
            ) : (
              <Navigate
                to={defaultRoute}
                replace
              />
            )
          }
        />

        <Route
          path='/'
          element={
            <Navigate
              to={defaultRoute}
              replace
            />
          }
        />
        <Route
          path='*'
          element={
            <Navigate
              to={defaultRoute}
              replace
            />
          }
        />
      </Routes>

      <Toaster />
    </>
  );
}
