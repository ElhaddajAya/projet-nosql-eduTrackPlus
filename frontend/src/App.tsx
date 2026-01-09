import { useState } from "react";
import Login from "./components/Login";
import AdminDashboard from "./components/admin/AdminDashboard";
import TeacherDashboard from "./components/teacher/TeacherDashboard";
import StudentDashboard from "./components/student/StudentDashboard";
import { Toaster } from "./components/ui/sonner";
import { User } from "./types";

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    return (
      <>
        <Login onLogin={handleLogin} />
        <Toaster />
      </>
    );
  }

  return (
    <>
      {user.role === 'admin' && <AdminDashboard user={user} onLogout={handleLogout} />}
      {user.role === 'teacher' && <TeacherDashboard user={user} onLogout={handleLogout} />}
      {user.role === 'student' && <StudentDashboard user={user} onLogout={handleLogout} />}
      <Toaster />
    </>
  );
}
