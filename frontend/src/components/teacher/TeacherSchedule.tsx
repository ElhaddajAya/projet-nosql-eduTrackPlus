import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Clock, MapPin, Users, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { sessions, classes, teachers } from '../../data/mockData';

interface TeacherScheduleProps {
  teacherId: string;
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

export default function TeacherSchedule({ teacherId }: TeacherScheduleProps) {
  const teacherSessions = sessions.filter(s => 
    s.teacherId === teacherId || s.replacementTeacherId === teacherId
  );

  const [weekDate, setWeekDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const changeWeek = (offset: number) => {
    const d = new Date(weekDate);
    d.setDate(d.getDate() + offset * 7);
    setWeekDate(d.toISOString().split('T')[0]);
  };

  const getSessionsByDay = (day: string) => {
    return teacherSessions
      .filter(s => s.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const totalSessions = teacherSessions.length;
  const uniqueClasses = [...new Set(teacherSessions.map(s => s.classId))].length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl">Mon Emploi du Temps</h2>
        <p className="text-gray-500">Mes cours de la semaine</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Cours</p>
                <p className="text-2xl">{totalSessions}</p>
              </div>
              <Clock className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Classes Enseignées</p>
                <p className="text-2xl">{uniqueClasses}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Heures / Semaine</p>
                <p className="text-2xl">{totalSessions * 2}h</p>
              </div>
              <Clock className="h-8 w-8 text-indigo-600" />
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
              <span className="text-sm">Séance normale</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-50 border-2 border-red-300 rounded"></div>
              <span className="text-sm">Séance annulée</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-50 border-2 border-green-300 rounded"></div>
              <span className="text-sm">Séance reportée</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-50 border-2 border-purple-300 rounded"></div>
              <span className="text-sm">Séance de rattrapage</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-50 border-2 border-blue-300 rounded"></div>
              <span className="text-sm">Professeur remplaçant</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Schedule */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Mes cours de la semaine</CardTitle>
            <div className="flex items-center gap-2">
              <button className="border rounded p-2" onClick={() => changeWeek(-1)}><ChevronLeft className="h-4 w-4" /></button>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-500" />
                <input type="date" value={weekDate} onChange={(e) => setWeekDate(e.target.value)} className="border rounded px-2 py-1" />
              </div>
              <button className="border rounded p-2" onClick={() => changeWeek(1)}><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {DAYS.map(day => {
              const daySessions = getSessionsByDay(day);
              
              return (
                <div key={day} className="space-y-3">
                  <div className="text-center pb-2 border-b">
                    <h3>{DAY_LABELS[day]}</h3>
                    <p className="text-xs text-gray-500">{daySessions.length} cours</p>
                  </div>
                  
                  <div className="space-y-2">
                    {daySessions.map((session) => {
                      const classData = classes.find(c => c.id === session.classId);
                      const isReplacement = session.replacementTeacherId === teacherId;
                      
                      return (
                        <div
                          key={session.id}
                          className={`p-3 rounded-lg border-2 ${STATUS_COLORS[session.status]} hover:shadow-md transition-shadow`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="text-sm text-green-700">{session.startTime} - {session.endTime}</div>
                            {session.status !== 'normal' && (
                              <Badge variant="outline" className="text-xs">
                                {STATUS_LABELS[session.status]}
                              </Badge>
                            )}
                          </div>
                          
                          <div>
                            <p>{session.subject}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              {classData?.name || 'N/A'}
                            </p>
                            {isReplacement && (
                              <Badge variant="secondary" className="text-xs mt-2">
                                Remplacement
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                            <MapPin className="h-3 w-3" />
                            {session.room}
                          </div>

                          {session.postponedTo && (
                            <p className="text-xs text-green-600 mt-2">
                              Reportée au {new Date(session.postponedTo).toLocaleDateString('fr-FR')}
                            </p>
                          )}

                          {session.originalSessionId && (
                            <p className="text-xs text-purple-600 mt-2">
                              Cours du {new Date('2024-10-01').toLocaleDateString('fr-FR')}
                            </p>
                          )}
                        </div>
                      );
                    })}
                    
                    {daySessions.length === 0 && (
                      <div className="text-center py-8 text-gray-400 text-sm">
                        Pas de cours
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
