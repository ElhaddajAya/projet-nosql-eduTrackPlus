import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Users, GraduationCap, DollarSign, BookOpen, TrendingUp, Calendar, AlertCircle, ArrowLeft, UserCheck, UserX, Bell } from "lucide-react";
import { User } from "../LoginSystem";

interface PrincipalDashboardProps {
  user: User;
  onBack: () => void;
}

export function PrincipalDashboard({ user, onBack }: PrincipalDashboardProps) {
  // Primary school data (simplified)
  const schoolStats = [
    { title: "Total Students", value: "324", change: "+8", icon: Users, color: "text-blue-600" },
    { title: "Teaching Staff", value: "18", change: "+1", icon: GraduationCap, color: "text-green-600" },
    { title: "Present Today", value: "312", change: "96.3%", icon: UserCheck, color: "text-green-600" },
    { title: "Active Classes", value: "12", change: "K-5", icon: BookOpen, color: "text-purple-600" }
  ];

  const enrollmentData = [
    { month: 'Aug', students: 310 },
    { month: 'Sep', students: 315 },
    { month: 'Oct', students: 318 },
    { month: 'Nov', students: 320 },
    { month: 'Dec', students: 322 },
    { month: 'Jan', students: 324 }
  ];

  const gradeDistribution = [
    { grade: 'Kindergarten', students: 45, color: '#8884d8' },
    { grade: 'Grade 1', students: 52, color: '#82ca9d' },
    { grade: 'Grade 2', students: 58, color: '#ffc658' },
    { grade: 'Grade 3', students: 61, color: '#ff7300' },
    { grade: 'Grade 4', students: 54, color: '#8dd1e1' },
    { grade: 'Grade 5', students: 54, color: '#d084d0' }
  ];

  const attendanceData = [
    { day: 'Mon', present: 318, absent: 6 },
    { day: 'Tue', present: 315, absent: 9 },
    { day: 'Wed', present: 320, absent: 4 },
    { day: 'Thu', present: 316, absent: 8 },
    { day: 'Fri', present: 312, absent: 12 }
  ];

  const teacherAttendance = [
    { name: "Ms. Emily Davis", class: "Grade 3A", status: "present", time: "08:00 AM" },
    { name: "Mr. Michael Brown", class: "Grade 2B", status: "present", time: "07:45 AM" },
    { name: "Mrs. Sarah Wilson", class: "Grade 1A", status: "absent", time: "-", reason: "Sick Leave" },
    { name: "Ms. Jennifer Lee", class: "Kindergarten", status: "present", time: "08:15 AM" },
    { name: "Mr. David Garcia", class: "Grade 4A", status: "late", time: "08:30 AM" },
    { name: "Mrs. Lisa Taylor", class: "Grade 5B", status: "present", time: "07:50 AM" }
  ];

  const absentStudents = [
    { name: "Emma Johnson", class: "Grade 3A", teacher: "Ms. Emily Davis", reason: "Sick", notified: true },
    { name: "Liam Smith", class: "Grade 2B", teacher: "Mr. Michael Brown", reason: "Family Trip", notified: true },
    { name: "Olivia Davis", class: "Grade 1A", teacher: "Mrs. Sarah Wilson", reason: "Doctor Appointment", notified: false },
    { name: "Noah Wilson", class: "Grade 4A", teacher: "Mr. David Garcia", reason: "Sick", notified: true }
  ];

  const recentActivities = [
    { title: "12 students marked absent today", time: "30 minutes ago", type: "warning" },
    { title: "Teacher Sarah Wilson on sick leave", time: "1 hour ago", type: "info" },
    { title: "Parent notifications sent for absent students", time: "2 hours ago", type: "success" },
    { title: "Weekly attendance report generated", time: "1 day ago", type: "info" }
  ];

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
                <h1>Principal Dashboard</h1>
                <p className="text-muted-foreground">Welcome back, {user.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date().toLocaleDateString()}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {schoolStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm">{stat.title}</CardTitle>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <div className="text-2xl">{stat.value}</div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      <span className="text-green-600">{stat.change}</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Enrollment Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Student Enrollment Trends</CardTitle>
                  <CardDescription>Monthly enrollment over the past 6 months</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={enrollmentData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="students" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Grade Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Students by Grade Level</CardTitle>
                  <CardDescription>Current academic year breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={gradeDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="students"
                        label={({ grade, students }) => `${grade}: ${students}`}
                      >
                        {gradeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activities & Notifications</CardTitle>
                <CardDescription>Latest updates and alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                      <AlertCircle className={`w-4 h-4 mt-0.5 ${
                        activity.type === 'success' ? 'text-green-600' :
                        activity.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                      }`} />
                      <div className="flex-1">
                        <p className="text-sm">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weekly Attendance */}
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Attendance Overview</CardTitle>
                  <CardDescription>Student attendance for this week</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={attendanceData}>
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

              {/* Today's Absent Students */}
              <Card>
                <CardHeader>
                  <CardTitle>Today's Absent Students</CardTitle>
                  <CardDescription>Students marked absent today</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {absentStudents.map((student, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-red-50">
                        <div>
                          <p className="text-sm">{student.name}</p>
                          <p className="text-xs text-muted-foreground">{student.class} • {student.teacher}</p>
                          <p className="text-xs text-muted-foreground">Reason: {student.reason}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {student.notified ? (
                            <Badge variant="default" className="text-xs">
                              <Bell className="w-3 h-3 mr-1" />
                              Notified
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs">
                              Pending
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="staff" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Teacher Attendance Today</CardTitle>
                <CardDescription>Current status of all teaching staff</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Teacher Name</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Check-in Time</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teacherAttendance.map((teacher, index) => (
                      <TableRow key={index}>
                        <TableCell>{teacher.name}</TableCell>
                        <TableCell>{teacher.class}</TableCell>
                        <TableCell>
                          <Badge variant={
                            teacher.status === 'present' ? 'default' :
                            teacher.status === 'absent' ? 'destructive' : 'secondary'
                          }>
                            {teacher.status === 'present' && <UserCheck className="w-3 h-3 mr-1" />}
                            {teacher.status === 'absent' && <UserX className="w-3 h-3 mr-1" />}
                            {teacher.status === 'late' && <AlertCircle className="w-3 h-3 mr-1" />}
                            {teacher.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{teacher.time}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {teacher.reason || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Present Today</span>
                    <Badge variant="default">312 (96.3%)</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Absent Today</span>
                    <Badge variant="destructive">12 (3.7%)</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Late Arrivals</span>
                    <Badge variant="secondary">3</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Weekly Average</span>
                      <span className="text-sm">94.8%</span>
                    </div>
                    <Progress value={95} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Grade Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {gradeDistribution.map((grade, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{grade.grade}</span>
                        <span>{grade.students} students</span>
                      </div>
                      <Progress value={(grade.students / 324) * 100} />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Enrollments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm">
                    <p>Alex Johnson - Grade 2A</p>
                    <p className="text-muted-foreground">Enrolled Jan 15</p>
                  </div>
                  <div className="text-sm">
                    <p>Maya Patel - Kindergarten</p>
                    <p className="text-muted-foreground">Enrolled Jan 12</p>
                  </div>
                  <div className="text-sm">
                    <p>Carlos Rivera - Grade 4B</p>
                    <p className="text-muted-foreground">Enrolled Jan 8</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}