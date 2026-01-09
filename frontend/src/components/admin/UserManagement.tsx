import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { UserPlus, Search, Mail, Key, Users } from 'lucide-react';
import { students, teachers, classes } from '../../data/mockData';
import { toast } from 'sonner@2.0.3';

export default function UserManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    role: 'student',
    firstName: '',
    lastName: '',
    classId: '',
    subjects: [] as string[],
  });

  const allUsers = [...students, ...teachers];

  const filteredUsers = allUsers.filter(user => {
    const matchesSearch = 
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    
    return matchesSearch && matchesRole;
  });

  const generateCredentials = (firstName: string, lastName: string, role: string) => {
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@school.com`;
    const password = `${role}${Math.floor(Math.random() * 10000)}`;
    return { email, password };
  };

  const handleCreateUser = () => {
    const credentials = generateCredentials(newUser.firstName, newUser.lastName, newUser.role);
    
    toast.success('Utilisateur créé avec succès', {
      description: `Email: ${credentials.email}\nMot de passe: ${credentials.password}\n(Envoyé automatiquement par email)`,
      duration: 5000,
    });

    setIsCreateDialogOpen(false);
    setNewUser({
      role: 'student',
      firstName: '',
      lastName: '',
      classId: '',
      subjects: [],
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl">Gestion des Utilisateurs</h2>
          <p className="text-gray-500">Créer et gérer les comptes étudiants et professeurs</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Créer un utilisateur
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
              <DialogDescription>
                Les identifiants seront générés et envoyés automatiquement
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Type d'utilisateur</Label>
                <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Étudiant</SelectItem>
                    <SelectItem value="teacher">Professeur</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prénom</Label>
                  <Input 
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                    placeholder="Jean"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nom</Label>
                  <Input 
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                    placeholder="Dupont"
                  />
                </div>
              </div>

              {newUser.role === 'student' && (
                <div className="space-y-2">
                  <Label>Classe</Label>
                  <Select value={newUser.classId} onValueChange={(value) => setNewUser({ ...newUser, classId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une classe" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map(cls => (
                        <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {newUser.role === 'teacher' && (
                <div className="space-y-2">
                  <Label>Matières enseignées</Label>
                  <Input 
                    placeholder="Mathématiques, Physique"
                    onChange={(e) => setNewUser({ ...newUser, subjects: e.target.value.split(',').map(s => s.trim()) })}
                  />
                  <p className="text-xs text-gray-500">Séparer par des virgules</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreateUser} disabled={!newUser.firstName || !newUser.lastName}>
                Créer et envoyer identifiants
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Étudiants</p>
                <p className="text-2xl">{students.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Professeurs</p>
                <p className="text-2xl">{teachers.length}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Utilisateurs</p>
                <p className="text-2xl">{allUsers.length}</p>
              </div>
              <Users className="h-8 w-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Utilisateurs</CardTitle>
          <CardDescription>Rechercher et filtrer les utilisateurs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par nom, prénom ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                <SelectItem value="student">Étudiants</SelectItem>
                <SelectItem value="teacher">Professeurs</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Détails</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'student' ? 'default' : 'secondary'}>
                        {user.role === 'student' ? 'Étudiant' : 'Professeur'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.role === 'student' && 'level' in user && (
                        <span className="text-sm text-gray-500">{user.level}</span>
                      )}
                      {user.role === 'teacher' && 'subjects' in user && (
                        <span className="text-sm text-gray-500">{user.subjects.join(', ')}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="gap-2">
                        <Key className="h-4 w-4" />
                        Réinitialiser
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
