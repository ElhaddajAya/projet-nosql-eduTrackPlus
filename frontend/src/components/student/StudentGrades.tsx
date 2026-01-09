import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Trophy, TrendingUp, Award, AlertCircle } from 'lucide-react';
import { grades as mockGrades } from '../../data/mockData';
import { calculateGradeAverage, getGradeStatus, getGradesBySubject, getGradesBySemester } from '../../utils/grades';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface StudentGradesProps {
  studentId: string;
}

export default function StudentGrades({ studentId }: StudentGradesProps) {
  const [selectedSemester, setSelectedSemester] = useState<number>(1);

  const studentGrades = mockGrades.filter(g => g.studentId === studentId);
  const semesterGrades = studentGrades.filter(g => g.semester === selectedSemester);
  const gradesBySubject = getGradesBySubject(semesterGrades);
  
  const average = calculateGradeAverage(semesterGrades);
  const status = getGradeStatus(average);

  // Prepare data for charts
  const subjectData = Array.from(gradesBySubject.entries()).map(([subject, grades]) => ({
    subject,
    note: grades[0]?.score || 0,
    moyenne: 10,
  }));

  const radarData = subjectData.map(d => ({
    subject: d.subject.substring(0, 8),
    note: d.note,
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Validé':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'Rattrapage':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'Non validé':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'Validé':
        return '🎉';
      case 'Rattrapage':
        return '⚠️';
      case 'Non validé':
        return '❌';
      default:
        return '📝';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl">Mes Notes</h2>
        <p className="text-gray-500">Consulte tes résultats scolaires</p>
      </div>

      {/* Semester Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <label className="text-sm">Semestre:</label>
            <Select value={String(selectedSemester)} onValueChange={(v) => setSelectedSemester(Number(v))}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Semestre 1</SelectItem>
                <SelectItem value="2">Semestre 2</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className={`${getStatusColor(status)} border-2`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Moyenne Générale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl mb-2">
              {average.toFixed(2)} / 20
            </div>
            <Badge className={getStatusColor(status)}>
              {getStatusEmoji(status)} {status}
            </Badge>
            <Progress value={(average / 20) * 100} className="mt-3" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-blue-700">
              <TrendingUp className="h-4 w-4" />
              Matières Validées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl text-blue-600 mb-2">
              {Array.from(gradesBySubject.values()).filter(grades => grades[0]?.score >= 10).length}
            </div>
            <p className="text-xs text-gray-600">
              sur {gradesBySubject.size} matières
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-purple-700">
              <Award className="h-4 w-4" />
              Meilleure Note
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl text-purple-600 mb-2">
              {Math.max(...semesterGrades.map(g => g.score))} / 20
            </div>
            <p className="text-xs text-gray-600">
              {subjectData.find(s => s.note === Math.max(...semesterGrades.map(g => g.score)))?.subject}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Explanation */}
      {status !== 'Validé' && (
        <Card className={`${getStatusColor(status)} border-2`}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 mt-0.5" />
              <div>
                {status === 'Rattrapage' && (
                  <>
                    <p>
                      <strong>Rattrapage requis</strong> - Ta moyenne est entre 8 et 10.
                    </p>
                    <p className="text-sm mt-1">
                      Tu devras passer des examens de rattrapage pour valider le semestre. Continue tes efforts!
                    </p>
                  </>
                )}
                {status === 'Non validé' && (
                  <>
                    <p>
                      <strong>Attention!</strong> Ta moyenne est inférieure à 8.
                    </p>
                    <p className="text-sm mt-1">
                      Il est important d'améliorer tes résultats. N'hésite pas à demander de l'aide à tes professeurs.
                    </p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Notes par Matière</CardTitle>
            <CardDescription>Comparaison avec la moyenne requise (10/20)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={subjectData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis domain={[0, 20]} />
                <Tooltip />
                <Bar dataKey="note" fill="#3b82f6" name="Ma note" />
                <Bar dataKey="moyenne" fill="#94a3b8" name="Moyenne" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vue Radar</CardTitle>
            <CardDescription>Performance globale par matière</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={90} domain={[0, 20]} />
                <Radar name="Mes notes" dataKey="note" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Grades */}
      <Card>
        <CardHeader>
          <CardTitle>Détail des Notes - Semestre {selectedSemester}</CardTitle>
          <CardDescription>
            Toutes tes notes avec les coefficients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from(gradesBySubject.entries()).map(([subject, grades]) => {
              const grade = grades[0];
              const gradeStatus = getGradeStatus(grade.score);
              
              return (
                <div key={subject} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <h4>{subject}</h4>
                      <p className="text-sm text-gray-500">Coefficient: {grade.coefficient}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl">{grade.score} / 20</div>
                      <Badge className={`${getStatusColor(gradeStatus)} text-xs mt-1`}>
                        {gradeStatus}
                      </Badge>
                    </div>
                  </div>
                  <Progress value={(grade.score / 20) * 100} />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
