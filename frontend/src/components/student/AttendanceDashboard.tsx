import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { TrendingUp, Calendar, Award, Flame, AlertCircle, CheckCircle2 } from 'lucide-react';
import { attendanceRecords, students } from '../../data/mockData';
import { calculateAttendanceStats, getAttendanceRateWithBonus } from '../../utils/attendance';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AttendanceDashboardProps {
  studentId: string;
}

export default function AttendanceDashboard({ studentId }: AttendanceDashboardProps) {
  const student = students.find(s => s.id === studentId);
  const studentRecords = attendanceRecords.filter(r => r.studentId === studentId);
  const stats = calculateAttendanceStats(studentRecords);
  const rateWithBonus = getAttendanceRateWithBonus(stats.attendanceRate, stats.streak);
  const streakBonus = rateWithBonus - stats.attendanceRate;

  // Weekly attendance data (last 4 weeks)
  const weeklyData = [
    { week: 'Sem 1', taux: 95 },
    { week: 'Sem 2', taux: 92 },
    { week: 'Sem 3', taux: 94 },
    { week: 'Sem 4', taux: Math.round(stats.attendanceRate) },
  ];

  // Status distribution
  const pieData = [
    { name: 'Présent', value: stats.presentDays, color: '#10b981' },
    { name: 'Absent', value: stats.absentDays, color: '#ef4444' },
    { name: 'En retard', value: stats.lateDays, color: '#f59e0b' },
  ];

  // Subject-wise attendance (mock data)
  const subjectData = [
    { subject: 'Math', taux: 96 },
    { subject: 'Physique', taux: 94 },
    { subject: 'Français', taux: 90 },
    { subject: 'Anglais', taux: 98 },
    { subject: 'Histoire', taux: 88 },
  ];

  const nextStreakMilestone = Math.ceil(stats.streak / 5) * 5;
  const progressToNextMilestone = ((stats.streak % 5) / 5) * 100;

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg p-6">
        <h2 className="text-2xl mb-2">Bonjour, {student?.firstName}! 👋</h2>
        <p className="opacity-90">
          Continue comme ça! Ton taux de présence est excellent.
        </p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-green-700">Taux de Présence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-green-600 mb-2">
              {Math.round(rateWithBonus)}%
            </div>
            {streakBonus > 0 && (
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                +{streakBonus.toFixed(1)}% bonus 🎉
              </Badge>
            )}
            <Progress value={rateWithBonus} className="mt-3" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-blue-700">Jours Présents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-blue-600 mb-2">
              {stats.presentDays}
            </div>
            <p className="text-xs text-gray-600">
              sur {stats.totalDays} jours
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-orange-700 flex items-center gap-2">
              <Flame className="h-4 w-4" />
              Série Actuelle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-orange-600 mb-2">
              {stats.streak} jours
            </div>
            <p className="text-xs text-gray-600">
              {5 - (stats.streak % 5)} jours pour +1%
            </p>
            <Progress value={progressToNextMilestone} className="mt-3" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-purple-700 flex items-center gap-2">
              <Award className="h-4 w-4" />
              Récompenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-purple-600 mb-2">
              {Math.floor(stats.streak / 5)}
            </div>
            <p className="text-xs text-gray-600">
              bonus gagnés
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Streak Explanation */}
      <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-700">
            <Flame className="h-5 w-5" />
            Système de Séries (Streak)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-700">
            Pour chaque <strong>5 jours consécutifs</strong> de présence, tu gagnes <strong>+1%</strong> à ton taux de présence! 🎯
          </p>
          <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-orange-200">
            <div className="flex-1">
              <p className="text-sm mb-2">Progrès vers le prochain bonus:</p>
              <Progress value={progressToNextMilestone} className="h-3" />
            </div>
            <div className="text-center">
              <div className="text-2xl text-orange-600">{stats.streak % 5}/5</div>
              <p className="text-xs text-gray-500">jours</p>
            </div>
          </div>
          {stats.streak >= 5 && (
            <div className="bg-green-100 text-green-800 p-3 rounded-lg flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 mt-0.5" />
              <p className="text-sm">
                Excellent! Tu as gagné {Math.floor(stats.streak / 5)} bonus. Continue sur cette lancée!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Évolution Hebdomadaire</CardTitle>
            <CardDescription>Ton taux de présence ces 4 dernières semaines</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="taux" fill="#3b82f6" name="Taux %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Répartition des Présences</CardTitle>
            <CardDescription>Distribution de ton assiduité</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Subject Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Présence par Matière</CardTitle>
          <CardDescription>Ton assiduité dans chaque cours</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {subjectData.map((subject) => (
              <div key={subject.subject} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{subject.subject}</span>
                  <span className="text-sm">{subject.taux}%</span>
                </div>
                <Progress value={subject.taux} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alert if needed */}
      {stats.attendanceRate < 80 && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="text-red-800">
                  <strong>Attention!</strong> Ton taux de présence est inférieur à 80%.
                </p>
                <p className="text-sm text-red-700 mt-1">
                  Essaie d'être plus assidu pour améliorer tes résultats et gagner des bonus!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
