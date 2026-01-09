import { useState } from 'react';
import { Users, BookOpen, Calendar, BarChart3, Settings, LogOut, Bell, GraduationCap } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import UserManagement from './UserManagement';
import ClassManagement from './ClassManagement';
import ScheduleManagement from './ScheduleManagement';
import StatisticsDashboard from './StatisticsDashboard';
import AlertConfiguration from './AlertConfiguration';
import { User } from '../../types';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-black rounded-lg flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl">EduManager</h1>
              <p className="text-sm text-gray-500">Tableau de bord Admin</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </Button>
            
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback className="bg-green-100 text-green-700">
                  {user.firstName[0]}{user.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="text-right">
                <p className="text-sm">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-gray-500">Administrateur</p>
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
            <TabsTrigger value="dashboard" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="classes" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Classes
            </TabsTrigger>
            <TabsTrigger value="schedules" className="gap-2">
              <Calendar className="h-4 w-4" />
              Emplois du temps
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-2">
              <Settings className="h-4 w-4" />
              Configuration
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <StatisticsDashboard />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="classes">
            <ClassManagement />
          </TabsContent>

          <TabsContent value="schedules">
            <ScheduleManagement />
          </TabsContent>

          <TabsContent value="alerts">
            <AlertConfiguration />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
