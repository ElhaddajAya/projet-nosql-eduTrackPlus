import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Users, CheckCircle2, XCircle, Clock, Calendar } from 'lucide-react';
import { sessions, students, classes } from '../../data/mockData';
import { toast } from 'sonner@2.0.3';
import exampleImage from 'figma:asset/da2a8b013ea33882fe4e92b57ed6263b0ad6be29.png';

interface AttendanceMarkingProps {
  teacherId: string;
}

interface StudentAttendance {
  studentId: string;
  present: boolean;
  absent: boolean;
  late: boolean;
}

export default function AttendanceMarking({ teacherId }: AttendanceMarkingProps) {
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [markAllPresent, setMarkAllPresent] = useState(false);
  const [attendance, setAttendance] = useState<Record<string, StudentAttendance>>({});
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedField, setSelectedField] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [studentQuery, setStudentQuery] = useState<string>('');

  // Get teacher's sessions
  const teacherSessions = sessions.filter(s => s.teacherId === teacherId);
  const teacherClassIds = [...new Set(teacherSessions.map(s => s.classId))];
  const teacherClasses = classes.filter(c => teacherClassIds.includes(c.id));
  const levels = Array.from(new Set(teacherClasses.map(c => c.level)));
  const fields = Array.from(new Set(teacherClasses.map(c => c.field)));
  const subjects = Array.from(new Set(teacherSessions.map(s => s.subject)));
  const filteredTeacherClasses = teacherClasses.filter(c =>
    (selectedLevel ? c.level === selectedLevel : true) &&
    (selectedField ? c.field === selectedField : true)
  );
  const filteredTeacherSessions = teacherSessions
    .filter(s => (selectedLevel ? classes.find(c => c.id === s.classId)?.level === selectedLevel : true))
    .filter(s => (selectedField ? classes.find(c => c.id === s.classId)?.field === selectedField : true))
    .filter(s => (selectedClassId ? s.classId === selectedClassId : true))
    .filter(s => (selectedSubject ? s.subject === selectedSubject : true));

  const sessionData = sessions.find(s => s.id === selectedSession);
  const classData = sessionData ? classes.find(c => c.id === sessionData.classId) : null;
  const classStudents = classData ? students.filter(s => s.classId === classData.id) : [];
  const filteredStudents = classStudents.filter(st =>
    `${st.firstName} ${st.lastName}`.toLowerCase().includes(studentQuery.toLowerCase())
  );

  // Initialize attendance when session changes
  const initializeAttendance = (sessionId: string) => {
    setSelectedSession(sessionId);
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      const cls = classes.find(c => c.id === session.classId);
      if (cls) {
        const studentsList = students.filter(s => s.classId === cls.id);
        const initialAttendance: Record<string, StudentAttendance> = {};
        studentsList.forEach((student, index) => {
          // Set some example data
          initialAttendance[student.id] = {
            studentId: student.id,
            present: index === 1 || index === 4 || index === 5 || index === 6 || index === 7,
            absent: index === 0,
            late: index === 2 || index === 3,
          };
        });
        setAttendance(initialAttendance);
      }
    }
  };

  const handleMarkAllPresent = (checked: boolean) => {
    setMarkAllPresent(checked);
    const newAttendance: Record<string, StudentAttendance> = {};
    classStudents.forEach(student => {
      newAttendance[student.id] = {
        studentId: student.id,
        present: checked,
        absent: false,
        late: false,
      };
    });
    setAttendance(newAttendance);
  };

  const handleAttendanceChange = (studentId: string, type: 'present' | 'absent' | 'late') => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: {
        studentId,
        present: type === 'present',
        absent: type === 'absent',
        late: type === 'late',
      },
    }));
  };

  const getStatus = (studentId: string): 'present' | 'absent' | 'late' | null => {
    const record = attendance[studentId];
    if (!record) return null;
    if (record.present) return 'present';
    if (record.absent) return 'absent';
    if (record.late) return 'late';
    return null;
  };

  const handleSaveAttendance = () => {
    const presentCount = Object.values(attendance).filter(a => a.present).length;
    const absentCount = Object.values(attendance).filter(a => a.absent).length;
    
    toast.success('Présences enregistrées', {
      description: `${presentCount} présents, ${absentCount} absents`,
    });
  };

  const presentCount = Object.values(attendance).filter(a => a.present).length;
  const absentCount = Object.values(attendance).filter(a => a.absent).length;
  const lateCount = Object.values(attendance).filter(a => a.late).length;

  return (
    <div className="space-y-6">
      {/* Session Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Marquer les Présences</CardTitle>
          <CardDescription>Sélectionner le cours pour marquer les présences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm">Niveau</label>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger><SelectValue placeholder="Tous" /></SelectTrigger>
                <SelectContent>
                  {levels.map(l => (<SelectItem key={l} value={l}>{l}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm">Filière</label>
              <Select value={selectedField} onValueChange={setSelectedField}>
                <SelectTrigger><SelectValue placeholder="Toutes" /></SelectTrigger>
                <SelectContent>
                  {fields.map(f => (<SelectItem key={f} value={f}>{f}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm">Classe</label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  {filteredTeacherClasses.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm">Matière</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger><SelectValue placeholder="Toutes" /></SelectTrigger>
                <SelectContent>
                  {subjects.map(su => (<SelectItem key={su} value={su}>{su}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm">Cours</label>
              <Select value={selectedSession} onValueChange={initializeAttendance}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un cours" />
                </SelectTrigger>
                <SelectContent>
                  {filteredTeacherSessions.map(session => {
                    const cls = classes.find(c => c.id === session.classId);
                    return (
                      <SelectItem key={session.id} value={session.id}>
                        {session.subject} - {cls?.name} ({session.day} {session.startTime})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm">Date</label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedSession && sessionData && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Ma Classe</p>
                    <p className="text-2xl">{classStudents.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Présents</p>
                    <p className="text-2xl text-green-600">{presentCount}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Absents</p>
                    <p className="text-2xl text-red-600">{absentCount}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">En retard</p>
                    <p className="text-2xl text-orange-600">{lateCount}</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Attendance Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Présences - {sessionData.subject}
                  </CardTitle>
                  <CardDescription>
                    Marquer les présences quotidiennes pour votre classe
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                <Input
                  placeholder="Rechercher un étudiant"
                  className="w-64"
                  value={studentQuery}
                  onChange={(e) => setStudentQuery(e.target.value)}
                />
                <Checkbox
                  id="mark-all"
                  checked={markAllPresent}
                  onCheckedChange={handleMarkAllPresent}
                />
                <label htmlFor="mark-all" className="text-sm cursor-pointer">
                  Marquer tout présent
                </label>
              </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <div className="text-3xl text-green-600">{presentCount}</div>
                  <div className="text-sm text-gray-600">Présent</div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg text-center">
                  <div className="text-3xl text-red-600">{absentCount}</div>
                  <div className="text-sm text-gray-600">Absent</div>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg text-center">
                  <div className="text-3xl text-orange-600">{lateCount}</div>
                  <div className="text-sm text-gray-600">Late</div>
                </div>
              </div>

              {/* Student List */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm">Roll No.</th>
                      <th className="px-4 py-3 text-left text-sm">Nom de l'Étudiant</th>
                      <th className="px-4 py-3 text-center text-sm">Présent</th>
                      <th className="px-4 py-3 text-center text-sm">Absent</th>
                      <th className="px-4 py-3 text-center text-sm">En retard</th>
                      <th className="px-4 py-3 text-center text-sm">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredStudents.map((student, index) => {
                      const status = getStatus(student.id);
                      
                      return (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">{String(index + 1).padStart(3, '0')}</td>
                          <td className="px-4 py-3 text-sm">{student.firstName} {student.lastName}</td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center">
                              <Checkbox
                                checked={attendance[student.id]?.present || false}
                                onCheckedChange={() => handleAttendanceChange(student.id, 'present')}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center">
                              <Checkbox
                                checked={attendance[student.id]?.absent || false}
                                onCheckedChange={() => handleAttendanceChange(student.id, 'absent')}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center">
                              <Checkbox
                                checked={attendance[student.id]?.late || false}
                                onCheckedChange={() => handleAttendanceChange(student.id, 'late')}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {status === 'present' && (
                              <Badge className="bg-green-100 text-green-700 border-green-300 hover:bg-green-100">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Présent
                              </Badge>
                            )}
                            {status === 'absent' && (
                              <Badge className="bg-red-100 text-red-700 border-red-300 hover:bg-red-100">
                                <XCircle className="h-3 w-3 mr-1" />
                                Absent
                              </Badge>
                            )}
                            {status === 'late' && (
                              <Badge className="bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-100">
                                <Clock className="h-3 w-3 mr-1" />
                                En retard
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center mt-6">
                <Button variant="outline">
                  Aperçu
                </Button>
                <Button onClick={handleSaveAttendance} size="lg">
                  Enregistrer les Présences
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!selectedSession && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Veuillez sélectionner un cours pour commencer à marquer les présences
          </CardContent>
        </Card>
      )}
    </div>
  );
}
