import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { BookOpen, Plus, Users, Calendar, MapPin, Search } from 'lucide-react';
import { classes, students, teachers } from '../../data/mockData';
import { toast } from 'sonner@2.0.3';

export default function ClassManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const filteredClasses = classes.filter(cls =>
    cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.level.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateClass = () => {
    toast.success('Classe créée avec succès');
    setIsCreateDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl">Gestion des Classes</h2>
          <p className="text-gray-500">Créer des classes et attribuer les élèves</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Créer une classe
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer une nouvelle classe</DialogTitle>
              <DialogDescription>
                Ajouter une classe et gérer ses attributions
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nom de la classe</Label>
                <Input placeholder="Grade 10A - Mathématiques" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Niveau</Label>
                  <Input placeholder="Grade 10A" />
                </div>
                <div className="space-y-2">
                  <Label>Filière</Label>
                  <Input placeholder="Sciences" />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreateClass}>
                Créer la classe
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
                <p className="text-sm text-gray-500">Classes Actives</p>
                <p className="text-2xl">{classes.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Étudiants</p>
                <p className="text-2xl">{students.length}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
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
              <Users className="h-8 w-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Classes</CardTitle>
          <CardDescription>Gérer les classes et leurs attributions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher une classe..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Classes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClasses.map((cls) => {
              const classStudents = students.filter(s => s.classId === cls.id);
              const classTeachers = teachers.filter(t => cls.teacherIds.includes(t.id));
              
              return (
                <Card key={cls.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{cls.level}</CardTitle>
                        <CardDescription>{cls.field}</CardDescription>
                      </div>
                      <BookOpen className="h-5 w-5 text-indigo-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span>{classStudents.length} étudiants</span>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Professeurs assignés:</p>
                      <div className="flex flex-wrap gap-1">
                        {classTeachers.map(teacher => (
                          <Badge key={teacher.id} variant="secondary" className="text-xs">
                            {teacher.firstName} {teacher.lastName}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        Voir détails
                      </Button>
                      <Button size="sm" className="flex-1">
                        Gérer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
