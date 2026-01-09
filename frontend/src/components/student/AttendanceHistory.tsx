import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Calendar, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { attendanceRecords, sessions } from '../../data/mockData';

interface AttendanceHistoryProps {
  studentId: string;
}

export default function AttendanceHistory({ studentId }: AttendanceHistoryProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>('11');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  const studentRecords = attendanceRecords.filter(r => r.studentId === studentId);
  
  // Filter by month and subject
  const filteredRecords = studentRecords.filter(record => {
    const recordDate = new Date(record.date);
    const monthMatch = recordDate.getMonth() === parseInt(selectedMonth);
    
    if (selectedSubject === 'all') {
      return monthMatch;
    }
    
    const session = sessions.find(s => s.id === record.sessionId);
    return monthMatch && session?.subject === selectedSubject;
  });

  // Group by date
  const recordsByDate = filteredRecords.reduce((acc, record) => {
    if (!acc[record.date]) {
      acc[record.date] = [];
    }
    acc[record.date].push(record);
    return acc;
  }, {} as Record<string, typeof filteredRecords>);

  const sortedDates = Object.keys(recordsByDate).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  // Get unique subjects
  const subjects = [...new Set(sessions.map(s => s.subject))];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'absent':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'late':
        return <Clock className="h-5 w-5 text-orange-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return (
          <Badge className="bg-green-100 text-green-700 border-green-300 hover:bg-green-100">
            Présent
          </Badge>
        );
      case 'absent':
        return (
          <Badge className="bg-red-100 text-red-700 border-red-300 hover:bg-red-100">
            Absent
          </Badge>
        );
      case 'late':
        return (
          <Badge className="bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-100">
            En retard
          </Badge>
        );
      default:
        return null;
    }
  };

  const stats = {
    present: filteredRecords.filter(r => r.status === 'present').length,
    absent: filteredRecords.filter(r => r.status === 'absent').length,
    late: filteredRecords.filter(r => r.status === 'late').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl">Historique des Présences</h2>
        <p className="text-gray-500">Consulte ton historique jour par jour</p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">Jours Présents</p>
                <p className="text-3xl text-green-600">{stats.present}</p>
              </div>
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700">Jours Absents</p>
                <p className="text-3xl text-red-600">{stats.absent}</p>
              </div>
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700">Retards</p>
                <p className="text-3xl text-orange-600">{stats.late}</p>
              </div>
              <Clock className="h-10 w-10 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="space-y-2 flex-1">
              <label className="text-sm">Mois</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="9">Septembre 2024</SelectItem>
                  <SelectItem value="10">Octobre 2024</SelectItem>
                  <SelectItem value="11">Novembre 2024</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 flex-1">
              <label className="text-sm">Matière</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les matières</SelectItem>
                  {subjects.map(subject => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Historique Détaillé
          </CardTitle>
          <CardDescription>
            {filteredRecords.length} enregistrement(s) pour cette période
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedDates.map((date) => {
              const dateRecords = recordsByDate[date];
              const dateObj = new Date(date);
              
              return (
                <div key={date} className="border-l-4 border-indigo-200 pl-4 py-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>
                      {dateObj.toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {dateRecords.map((record) => {
                      const session = sessions.find(s => s.id === record.sessionId);
                      
                      return (
                        <div
                          key={record.id}
                          className="bg-white p-3 rounded-lg border flex items-center justify-between hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center gap-3">
                            {getStatusIcon(record.status)}
                            <div>
                              <p>{session?.subject || 'N/A'}</p>
                              <p className="text-sm text-gray-500">
                                {session?.startTime} - {session?.endTime}
                              </p>
                            </div>
                          </div>
                          {getStatusBadge(record.status)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {sortedDates.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>Aucun enregistrement pour cette période</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
