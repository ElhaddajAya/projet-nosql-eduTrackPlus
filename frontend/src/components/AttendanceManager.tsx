import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Checkbox } from "./ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner@2.0.3";
import { Users, Calendar, AlertTriangle, CheckCircle, XCircle, Save } from "lucide-react";

interface Student {
  id: string;
  name: string;
  rollNumber: string;
  class: string;
  parentEmail: string;
  parentPhone: string;
}

interface AttendanceRecord {
  studentId: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  remarks?: string;
}

interface AttendanceManagerProps {
  teacherClass: string;
  onAttendanceSubmit: (records: AttendanceRecord[]) => void;
}

export function AttendanceManager({ teacherClass, onAttendanceSubmit }: AttendanceManagerProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState<Record<string, 'present' | 'absent' | 'late'>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Mock student data for the class
  const classStudents: Student[] = [
    {
      id: '1',
      name: 'Emma Johnson',
      rollNumber: '001',
      class: teacherClass,
      parentEmail: 'parent1@email.com',
      parentPhone: '+1234567890'
    },
    {
      id: '2',
      name: 'Liam Smith',
      rollNumber: '002',
      class: teacherClass,
      parentEmail: 'parent2@email.com',
      parentPhone: '+1234567891'
    },
    {
      id: '3',
      name: 'Olivia Davis',
      rollNumber: '003',
      class: teacherClass,
      parentEmail: 'parent3@email.com',
      parentPhone: '+1234567892'
    },
    {
      id: '4',
      name: 'Noah Wilson',
      rollNumber: '004',
      class: teacherClass,
      parentEmail: 'parent4@email.com',
      parentPhone: '+1234567893'
    },
    {
      id: '5',
      name: 'Ava Martinez',
      rollNumber: '005',
      class: teacherClass,
      parentEmail: 'parent5@email.com',
      parentPhone: '+1234567894'
    },
    {
      id: '6',
      name: 'William Brown',
      rollNumber: '006',
      class: teacherClass,
      parentEmail: 'parent6@email.com',
      parentPhone: '+1234567895'
    },
    {
      id: '7',
      name: 'Sophia Garcia',
      rollNumber: '007',
      class: teacherClass,
      parentEmail: 'parent7@email.com',
      parentPhone: '+1234567896'
    },
    {
      id: '8',
      name: 'James Miller',
      rollNumber: '008',
      class: teacherClass,
      parentEmail: 'parent8@email.com',
      parentPhone: '+1234567897'
    }
  ];

  const handleAttendanceChange = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const markAllPresent = () => {
    const allPresent = classStudents.reduce((acc, student) => ({
      ...acc,
      [student.id]: 'present' as const
    }), {});
    setAttendanceData(allPresent);
    toast.success('All students marked as present');
  };

  const handleSaveAttendance = async () => {
    setIsSaving(true);
    
    // Create attendance records
    const records: AttendanceRecord[] = classStudents.map(student => ({
      studentId: student.id,
      date: selectedDate,
      status: attendanceData[student.id] || 'present'
    }));

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Send notifications for absent students
    const absentStudents = records.filter(r => r.status === 'absent');
    if (absentStudents.length > 0) {
      const absentNames = absentStudents.map(r => {
        const student = classStudents.find(s => s.id === r.studentId);
        return student?.name;
      }).join(', ');
      
      toast.warning(`Absence notifications sent to parents of: ${absentNames}`);
    }

    onAttendanceSubmit(records);
    toast.success(`Attendance saved for ${records.length} students`);
    setIsSaving(false);
  };

  const getStatusColor = (status: 'present' | 'absent' | 'late') => {
    switch (status) {
      case 'present': return 'text-green-600';
      case 'absent': return 'text-red-600';
      case 'late': return 'text-yellow-600';
      default: return '';
    }
  };

  const getStatusIcon = (status: 'present' | 'absent' | 'late') => {
    switch (status) {
      case 'present': return <CheckCircle className="w-4 h-4" />;
      case 'absent': return <XCircle className="w-4 h-4" />;
      case 'late': return <AlertTriangle className="w-4 h-4" />;
      default: return null;
    }
  };

  const presentCount = Object.values(attendanceData).filter(status => status === 'present').length;
  const absentCount = Object.values(attendanceData).filter(status => status === 'absent').length;
  const lateCount = Object.values(attendanceData).filter(status => status === 'late').length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Student Attendance - {teacherClass}
              </CardTitle>
              <CardDescription>Mark daily attendance for your class</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl text-green-600">{presentCount}</div>
                <div className="text-sm text-muted-foreground">Present</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl text-red-600">{absentCount}</div>
                <div className="text-sm text-muted-foreground">Absent</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl text-yellow-600">{lateCount}</div>
                <div className="text-sm text-muted-foreground">Late</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button onClick={markAllPresent} variant="outline" size="sm">
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark All Present
              </Button>
            </div>

            {/* Attendance Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Roll No.</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Present</TableHead>
                  <TableHead>Absent</TableHead>
                  <TableHead>Late</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classStudents.map((student) => {
                  const status = attendanceData[student.id] || 'present';
                  return (
                    <TableRow key={student.id}>
                      <TableCell>{student.rollNumber}</TableCell>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>
                        <Checkbox
                          checked={status === 'present'}
                          onCheckedChange={() => handleAttendanceChange(student.id, 'present')}
                        />
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={status === 'absent'}
                          onCheckedChange={() => handleAttendanceChange(student.id, 'absent')}
                        />
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={status === 'late'}
                          onCheckedChange={() => handleAttendanceChange(student.id, 'late')}
                        />
                      </TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-2 ${getStatusColor(status)}`}>
                          {getStatusIcon(status)}
                          <span className="capitalize">{status}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button onClick={handleSaveAttendance} disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Attendance'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Teacher Attendance Component
interface TeacherAttendanceProps {
  teacherName: string;
  onStatusUpdate: (status: 'present' | 'absent', reason?: string) => void;
}

export function TeacherAttendance({ teacherName, onStatusUpdate }: TeacherAttendanceProps) {
  const [status, setStatus] = useState<'present' | 'absent'>('present');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    onStatusUpdate(status, reason);
    toast.success(`Attendance marked as ${status}`);
    setIsSubmitting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Teacher Attendance</CardTitle>
        <CardDescription>Mark your attendance for today</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="present"
              checked={status === 'present'}
              onCheckedChange={() => setStatus('present')}
            />
            <label htmlFor="present" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Present
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="absent"
              checked={status === 'absent'}
              onCheckedChange={() => setStatus('absent')}
            />
            <label htmlFor="absent" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Absent
            </label>
          </div>
        </div>

        {status === 'absent' && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Reason for absence (optional)</label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sick">Sick Leave</SelectItem>
                <SelectItem value="personal">Personal Leave</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
                <SelectItem value="training">Training/Workshop</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Submitting...' : 'Submit Attendance'}
        </Button>
      </CardContent>
    </Card>
  );
}