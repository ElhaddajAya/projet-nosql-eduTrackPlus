import { useState } from 'react';
import { GraduationCap } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { allUsers } from '../data/mockData';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const user = allUsers.find(
      (u) => u.email === email && u.password === password
    );

    if (user) {
      onLogin(user);
    } else {
      setError('Email ou mot de passe incorrect');
    }
  };

  const quickLogin = (role: 'admin' | 'teacher' | 'student') => {
    const credentials = {
      admin: { email: 'admin@school.com', password: 'admin123' },
      teacher: { email: 'jean.dupont@school.com', password: 'teacher123' },
      student: { email: 'emma.j@school.com', password: 'student123' },
    };

    setEmail(credentials[role].email);
    setPassword(credentials[role].password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-indigo-600 rounded-full flex items-center justify-center">
              <GraduationCap className="h-10 w-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">EduManager</CardTitle>
          <CardDescription>
            Système de gestion scolaire
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre.email@school.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <Button type="submit" className="w-full">
              Se connecter
            </Button>
          </form>

          <div className="mt-6">
            <p className="text-sm text-gray-500 text-center mb-3">
              Connexion rapide (démo)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => quickLogin('admin')}
              >
                Admin
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => quickLogin('teacher')}
              >
                Prof
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => quickLogin('student')}
              >
                Étudiant
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
