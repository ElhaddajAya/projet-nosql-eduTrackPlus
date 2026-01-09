import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Users, BookOpen, TrendingUp, AlertTriangle } from 'lucide-react';
import { students, classes, attendanceRecords } from '../../data/mockData';
import { calculateAttendanceStats } from '../../utils/attendance';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useState } from 'react';

export default function StatisticsDashboard() {
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedWeek, setSelectedWeek] = useState<string>('current');

  // Calculate global statistics
  const totalStudents = students.length;
  const totalClasses = classes.length;
  const activeClasses = classes.length;

  // Calculate attendance statistics
  const allStudentRecords = students.map(student => {
    const studentRecords = attendanceRecords.filter(r => r.studentId === student.id);
    const stats = calculateAttendanceStats(studentRecords);
    return {
      student,
      stats,
    };
  });

  const globalAttendanceRate = allStudentRecords.reduce((sum, s) => sum + s.stats.attendanceRate, 0) / totalStudents;
  const studentsWithLowAttendance = allStudentRecords.filter(s => s.stats.attendanceRate < 80).length;

  // Class attendance data for chart
  const classAttendanceData = classes.map(cls => {
    const classStudents = students.filter(s => s.classId === cls.id);
    const classRecords = classStudents.map(student => {
      const studentRecords = attendanceRecords.filter(r => r.studentId === student.id);
      return calculateAttendanceStats(studentRecords);
    });
    const avgRate = classRecords.reduce((sum, s) => sum + s.attendanceRate, 0) / classRecords.length;
    
    return {
      name: cls.level,
      taux: Math.round(avgRate),
    };
  });

  // Weekly attendance trend (last 4 weeks)
  const weeklyData = [
    { week: 'Sem 1', taux: 92 },
    { week: 'Sem 2', taux: 89 },
    { week: 'Sem 3', taux: 91 },
    { week: 'Sem 4', taux: Math.round(globalAttendanceRate) },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Total Étudiants</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{totalStudents}</div>
            <p className="text-xs text-gray-500 mt-1">Actifs cette année</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Classes Actives</CardTitle>
            <BookOpen className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{activeClasses}</div>
            <p className="text-xs text-gray-500 mt-1">Sur {totalClasses} au total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Taux de Présence Global</CardTitle>
            <TrendingUp className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{Math.round(globalAttendanceRate)}%</div>
            <p className="text-xs text-green-600 mt-1">+2% vs mois dernier</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Alertes Assiduité</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{studentsWithLowAttendance}</div>
            <p className="text-xs text-gray-500 mt-1">Étudiants &lt; 80%</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger className="w-48 bg-white">
            <SelectValue placeholder="Toutes les classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les classes</SelectItem>
            {classes.map(cls => (
              <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedWeek} onValueChange={setSelectedWeek}>
          <SelectTrigger className="w-48 bg-white">
            <SelectValue placeholder="Cette semaine" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current">Cette semaine</SelectItem>
            <SelectItem value="last">Semaine dernière</SelectItem>
            <SelectItem value="month">Ce mois</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Taux de Présence par Classe</CardTitle>
            <CardDescription>Comparaison des taux de présence</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={classAttendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="taux" fill="#4f46e5" name="Taux %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Évolution Hebdomadaire</CardTitle>
            <CardDescription>Tendance du taux de présence</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="taux" stroke="#4f46e5" strokeWidth={2} name="Taux %" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Students with Low Attendance */}
      <Card>
        <CardHeader>
          <CardTitle>Étudiants avec Faible Assiduité</CardTitle>
          <CardDescription>Taux de présence inférieur à 80%</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {allStudentRecords
              .filter(s => s.stats.attendanceRate < 80)
              .sort((a, b) => a.stats.attendanceRate - b.stats.attendanceRate)
              .map(({ student, stats }) => (
                <div key={student.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                  <div>
                    <p>{student.firstName} {student.lastName}</p>
                    <p className="text-sm text-gray-500">{student.level}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-red-600">{Math.round(stats.attendanceRate)}%</p>
                    <p className="text-xs text-gray-500">{stats.absentDays} absences</p>
                  </div>
                </div>
              ))}
            {allStudentRecords.filter(s => s.stats.attendanceRate < 80).length === 0 && (
              <p className="text-center text-gray-500 py-8">Aucune alerte d'assiduité</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
