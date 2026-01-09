import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Clock, MapPin, User } from 'lucide-react';
import { sessions, classes, students, teachers } from '../../data/mockData';

interface StudentScheduleProps {
  studentId: string;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const;
const DAY_LABELS: Record<string, string> = {
  monday: 'Lundi',
  tuesday: 'Mardi',
  wednesday: 'Mercredi',
  thursday: 'Jeudi',
  friday: 'Vendredi',
};

const STATUS_COLORS: Record<string, string> = {
  normal: 'bg-white border-gray-200',
  cancelled: 'bg-red-50 border-red-300',
  postponed: 'bg-green-50 border-green-300',
  makeup: 'bg-purple-50 border-purple-300',
  replaced: 'bg-blue-50 border-blue-300',
};

const STATUS_LABELS: Record<string, string> = {
  normal: 'Normale',
  cancelled: 'Annulée',
  postponed: 'Reportée',
  makeup: 'Rattrapage',
  replaced: 'Remplacée',
};

const STATUS_EMOJI: Record<string, string> = {
  normal: '📚',
  cancelled: '❌',
  postponed: '⏭️',
  makeup: '📝',
  replaced: '🔄',
};

export default function StudentSchedule({ studentId }: StudentScheduleProps) {
  const student = students.find(s => s.id === studentId);
  const studentClass = student ? classes.find(c => c.id === student.classId) : null;
  const classSessions = studentClass ? sessions.filter(s => s.classId === studentClass.id) : [];

  const getSessionsByDay = (day: string) => {
    return classSessions
      .filter(s => s.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const totalSessions = classSessions.length;
  const normalSessions = classSessions.filter(s => s.status === 'normal').length;
  const modifiedSessions = classSessions.filter(s => s.status !== 'normal').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl">Mon Emploi du Temps</h2>
        <p className="text-gray-500">Mes cours de la semaine - {studentClass?.name}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700">Total Cours</p>
                <p className="text-3xl text-blue-600">{totalSessions}</p>
              </div>
              <div className="text-3xl">📚</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">Cours Normaux</p>
                <p className="text-3xl text-green-600">{normalSessions}</p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700">Modifications</p>
                <p className="text-3xl text-orange-600">{modifiedSessions}</p>
              </div>
              <div className="text-3xl">🔄</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Légende des couleurs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-white border-2 border-gray-200 rounded"></div>
              <span className="text-sm">📚 Séance normale</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-50 border-2 border-red-300 rounded"></div>
              <span className="text-sm">❌ Séance annulée</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-50 border-2 border-green-300 rounded"></div>
              <span className="text-sm">⏭️ Séance reportée</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-50 border-2 border-purple-300 rounded"></div>
              <span className="text-sm">📝 Séance de rattrapage</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-50 border-2 border-blue-300 rounded"></div>
              <span className="text-sm">🔄 Professeur remplaçant</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Emploi du temps de la semaine</CardTitle>
          <CardDescription>
            Vue hebdomadaire de tes cours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {DAYS.map(day => {
              const daySessions = getSessionsByDay(day);
              
              return (
                <div key={day} className="space-y-3">
                  <div className="text-center pb-2 border-b border-indigo-200">
                    <h3 className="text-indigo-700">{DAY_LABELS[day]}</h3>
                    <p className="text-xs text-gray-500">{daySessions.length} cours</p>
                  </div>
                  
                  <div className="space-y-2">
                    {daySessions.map((session) => {
                      const teacher = teachers.find(t => t.id === session.teacherId);
                      const replacementTeacher = session.replacementTeacherId 
                        ? teachers.find(t => t.id === session.replacementTeacherId)
                        : null;
                      
                      return (
                        <div
                          key={session.id}
                          className={`p-3 rounded-lg border-2 ${STATUS_COLORS[session.status]} hover:shadow-lg transition-all cursor-pointer`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{STATUS_EMOJI[session.status]}</span>
                              <div className="text-sm text-indigo-700">{session.startTime} - {session.endTime}</div>
                            </div>
                            {session.status !== 'normal' && (
                              <Badge variant="outline" className="text-xs">
                                {STATUS_LABELS[session.status]}
                              </Badge>
                            )}
                          </div>
                          
                          <div>
                            <p>{session.subject}</p>
                            <div className="flex items-center gap-1 text-xs text-gray-600 mt-2">
                              <User className="h-3 w-3" />
                              {replacementTeacher 
                                ? `${replacementTeacher.firstName} ${replacementTeacher.lastName}`
                                : teacher ? `${teacher.firstName} ${teacher.lastName}` : 'N/A'
                              }
                            </div>
                            {replacementTeacher && (
                              <p className="text-xs text-blue-600 mt-1">
                                🔄 Remplacé par {replacementTeacher.firstName}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                            <MapPin className="h-3 w-3" />
                            {session.room}
                          </div>

                          {session.postponedTo && (
                            <div className="mt-2 p-2 bg-green-100 rounded text-xs text-green-700">
                              ⏭️ Reporté au {new Date(session.postponedTo).toLocaleDateString('fr-FR')}
                            </div>
                          )}

                          {session.status === 'cancelled' && (
                            <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-700">
                              ❌ Cours annulé
                            </div>
                          )}
                        </div>
                      );
                    })}
                    
                    {daySessions.length === 0 && (
                      <div className="text-center py-8 text-gray-400 text-sm">
                        😴 Pas de cours
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
