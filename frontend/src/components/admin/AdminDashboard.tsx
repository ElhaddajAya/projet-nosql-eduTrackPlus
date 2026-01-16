import { useState, useEffect } from "react";
import {
  Users,
  BookOpen,
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  GraduationCap,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import UserManagement from "./UserManagement";
import ClassManagement from "./ClassManagement";
import ScheduleManagement from "./ScheduleManagement";
import StatisticsDashboard from "./StatisticsDashboard";
import AlertConfiguration from "./AlertConfiguration";
import ReplacementNotifications from "./ReplacementNotifications";
import { User } from "../../types";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function AdminDashboard({
  user,
  onLogout,
}: AdminDashboardProps) {
  const token = localStorage.getItem("token");
  const [activeTab, setActiveTab] = useState("dashboard");

  // ⭐ NOUVEAU : Notifications
  const [notifDialogOpen, setNotifDialogOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // ⭐ Charger nombre de demandes en attente
  useEffect(() => {
    const loadPendingCount = async () => {
      try {
        const res = await axios.get(`${API_URL}/remplacements/en-attente`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data?.success) {
          const aujourdhui = new Date().toISOString().split("T")[0];
          const aujourdhuiDemandes = (res.data.data || []).filter((d: any) => {
            const dateSeance = d.date_seance.split("T")[0];
            return dateSeance === aujourdhui;
          });
          setPendingCount(aujourdhuiDemandes.length);
        }
      } catch (error) {
        console.error("Erreur chargement notifications:", error);
      }
    };

    loadPendingCount();

    // Refresh toutes les 30 secondes
    const interval = setInterval(loadPendingCount, 30000);
    return () => clearInterval(interval);
  }, [token]);

  // ⭐ Handler pour redirection vers emploi du temps
  const handleViewSchedule = (seanceId: number) => {
    setNotifDialogOpen(false);
    setActiveTab("schedules");
    // TODO: Scroll vers la séance concernée si besoin
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <header className='bg-white border-b border-gray-200'>
        <div className='flex items-center justify-between px-6 py-4'>
          <div className='flex items-center gap-3'>
            <div className='h-10 w-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center'>
              <GraduationCap className='h-6 w-6 text-white' />
            </div>
            <div>
              <h1 className='text-xl'>EduTrackPlus</h1>
              <p className='text-sm text-gray-500'>Administration</p>
            </div>
          </div>

          <div className='flex items-center gap-4'>
            {/* ⭐ BADGE NOTIFICATION */}
            <Button
              variant='ghost'
              size='icon'
              className='relative'
              onClick={() => setNotifDialogOpen(true)}
            >
              <Bell className='h-5 w-5' />
              {pendingCount > 0 && (
                <span className='absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold'>
                  {pendingCount}
                </span>
              )}
            </Button>

            <div className='flex items-center gap-3'>
              <Avatar>
                <AvatarFallback className='bg-green-100 text-green-700'>
                  {user.firstName[0]}
                  {user.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className='text-right'>
                <p className='text-sm'>
                  {user.firstName} {user.lastName}
                </p>
                <p className='text-xs text-gray-500'>Administrateur</p>
              </div>
            </div>

            <Button
              variant='ghost'
              size='icon'
              onClick={onLogout}
            >
              <LogOut className='h-5 w-5' />
            </Button>
          </div>
        </div>
      </header>

      {/* ⭐ DIALOG NOTIFICATIONS */}
      <Dialog
        open={notifDialogOpen}
        onOpenChange={setNotifDialogOpen}
      >
        <DialogContent className='max-w-3xl max-h-[80vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Demandes de Remplacement</DialogTitle>
          </DialogHeader>
          <ReplacementNotifications
            onClose={() => setNotifDialogOpen(false)}
            onViewSchedule={handleViewSchedule}
          />
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <div className='p-6'>
        {/* ⭐ ALERTE SI DEMANDES EN ATTENTE */}
        {pendingCount > 0 && (
          <div className='mb-6 bg-orange-100 border-2 border-orange-300 rounded-lg p-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <Bell className='h-6 w-6 text-orange-600' />
                <div>
                  <p className='font-semibold text-orange-900'>
                    {pendingCount} demande(s) de remplacement aujourd'hui
                  </p>
                  <p className='text-sm text-orange-700'>
                    Des enseignants ont déclaré leur absence. Cliquez pour
                    assigner des remplaçants.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setNotifDialogOpen(true)}
                className='bg-orange-600 hover:bg-orange-700'
              >
                Voir les demandes
              </Button>
            </div>
          </div>
        )}

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className='space-y-6'
        >
          <TabsList className='bg-white p-1'>
            <TabsTrigger
              value='dashboard'
              className='gap-2'
            >
              <BarChart3 className='h-4 w-4' />
              Dashboard
            </TabsTrigger>
            <TabsTrigger
              value='users'
              className='gap-2'
            >
              <Users className='h-4 w-4' />
              Utilisateurs
            </TabsTrigger>
            <TabsTrigger
              value='classes'
              className='gap-2'
            >
              <BookOpen className='h-4 w-4' />
              Classes
            </TabsTrigger>
            <TabsTrigger
              value='schedules'
              className='gap-2 relative'
            >
              <Calendar className='h-4 w-4' />
              Emplois du temps
              {pendingCount > 0 && (
                <span className='absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center'>
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value='alerts'
              className='gap-2'
            >
              <Settings className='h-4 w-4' />
              Configuration
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value='dashboard'
            className='space-y-6'
          >
            <StatisticsDashboard />
          </TabsContent>

          <TabsContent value='users'>
            <UserManagement />
          </TabsContent>

          <TabsContent value='classes'>
            <ClassManagement />
          </TabsContent>

          <TabsContent value='schedules'>
            <ScheduleManagement />
          </TabsContent>

          <TabsContent value='alerts'>
            <AlertConfiguration />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
