import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Users, AlertTriangle } from 'lucide-react';
import { sessions, students, classes, attendanceRecords } from '../../data/mockData';
import { calculateAttendanceStats } from '../../utils/attendance';
import { useState } from 'react';

interface TeacherStatsProps {
  teacherId: string;
}

export default function TeacherStats({ teacherId }: TeacherStatsProps) {
  const [selectedClass, setSelectedClass] = useState<string>('all');

  // Get teacher's classes
  const teacherSessions = sessions.filter(s => s.teacherId === teacherId);
  const teacherClassIds = [...new Set(teacherSessions.map(s => s.classId))];
  const teacherClasses = classes.filter(c => teacherClassIds.includes(c.id));

  // Get students from teacher's classes
  const teacherStudents = students.filter(s => teacherClassIds.includes(s.classId));
  
  // Filter by selected class
  const filteredStudents = selectedClass === 'all' 
    ? teacherStudents 
    : students.filter(s => s.classId === selectedClass);

  // Calculate stats
  const allStudentStats = filteredStudents.map(student => {
    const studentRecords = attendanceRecords.filter(r => r.studentId === student.id);
    const stats = calculateAttendanceStats(studentRecords);
    return { student, stats };
  });

  const avgAttendanceRate = allStudentStats.length > 0
    ? allStudentStats.reduce((sum, s) => sum + s.stats.attendanceRate, 0) / allStudentStats.length
    : 0;

  const studentsWithLowAttendance = allStudentStats.filter(s => s.stats.attendanceRate < 80).length;

  // Class comparison data
  const classComparisonData = teacherClasses.map(cls => {
    const classStudents = students.filter(s => s.classId === cls.id);
    const classStats = classStudents.map(student => {
      const studentRecords = attendanceRecords.filter(r => r.studentId === student.id);
      return calculateAttendanceStats(studentRecords);
    });
    const avgRate = classStats.reduce((sum, s) => sum + s.attendanceRate, 0) / classStats.length;
    
    return {
      name: cls.level,
      taux: Math.round(avgRate),
    };
  });

  // Weekly trend
  const weeklyData = [
    { week: 'Sem 1', taux: 91 },
    { week: 'Sem 2', taux: 88 },
    { week: 'Sem 3', taux: 90 },
    { week: 'Sem 4', taux: Math.round(avgAttendanceRate) },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl">Statistiques de mes Classes</h2>
        <p className="text-gray-500">Vue d'ensemble des présences de vos étudiants</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Mes Classes</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{teacherClasses.length}</div>
            <p className="text-xs text-gray-500 mt-1">{teacherStudents.length} étudiants au total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Taux de Présence Moyen</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{Math.round(avgAttendanceRate)}%</div>
            <p className="text-xs text-green-600 mt-1">+3% vs semaine dernière</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Étudiants à Risque</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{studentsWithLowAttendance}</div>
            <p className="text-xs text-gray-500 mt-1">Taux &lt; 80%</p>
          </CardContent>
        </Card>
      </div>

      {/* Class Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <label className="text-sm">Filtrer par classe:</label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes mes classes</SelectItem>
                {teacherClasses.map(cls => (
                  <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Comparaison par Classe</CardTitle>
            <CardDescription>Taux de présence de vos classes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={classComparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="taux" fill="#10b981" name="Taux %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tendance Hebdomadaire</CardTitle>
            <CardDescription>Évolution du taux de présence</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="taux" stroke="#10b981" strokeWidth={2} name="Taux %" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Students List */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Étudiants</CardTitle>
          <CardDescription>Détail des présences par étudiant</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {allStudentStats
              .sort((a, b) => a.stats.attendanceRate - b.stats.attendanceRate)
              .map(({ student, stats }) => (
                <div 
                  key={student.id} 
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    stats.attendanceRate < 80 ? 'bg-red-50 border-red-200' : 'bg-white'
                  }`}
                >
                  <div>
                    <p>{student.firstName} {student.lastName}</p>
                    <p className="text-sm text-gray-500">{student.level}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg ${stats.attendanceRate < 80 ? 'text-red-600' : 'text-green-600'}`}>
                      {Math.round(stats.attendanceRate)}%
                    </p>
                    <p className="text-xs text-gray-500">
                      {stats.presentDays}/{stats.totalDays} présent
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
