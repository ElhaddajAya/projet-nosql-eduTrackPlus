import { useState } from 'react';
import { Calendar, CheckSquare, BarChart3, FileText, AlertCircle, LogOut, Bell, GraduationCap } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import AttendanceMarking from './AttendanceMarking';
import TeacherStats from './TeacherStats';
import TeacherSchedule from './TeacherSchedule';
import GradeEntry from './GradeEntry';
import AbsenceDeclaration from './AbsenceDeclaration';
import { User } from '../../types';

interface TeacherDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function TeacherDashboard({ user, onLogout }: TeacherDashboardProps) {
  const [activeTab, setActiveTab] = useState('attendance');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-green-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl">EduManager</h1>
              <p className="text-sm text-gray-500">Espace Professeur</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback className="bg-green-100 text-green-700">
                  {user.firstName[0]}{user.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="text-right">
                <p className="text-sm">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-gray-500">Professeur</p>
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
          <TabsList className="bg-white p-1">
            <TabsTrigger value="attendance" className="gap-2">
              <CheckSquare className="h-4 w-4" />
              Présences
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Statistiques
            </TabsTrigger>
            <TabsTrigger value="schedule" className="gap-2">
              <Calendar className="h-4 w-4" />
              Mon emploi du temps
            </TabsTrigger>
            <TabsTrigger value="grades" className="gap-2">
              <FileText className="h-4 w-4" />
              Notes
            </TabsTrigger>
            <TabsTrigger value="absence" className="gap-2">
              <AlertCircle className="h-4 w-4" />
              Déclarer absence
            </TabsTrigger>
          </TabsList>

          <TabsContent value="attendance">
            <AttendanceMarking teacherId={user.id} />
          </TabsContent>

          <TabsContent value="stats">
            <TeacherStats teacherId={user.id} />
          </TabsContent>

          <TabsContent value="schedule">
            <TeacherSchedule teacherId={user.id} />
          </TabsContent>

          <TabsContent value="grades">
            <GradeEntry teacherId={user.id} />
          </TabsContent>

          <TabsContent value="absence">
            <AbsenceDeclaration teacherId={user.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
