import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Calendar, Plus, Clock, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { classes, sessions, teachers } from '../../data/mockData';
import { Session } from '../../types';
import { toast } from 'sonner@2.0.3';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const;
const DAY_LABELS: Record<string, string> = {
  monday: 'Lundi',
  tuesday: 'Mardi',
  wednesday: 'Mercredi',
  thursday: 'Jeudi',
  friday: 'Vendredi',
};

const STATUS_COLORS: Record<string, string> = {
  normal: 'bg-white border-gray-200',
  cancelled: 'bg-red-50 border-red-300',
  postponed: 'bg-green-50 border-green-300',
  makeup: 'bg-purple-50 border-purple-300',
  replaced: 'bg-blue-50 border-blue-300',
};

const STATUS_LABELS: Record<string, string> = {
  normal: 'Normale',
  cancelled: 'Annulée',
  postponed: 'Reportée',
  makeup: 'Rattrapage',
  replaced: 'Remplacée',
};

export default function ScheduleManagement() {
  const [selectedClass, setSelectedClass] = useState<string>(classes[0]?.id || '');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [sessionList, setSessionList] = useState<Session[]>(sessions);
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedField, setSelectedField] = useState<string>('');
  const [weekDate, setWeekDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [editingSession, setEditingSession] = useState<Session | null>(null);

  const classSessions = sessionList.filter(s => s.classId === selectedClass);
  const selectedClassData = classes.find(c => c.id === selectedClass);

  const handleAddSession = () => {
  toast.success('Séance ajoutée avec succès');
  setIsAddDialogOpen(false);
};

const handleUpdateSession = (updated: Session) => {
  setSessionList(prev => prev.map(s => (s.id === updated.id ? updated : s)));
  setEditingSession(null);
  toast.success('Séance mise à jour');
};

const adjustWeek = (delta: number) => {
  const d = new Date(weekDate);
  d.setDate(d.getDate() + delta * 7);
  setWeekDate(d.toISOString().split('T')[0]);
};

const levels = Array.from(new Set(classes.map(c => c.level)));
const fields = Array.from(new Set(classes.map(c => c.field)));

const filteredClasses = classes.filter(c => 
  (selectedLevel ? c.level === selectedLevel : true) &&
  (selectedField ? c.field === selectedField : true)
);

const getSessionsByDay = (day: string) => {
  return classSessions
    .filter(s => s.day === day)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl">Emplois du Temps</h2>
          <p className="text-gray-500">Gérer les horaires et attributions des cours</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Ajouter une séance
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter une séance</DialogTitle>
              <DialogDescription>
                Créer une nouvelle séance dans l'emploi du temps
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Matière</Label>
                <Input placeholder="Mathématiques" />
              </div>
              
              <div className="space-y-2">
                <Label>Professeur</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un professeur" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map(teacher => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.firstName} {teacher.lastName} ({teacher.subjects.join(', ')})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Jour</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Jour" />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS.map(day => (
                        <SelectItem key={day} value={day}>
                          {DAY_LABELS[day]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Salle</Label>
                  <Input placeholder="Room 201" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Heure début</Label>
                  <Input type="time" defaultValue="08:00" />
                </div>

                <div className="space-y-2">
                  <Label>Heure fin</Label>
                  <Input type="time" defaultValue="10:00" />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleAddSession}>
                Ajouter
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Class Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Label>Niveau:</Label>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  {levels.map(l => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label>Filière:</Label>
              <Select value={selectedField} onValueChange={setSelectedField}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  {fields.map(f => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label>Classe:</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {filteredClasses.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedClassData && (
                <Badge variant="secondary">
                  {selectedClassData.studentIds.length} étudiants
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Label>Semaine:</Label>
              <Button variant="outline" size="icon" onClick={() => adjustWeek(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Input type="date" className="w-44" value={weekDate} onChange={e => setWeekDate(e.target.value)} />
              <Button variant="outline" size="icon" onClick={() => adjustWeek(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Légende des couleurs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-white border-2 border-gray-200 rounded"></div>
              <span className="text-sm">Séance normale</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-50 border-2 border-red-300 rounded"></div>
              <span className="text-sm">Séance annulée</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-50 border-2 border-green-300 rounded"></div>
              <span className="text-sm">Séance reportée</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-50 border-2 border-purple-300 rounded"></div>
              <span className="text-sm">Séance de rattrapage</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-50 border-2 border-blue-300 rounded"></div>
              <span className="text-sm">Professeur remplaçant</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {editingSession && (
        <Dialog open={!!editingSession} onOpenChange={(open) => !open && setEditingSession(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier la séance</DialogTitle>
              <DialogDescription>Mettre à jour le statut et les détails</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Statut</Label>
                  <Select value={editingSession.status} onValueChange={(val) => setEditingSession({ ...editingSession, status: val as any, replacementTeacherId: undefined, postponedTo: undefined, originalSessionId: undefined })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">{STATUS_LABELS['normal']}</SelectItem>
                      <SelectItem value="cancelled">{STATUS_LABELS['cancelled']}</SelectItem>
                      <SelectItem value="postponed">{STATUS_LABELS['postponed']}</SelectItem>
                      <SelectItem value="makeup">{STATUS_LABELS['makeup']}</SelectItem>
                      <SelectItem value="replaced">{STATUS_LABELS['replaced']}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Salle</Label>
                  <Input value={editingSession.room} onChange={e => setEditingSession({ ...editingSession, room: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Heure début</Label>
                  <Input type="time" value={editingSession.startTime} onChange={e => setEditingSession({ ...editingSession, startTime: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Heure fin</Label>
                  <Input type="time" value={editingSession.endTime} onChange={e => setEditingSession({ ...editingSession, endTime: e.target.value })} />
                </div>
              </div>

              {editingSession.status === 'replaced' && (
                <div className="space-y-2">
                  <Label>Professeur remplaçant</Label>
                  <Select value={editingSession.replacementTeacherId || ''} onValueChange={(val) => setEditingSession({ ...editingSession, replacementTeacherId: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un remplaçant" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers
                        .filter(t => t.subjects.includes(editingSession.subject) && t.id !== editingSession.teacherId)
                        .map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.firstName} {t.lastName} ({t.subjects.join(', ')})</SelectItem>
                        ))}
                      {teachers
                        .filter(t => !t.subjects.includes(editingSession.subject))
                        .map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.firstName} {t.lastName}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {editingSession.status === 'postponed' && (
                <div className="space-y-2">
                  <Label>Reporté au</Label>
                  <Input type="date" value={editingSession.postponedTo || ''} onChange={e => setEditingSession({ ...editingSession, postponedTo: e.target.value })} />
                </div>
              )}

              {editingSession.status === 'makeup' && (
                <div className="space-y-2">
                  <Label>Rattrapage de</Label>
                  <Select value={editingSession.originalSessionId || ''} onValueChange={(val) => setEditingSession({ ...editingSession, originalSessionId: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner la séance reportée" />
                    </SelectTrigger>
                    <SelectContent>
                      {sessionList
                        .filter(s => s.classId === editingSession.classId && s.status === 'postponed')
                        .map(s => (
                          <SelectItem key={s.id} value={s.id}>{DAY_LABELS[s.day]} {s.startTime} - {s.subject}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingSession(null)}>Annuler</Button>
              {editingSession && <Button onClick={() => handleUpdateSession(editingSession)}>Enregistrer</Button>}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Emploi du temps */}
      <Card>
        <CardHeader>
          <CardTitle>Emploi du temps de la semaine</CardTitle>
          <CardDescription>
            {selectedClassData?.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {DAYS.map(day => {
              const daySessions = getSessionsByDay(day);
              
              return (
                <div key={day} className="space-y-3">
                  <div className="text-center pb-2 border-b">
                    <h3>{DAY_LABELS[day]}</h3>
                    <p className="text-xs text-gray-500">{daySessions.length} cours</p>
                  </div>
                  
                  <div className="space-y-2">
                    {daySessions.map((session) => {
                      const teacher = teachers.find(t => t.id === session.teacherId);
                      const replacementTeacher = session.replacementTeacherId 
                        ? teachers.find(t => t.id === session.replacementTeacherId)
                        : null;
                      
                      return (
                        <div
                          key={session.id}
                          className={`p-3 rounded-lg border-2 ${STATUS_COLORS[session.status]} hover:shadow-md transition-shadow cursor-pointer`}
                          onClick={() => setEditingSession(session)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="text-sm text-indigo-700">{session.startTime} - {session.endTime}</div>
                            {session.status !== 'normal' && (
                              <Badge variant="outline" className="text-xs">
                                {STATUS_LABELS[session.status]}
                              </Badge>
                            )}
                          </div>
                          
                          <div>
                            <p>{session.subject}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              {replacementTeacher 
                                ? `${replacementTeacher.firstName} ${replacementTeacher.lastName}`
                                : teacher ? `${teacher.firstName} ${teacher.lastName}` : 'N/A'
                              }
                            </p>
                            {replacementTeacher && (
                              <p className="text-xs text-blue-600 mt-1">
                                Remplaçant: {replacementTeacher.firstName} {replacementTeacher.lastName}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                            <MapPin className="h-3 w-3" />
                            {session.room}
                          </div>

                          {session.postponedTo && (
                            <p className="text-xs text-green-600 mt-2">
                              Reportée au {new Date(session.postponedTo).toLocaleDateString('fr-FR')}
                            </p>
                          )}
                        </div>
                      );
                    })}
                    
                    {daySessions.length === 0 && (
                      <div className="text-center py-8 text-gray-400 text-sm">
                        Aucun cours
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
