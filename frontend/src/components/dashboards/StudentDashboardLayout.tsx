import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BookOpen, Calendar, Clock, TrendingUp, Award, AlertCircle, ArrowLeft, FileText, Users, Star, Heart } from "lucide-react";
import { User } from "../LoginSystem";

interface StudentDashboardProps {
  user: User;
  onBack: () => void;
}

export function StudentDashboard({ user, onBack }: StudentDashboardProps) {
  // Primary school student data (simplified and age-appropriate)
  const studentStats = [
    { title: "My Grade", value: user.class?.split(' ')[1] || "3A", icon: Award, color: "text-blue-600" },
    { title: "Attendance", value: "98%", icon: Calendar, color: "text-green-600" },
    { title: "Stars Earned", value: "45", icon: Star, color: "text-yellow-600" },
    { title: "Friends", value: "12", icon: Heart, color: "text-pink-600" }
  ];

  const todaysSchedule = [
    { subject: "📐 Mathematics", time: "09:00 AM", activity: "Addition & Subtraction", completed: true },
    { subject: "📚 English", time: "10:00 AM", activity: "Story Reading", completed: true },
    { subject: "🔬 Science", time: "11:00 AM", activity: "Plants & Animals", completed: false },
    { subject: "🎨 Art", time: "01:00 PM", activity: "Drawing Time", completed: false },
    { subject: "⚽ PE", time: "02:00 PM", activity: "Fun Games", completed: false }
  ];

  const subjectProgress = [
    { subject: 'Math', progress: 85, color: '#8884d8', emoji: '📐' },
    { subject: 'English', progress: 92, color: '#82ca9d', emoji: '📚' },
    { subject: 'Science', progress: 78, color: '#ffc658', emoji: '🔬' },
    { subject: 'Art', progress: 95, color: '#ff7300', emoji: '🎨' },
    { subject: 'PE', progress: 88, color: '#8dd1e1', emoji: '⚽' }
  ];

  const weeklyAttendance = [
    { day: 'Mon', status: 'present', emoji: '😊' },
    { day: 'Tue', status: 'present', emoji: '😊' },
    { day: 'Wed', status: 'present', emoji: '😊' },
    { day: 'Thu', status: 'absent', emoji: '😷' },
    { day: 'Fri', status: 'present', emoji: '😊' }
  ];

  const achievements = [
    { title: "Perfect Attendance Week", date: "This Week", emoji: "🏆", color: "bg-yellow-100" },
    { title: "Math Star", date: "Jan 20", emoji: "⭐", color: "bg-blue-100" },
    { title: "Reading Champion", date: "Jan 15", emoji: "📖", color: "bg-green-100" },
    { title: "Art Master", date: "Jan 10", emoji: "🎨", color: "bg-purple-100" }
  ];

  const announcements = [
    { 
      title: "🎪 Fun Day Tomorrow!", 
      content: "We're having games and activities in the playground", 
      important: true,
      emoji: "🎉"
    },
    { 
      title: "📚 Library Visit Next Week", 
      content: "Remember to bring your library cards", 
      important: false,
      emoji: "📚"
    },
    { 
      title: "🍎 Healthy Lunch Week", 
      content: "Bring fruits and vegetables for snack time", 
      important: false,
      emoji: "🥕"
    }
  ];

  const friends = [
    { name: "Emma Johnson", status: "present", emoji: "😊" },
    { name: "Liam Smith", status: "present", emoji: "😊" },
    { name: "Olivia Davis", status: "absent", emoji: "😷" },
    { name: "Noah Wilson", status: "present", emoji: "😊" }
  ];

  const homeworkTasks = [
    { task: "📐 Math worksheet - Page 15", due: "Tomorrow", completed: true },
    { task: "📚 Read 2 pages of story book", due: "Tomorrow", completed: false },
    { task: "🔬 Draw your favorite animal", due: "Monday", completed: false },
    { task: "🎨 Color the rainbow picture", due: "Tuesday", completed: true }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
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
                <h1>My School Dashboard 🏫</h1>
                <p className="text-muted-foreground">Hello, {user.name}! Ready to learn today?</p>
                <p className="text-sm text-muted-foreground">Class: {user.class}</p>
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
          {studentStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="bg-white/80 backdrop-blur">
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

        <Tabs defaultValue="today" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="progress">My Progress</TabsTrigger>
            <TabsTrigger value="friends">Friends</TabsTrigger>
            <TabsTrigger value="homework">Homework</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Today's Classes */}
              <Card className="bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle>📅 My Classes Today</CardTitle>
                  <CardDescription>Let's see what fun things we're learning!</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {todaysSchedule.map((class_, index) => (
                      <div key={index} className={`flex items-center justify-between p-3 rounded-lg border ${
                        class_.completed ? 'bg-green-50' : 'bg-white'
                      }`}>
                        <div>
                          <p className="text-sm">{class_.subject}</p>
                          <p className="text-xs text-muted-foreground">{class_.activity}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="text-xs mb-1">{class_.time}</Badge>
                          {class_.completed && <div className="text-green-600 text-xs">✅ Done!</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* This Week's Attendance */}
              <Card className="bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle>🗓️ This Week at School</CardTitle>
                  <CardDescription>How many days did you come to school?</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-2">
                    {weeklyAttendance.map((day, index) => (
                      <div key={index} className="text-center">
                        <div className="text-xs text-muted-foreground mb-1">{day.day}</div>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg ${
                          day.status === 'present' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {day.emoji}
                        </div>
                        <div className="text-xs mt-1">
                          {day.status === 'present' ? 'Present' : 'Absent'}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-center">
                    <Badge variant="default" className="text-sm">
                      Great job! You came to school 4 out of 5 days! 🌟
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Announcements */}
            <Card className="bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle>📢 School News</CardTitle>
                <CardDescription>Important messages from your teachers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {announcements.map((announcement, index) => (
                    <div key={index} className={`p-3 rounded-lg border ${
                      announcement.important ? 'bg-yellow-50 border-yellow-200' : 'bg-white'
                    }`}>
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">{announcement.emoji}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm">{announcement.title}</p>
                            {announcement.important && <AlertCircle className="w-4 h-4 text-yellow-600" />}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{announcement.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* My Achievements */}
            <Card className="bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle>🏆 My Achievements</CardTitle>
                <CardDescription>Look at all the amazing things you've done!</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {achievements.map((achievement, index) => (
                    <div key={index} className={`p-3 rounded-lg text-center ${achievement.color}`}>
                      <div className="text-2xl mb-2">{achievement.emoji}</div>
                      <p className="text-xs">{achievement.title}</p>
                      <p className="text-xs text-muted-foreground">{achievement.date}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Subject Progress */}
              <Card className="bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle>📊 How Am I Doing?</CardTitle>
                  <CardDescription>Your progress in different subjects</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {subjectProgress.map((subject, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm flex items-center gap-2">
                            <span className="text-lg">{subject.emoji}</span>
                            {subject.subject}
                          </span>
                          <span className="text-sm">{subject.progress}%</span>
                        </div>
                        <Progress value={subject.progress} className="h-3" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Visual Progress Chart */}
              <Card className="bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle>🎯 My Subject Stars</CardTitle>
                  <CardDescription>See how well you're doing in each subject!</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={subjectProgress}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="subject" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="progress" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="friends" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle>👫 My Classmates</CardTitle>
                <CardDescription>See who's in class today!</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {friends.map((friend, index) => (
                    <div key={index} className={`p-4 rounded-lg border text-center ${
                      friend.status === 'present' ? 'bg-green-50' : 'bg-red-50'
                    }`}>
                      <div className="text-3xl mb-2">{friend.emoji}</div>
                      <p className="text-sm">{friend.name}</p>
                      <Badge variant={friend.status === 'present' ? 'default' : 'destructive'} className="text-xs mt-1">
                        {friend.status === 'present' ? 'Here Today!' : 'Not Here'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="homework" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle>📝 My Homework</CardTitle>
                <CardDescription>Things I need to do at home</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {homeworkTasks.map((task, index) => (
                    <div key={index} className={`flex items-center justify-between p-3 rounded-lg border ${
                      task.completed ? 'bg-green-50' : 'bg-white'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          task.completed ? 'bg-green-500 text-white' : 'bg-gray-200'
                        }`}>
                          {task.completed ? '✓' : ''}
                        </div>
                        <div>
                          <p className="text-sm">{task.task}</p>
                          <p className="text-xs text-muted-foreground">Due: {task.due}</p>
                        </div>
                      </div>
                      {task.completed && (
                        <Badge variant="default" className="text-xs">Done! 🌟</Badge>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 rounded-lg text-center">
                  <p className="text-sm text-blue-700">Great job! You completed 2 out of 4 tasks! 🎉</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}