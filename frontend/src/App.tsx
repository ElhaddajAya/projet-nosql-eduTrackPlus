import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { GraduationCap, LogOut } from "lucide-react";

import Login from "./components/Login";
import AdminDashboard from "./components/admin/AdminDashboard";
import TeacherDashboard from "./components/teacher/TeacherDashboard";
import StudentDashboard from "./components/student/StudentDashboard";

import { Toaster } from "./components/ui/sonner";
import { Button } from "./components/ui/button";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    // ✅ Protection contre les valeurs invalides ("undefined")
    const invalid =
      !storedUser ||
      !storedToken ||
      storedUser === "undefined" ||
      storedToken === "undefined";

    if (invalid) return;

    try {
      const parsedUser = JSON.parse(storedUser);
      console.log("Utilisateur chargé depuis localStorage :", parsedUser);
      setUser(parsedUser);
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
    navigate("/");
    toast.success("Déconnexion réussie");
  };

  // ✅ Si pas connecté -> page login uniquement
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

  // ✅ Nom affiché (backend: firstName/lastName) + fallback (prenom/nom)
  const firstName = user.firstName || user.prenom || "";
  const lastName = user.lastName || user.nom || "";
  const displayName =
    `${firstName} ${lastName}`.trim() || user.email || "Utilisateur";

  return (
    <div className='min-h-screen bg-background'>
      {/* Barre de navigation simple avec logout */}
      <header className='border-b bg-white sticky top-0 z-10'>
        <div className='container mx-auto px-4 py-3 flex justify-between items-center'>
          <div className='flex items-center gap-2'>
            <GraduationCap className='h-6 w-6 text-primary' />
            <span className='font-semibold'>EduTrackPlus</span>
          </div>

          <div className='flex items-center gap-4'>
            <span className='text-sm text-muted-foreground'>
              {displayName} • {user.role}
            </span>

            <Button
              variant='outline'
              size='sm'
              onClick={handleLogout}
            >
              <LogOut className='h-4 w-4 mr-2' />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <main className='container mx-auto p-4'>
        <Routes>
          <Route
            path='/admin'
            element={
              String(user.role).toLowerCase() === "admin" ? (
                <AdminDashboard
                  user={user}
                  onLogout={handleLogout}
                />
              ) : (
                <Navigate
                  to='/'
                  replace
                />
              )
            }
          />

          <Route
            path='/teacher'
            element={
              String(user.role).toLowerCase() === "teacher" ? (
                <TeacherDashboard
                  user={user}
                  onLogout={handleLogout}
                />
              ) : (
                <Navigate
                  to='/'
                  replace
                />
              )
            }
          />

          <Route
            path='/student'
            element={
              String(user.role).toLowerCase() === "student" ? (
                <StudentDashboard
                  user={user}
                  onLogout={handleLogout}
                />
              ) : (
                <Navigate
                  to='/'
                  replace
                />
              )
            }
          />

          {/* Redirection automatique vers le dashboard du rôle */}
          <Route
            path='/'
            element={
              <Navigate
                to={`/${String(user.role).toLowerCase()}`}
                replace
              />
            }
          />
          <Route
            path='*'
            element={
              <Navigate
                to={`/${String(user.role).toLowerCase()}`}
                replace
              />
            }
          />
        </Routes>
      </main>

      <Toaster />
    </div>
  );
}
