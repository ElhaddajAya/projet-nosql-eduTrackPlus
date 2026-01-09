import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, BookOpen, Calendar, Clock, CheckCircle, AlertCircle, ArrowLeft, FileText, UserCheck, UserX } from "lucide-react";
import { User } from "../LoginSystem";
import { TeacherAttendance, AttendanceManager } from "../AttendanceManager";
import { toast } from "sonner@2.0.3";

interface TeacherDashboardProps {
  user: User;
  onBack: () => void;
}

interface AttendanceRecord {
  studentId: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  remarks?: string;
}

export function TeacherDashboard({ user, onBack }: TeacherDashboardProps) {
  const [teacherStatus, setTeacherStatus] = useState<'present' | 'absent'>('present');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  // Primary school teacher data
  const teacherStats = [
    { title: "My Class", value: "25", icon: Users, color: "text-blue-600" },
    { title: "Present Today", value: "23", icon: UserCheck, color: "text-green-600" },
    { title: "Absent Today", value: "2", icon: UserX, color: "text-red-600" },
    { title: "My Status", value: teacherStatus === 'present' ? "Present" : "Absent", icon: CheckCircle, color: teacherStatus === 'present' ? "text-green-600" : "text-red-600" }
  ];

  const todaysSchedule = [
    { subject: "Mathematics", time: "09:00 - 09:45 AM", activity: "Addition & Subtraction" },
    { subject: "English", time: "10:00 - 10:45 AM", activity: "Reading Comprehension" },
    { subject: "Science", time: "11:00 - 11:45 AM", activity: "Plants & Animals" },
    { subject: "Art", time: "01:00 - 01:45 PM", activity: "Drawing & Coloring" },
    { subject: "Physical Education", time: "02:00 - 02:45 PM", activity: "Outdoor Games" }
  ];

  const weeklyAttendance = [
    { day: 'Mon', present: 24, absent: 1 },
    { day: 'Tue', present: 23, absent: 2 },
    { day: 'Wed', present: 25, absent: 0 },
    { day: 'Thu', present: 22, absent: 3 },
    { day: 'Fri', present: 23, absent: 2 }
  ];

  const upcomingEvents = [
    { title: "Parent-Teacher Meeting", date: "Jan 28", time: "2:00 PM", type: "meeting" },
    { title: "Art Exhibition", date: "Feb 2", time: "All Day", type: "event" },
    { title: "Field Trip Permission", date: "Feb 5", time: "Due", type: "task" },
    { title: "Monthly Report Cards", date: "Feb 10", time: "Due", type: "task" }
  ];

  const absentStudents = [
    { name: "Emma Johnson", reason: "Sick", date: "Today", parentNotified: true },
    { name: "Noah Wilson", reason: "Family Emergency", date: "Today", parentNotified: true }
  ];

  const handleTeacherStatusUpdate = (status: 'present' | 'absent', reason?: string) => {
    setTeacherStatus(status);
    // In a real app, this would update the database
    console.log('Teacher status updated:', { status, reason });
  };

  const handleAttendanceSubmit = (records: AttendanceRecord[]) => {
    setAttendanceRecords(records);
    // In a real app, this would save to database and trigger notifications
    console.log('Attendance records submitted:', records);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Logout
              </Button>
              <div>
                <h1>Teacher Dashboard</h1>
                <p className="text-muted-foreground">Welcome back, {user.name}</p>
                <p className="text-sm text-muted-foreground">{user.class} • {user.subject}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {new Date().toLocaleDateString()}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {teacherStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm">{stat.title}</CardTitle>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="attendance">Student Attendance</TabsTrigger>
            <TabsTrigger value="my-attendance">My Attendance</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Today's Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle>Today's Schedule</CardTitle>
                  <CardDescription>Your classes for {new Date().toLocaleDateString()}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {todaysSchedule.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                        <div>
                          <p>{item.subject}</p>
                          <p className="text-sm text-muted-foreground">{item.activity}</p>
                        </div>
                        <Badge variant="outline">{item.time}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Weekly Attendance Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Attendance Overview</CardTitle>
                  <CardDescription>Student attendance for this week</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={weeklyAttendance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="present" fill="#22c55e" name="Present" />
                      <Bar dataKey="absent" fill="#ef4444" name="Absent" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Absent Students Today */}
            <Card>
              <CardHeader>
                <CardTitle>Students Absent Today</CardTitle>
                <CardDescription>Students marked absent in your class</CardDescription>
              </CardHeader>
              <CardContent>
                {absentStudents.length > 0 ? (
                  <div className="space-y-3">
                    {absentStudents.map((student, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-red-50">
                        <div>
                          <p>{student.name}</p>
                          <p className="text-sm text-muted-foreground">Reason: {student.reason}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {student.parentNotified ? (
                            <Badge variant="default" className="text-xs">Parent Notified</Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs">Notification Pending</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    All students are present today! 🎉
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Events & Tasks</CardTitle>
                <CardDescription>Important dates and deadlines</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingEvents.map((event, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <div>
                        <p>{event.title}</p>
                        <p className="text-sm text-muted-foreground">{event.date} • {event.time}</p>
                      </div>
                      <Badge variant={event.type === 'meeting' ? 'default' : event.type === 'event' ? 'secondary' : 'outline'}>
                        {event.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance" className="space-y-6">
            <AttendanceManager 
              teacherClass={user.class || "Grade 3A"} 
              onAttendanceSubmit={handleAttendanceSubmit}
            />
          </TabsContent>

          <TabsContent value="my-attendance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TeacherAttendance 
                teacherName={user.name}
                onStatusUpdate={handleTeacherStatusUpdate}
              />

              <Card>
                <CardHeader>
                  <CardTitle>My Attendance History</CardTitle>
                  <CardDescription>Your attendance record for this month</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Days Present</span>
                      <span className="text-sm">18 days</span>
                    </div>
                    <Progress value={95} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Days Absent</span>
                      <span className="text-sm">1 day</span>
                    </div>
                    <Progress value={5} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Attendance Rate</span>
                      <span className="text-sm">94.7%</span>
                    </div>
                    <Progress value={95} />
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <h4 className="text-sm">Recent Records:</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Jan 24, 2025</span>
                        <Badge variant="default" className="text-xs">Present</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Jan 23, 2025</span>
                        <Badge variant="default" className="text-xs">Present</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Jan 22, 2025</span>
                        <Badge variant="destructive" className="text-xs">Absent - Sick</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Jan 21, 2025</span>
                        <Badge variant="default" className="text-xs">Present</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Schedule</CardTitle>
                <CardDescription>Your complete class schedule</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-6 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm">Time</p>
                    {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'].map(time => (
                      <div key={time} className="h-12 flex items-center">
                        <span className="text-xs text-muted-foreground">{time}</span>
                      </div>
                    ))}
                  </div>
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                    <div key={day} className="space-y-2">
                      <p className="text-sm">{day}</p>
                      {[
                        'Math', 'English', 'Science', 'Lunch', 'Art', 'PE', 'Free'
                      ].map((subject, index) => (
                        <div key={index} className={`h-12 rounded p-2 text-xs flex items-center justify-center ${
                          subject === 'Lunch' ? 'bg-yellow-100' :
                          subject === 'Free' ? 'bg-gray-100' :
                          subject === 'PE' ? 'bg-green-100' : 'bg-blue-100'
                        }`}>
                          {subject}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}