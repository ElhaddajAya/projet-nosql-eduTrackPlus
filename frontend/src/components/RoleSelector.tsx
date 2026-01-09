import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { GraduationCap, Users, BookOpen } from "lucide-react";

interface RoleSelectorProps {
  onRoleSelect: (role: 'principal' | 'teacher' | 'student') => void;
}

export function RoleSelector({ onRoleSelect }: RoleSelectorProps) {
  const roles = [
    {
      id: 'principal' as const,
      title: 'Principal Dashboard',
      description: 'School administration and management overview',
      icon: GraduationCap,
      color: 'bg-blue-500'
    },
    {
      id: 'teacher' as const,
      title: 'Teacher Dashboard',
      description: 'Class management, grading, and student tracking',
      icon: Users,
      color: 'bg-green-500'
    },
    {
      id: 'student' as const,
      title: 'Student Dashboard',
      description: 'View grades, assignments, and school information',
      icon: BookOpen,
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="mb-4">EduConnect School Management System</h1>
          <p className="text-muted-foreground">Select your role to access the appropriate dashboard</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <Card key={role.id} className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-primary/20">
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 ${role.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle>{role.title}</CardTitle>
                  <CardDescription>{role.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => onRoleSelect(role.id)}
                    className="w-full"
                    size="lg"
                  >
                    Access Dashboard
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}