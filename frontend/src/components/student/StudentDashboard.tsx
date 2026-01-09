import { useState } from 'react';
import { Calendar, TrendingUp, Award, FileText, LogOut, Bell, GraduationCap } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import AttendanceDashboard from './AttendanceDashboard';
import AttendanceHistory from './AttendanceHistory';
import StudentSchedule from './StudentSchedule';
import StudentGrades from './StudentGrades';
import { User } from '../../types';

interface StudentDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function StudentDashboard({ user, onLogout }: StudentDashboardProps) {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl">EduManager</h1>
              <p className="text-sm text-gray-500">Mon Espace Étudiant</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback className="bg-gradient-to-br from-blue-100 to-indigo-100 text-indigo-700">
                  {user.firstName[0]}{user.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="text-right">
                <p className="text-sm">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-gray-500">Étudiant</p>
              </div>
            </div>
            
            <Button variant="ghost" size="icon" onClick={onLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white p-1 shadow-sm">
            <TabsTrigger value="dashboard" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Tableau de bord
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <Calendar className="h-4 w-4" />
              Historique
            </TabsTrigger>
            <TabsTrigger value="schedule" className="gap-2">
              <Calendar className="h-4 w-4" />
              Emploi du temps
            </TabsTrigger>
            <TabsTrigger value="grades" className="gap-2">
              <FileText className="h-4 w-4" />
              Notes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <AttendanceDashboard studentId={user.id} />
          </TabsContent>

          <TabsContent value="history">
            <AttendanceHistory studentId={user.id} />
          </TabsContent>

          <TabsContent value="schedule">
            <StudentSchedule studentId={user.id} />
          </TabsContent>

          <TabsContent value="grades">
            <StudentGrades studentId={user.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
