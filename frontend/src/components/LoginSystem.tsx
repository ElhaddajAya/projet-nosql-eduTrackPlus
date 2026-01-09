import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { GraduationCap, Users, BookOpen, AlertCircle } from "lucide-react";

export interface User {
  id: string;
  name: string;
  role: 'principal' | 'teacher' | 'student';
  email: string;
  class?: string;
  subject?: string;
}

interface LoginSystemProps {
  onLogin: (user: User) => void;
}

export function LoginSystem({ onLogin }: LoginSystemProps) {
  const [selectedRole, setSelectedRole] = useState<'principal' | 'teacher' | 'student' | ''>('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Mock user database for demo
  const mockUsers: User[] = [
    {
      id: '1',
      name: 'Dr. Sarah Johnson',
      role: 'principal',
      email: 'principal@school.edu'
    },
    {
      id: '2',
      name: 'Ms. Emily Davis',
      role: 'teacher',
      email: 'teacher1@school.edu',
      class: 'Grade 3A',
      subject: 'Mathematics'
    },
    {
      id: '3',
      name: 'Mr. Michael Brown',
      role: 'teacher',
      email: 'teacher2@school.edu',
      class: 'Grade 2B',
      subject: 'English'
    },
    {
      id: '4',
      name: 'Emma Wilson',
      role: 'student',
      email: 'emma.wilson@school.edu',
      class: 'Grade 3A'
    },
    {
      id: '5',
      name: 'James Rodriguez',
      role: 'student',
      email: 'james.rodriguez@school.edu',
      class: 'Grade 2B'
    }
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Find user in mock database
    const user = mockUsers.find(u => 
      u.email.toLowerCase() === email.toLowerCase() && 
      u.role === selectedRole
    );

    if (user && password === 'password123') {
      onLogin(user);
    } else {
      setError('Invalid credentials. Please try again.');
    }

    setIsLoading(false);
  };

  const demoCredentials = [
    { role: 'Principal', email: 'principal@school.edu', name: 'Dr. Sarah Johnson' },
    { role: 'Teacher 1', email: 'teacher1@school.edu', name: 'Ms. Emily Davis (Grade 3A)' },
    { role: 'Teacher 2', email: 'teacher2@school.edu', name: 'Mr. Michael Brown (Grade 2B)' },
    { role: 'Student 1', email: 'emma.wilson@school.edu', name: 'Emma Wilson (Grade 3A)' },
    { role: 'Student 2', email: 'james.rodriguez@school.edu', name: 'James Rodriguez (Grade 2B)' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="mb-2">Sunshine Primary School</h1>
          <p className="text-muted-foreground">School Management System</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your credentials to access the system</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={selectedRole} onValueChange={(value: any) => setSelectedRole(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="principal">Principal</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Demo Credentials</CardTitle>
            <CardDescription className="text-xs">Use these credentials to test the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Password for all accounts: <code className="bg-gray-100 px-1 rounded">password123</code></p>
              <div className="space-y-1">
                {demoCredentials.map((cred, index) => (
                  <div key={index} className="text-xs">
                    <Badge variant="outline" className="text-xs mr-2">{cred.role}</Badge>
                    <span className="text-muted-foreground">{cred.email}</span>
                    <div className="text-xs text-muted-foreground ml-16">{cred.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}