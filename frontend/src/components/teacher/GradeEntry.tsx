import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { FileUp, Save, Download } from 'lucide-react';
import { sessions, classes, students, grades as mockGrades } from '../../data/mockData';
import { toast } from 'sonner@2.0.3';

interface GradeEntryProps {
  teacherId: string;
}

export default function GradeEntry({ teacherId }: GradeEntryProps) {
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedField, setSelectedField] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [gradeData, setGradeData] = useState<Record<string, number>>({});

  // Get teacher's subjects from their sessions
  const teacherSessions = sessions.filter(s => s.teacherId === teacherId);
  const teacherSubjects = [...new Set(teacherSessions.map(s => s.subject))];
  const teacherClassIds = [...new Set(teacherSessions.map(s => s.classId))];
  const teacherClasses = classes.filter(c => teacherClassIds.includes(c.id));
  const levels = Array.from(new Set(teacherClasses.map(c => c.level)));
  const fields = Array.from(new Set(teacherClasses.map(c => c.field)));
  const filteredTeacherClasses = teacherClasses.filter(c =>
    (selectedLevel ? c.level === selectedLevel : true) &&
    (selectedField ? c.field === selectedField : true)
  );
  const filteredTeacherSubjects = selectedClassId
    ? Array.from(new Set(teacherSessions.filter(s => s.classId === selectedClassId).map(s => s.subject)))
    : teacherSubjects;
  const teacherStudents = students.filter(s => teacherClassIds.includes(s.classId));
  const filteredStudents = teacherStudents.filter(s =>
    (selectedClassId ? s.classId === selectedClassId : true) &&
    (selectedLevel ? s.level === selectedLevel : true) &&
    (selectedField ? s.field === selectedField : true)
  );

  const handleGradeChange = (studentId: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 20) {
      setGradeData(prev => ({
        ...prev,
        [studentId]: numValue,
      }));
    }
  };

  const handleSaveGrades = () => {
    toast.success('Notes enregistrées avec succès', {
      description: `${Object.keys(gradeData).length} notes mises à jour`,
    });
  };

  const handleImportExcel = () => {
    toast.info('Fonctionnalité d\'import Excel', {
      description: 'Sélectionnez un fichier Excel (.xlsx) pour importer les notes',
    });
  };

  const handleExportExcel = () => {
    toast.success('Exportation réussie', {
      description: 'Le fichier Excel a été téléchargé',
    });
  };

  // Get existing grades for the selected subject
  const getStudentGrade = (studentId: string) => {
    const existing = mockGrades.find(
      g => g.studentId === studentId && g.subject === selectedSubject && g.semester === selectedSemester
    );
    return gradeData[studentId] ?? existing?.score ?? '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl">Saisie des Notes</h2>
        <p className="text-gray-500">Enregistrer ou importer les notes des étudiants</p>
      </div>

      {/* Subject and Semester Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Sélectionner la Matière</CardTitle>
          <CardDescription>Choisissez la matière et le semestre</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm">Matière</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une matière" />
                </SelectTrigger>
                <SelectContent>
                  {filteredTeacherSubjects.map(subject => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm">Semestre</label>
              <Select value={String(selectedSemester)} onValueChange={(v) => setSelectedSemester(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Semestre 1</SelectItem>
                  <SelectItem value="2">Semestre 2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm">Niveau</label>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  {levels.map(l => (<SelectItem key={l} value={l}>{l}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm">Filière</label>
              <Select value={selectedField} onValueChange={setSelectedField}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  {fields.map(f => (<SelectItem key={f} value={f}>{f}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm">Classe</label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une classe" />
                </SelectTrigger>
                <SelectContent>
                  {filteredTeacherClasses.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={handleImportExcel}>
              <FileUp className="h-4 w-4" />
              Importer Excel
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleExportExcel}>
              <Download className="h-4 w-4" />
              Exporter Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedSubject && (
        <Card>
          <CardHeader>
            <CardTitle>Saisir les Notes - {selectedSubject}</CardTitle>
            <CardDescription>
              Semestre {selectedSemester} - Notes sur 20
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">N°</TableHead>
                    <TableHead>Nom de l'Étudiant</TableHead>
                    <TableHead>Classe</TableHead>
                    <TableHead className="w-32">Note (/20)</TableHead>
                    <TableHead className="w-32">Coefficient</TableHead>
                    <TableHead className="w-32">Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student, index) => {
                    const grade = getStudentGrade(student.id);
                    const numGrade = typeof grade === 'number' ? grade : parseFloat(String(grade));
                    const status = !isNaN(numGrade) 
                      ? numGrade >= 10 
                        ? 'Validé' 
                        : numGrade >= 8 
                        ? 'Rattrapage' 
                        : 'Non validé'
                      : '-';

                    return (
                      <TableRow key={student.id}>
                        <TableCell>{String(index + 1).padStart(3, '0')}</TableCell>
                        <TableCell>
                          {student.firstName} {student.lastName}
                        </TableCell>
                        <TableCell>{student.level}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="20"
                            step="0.5"
                            value={grade}
                            onChange={(e) => handleGradeChange(student.id, e.target.value)}
                            placeholder="Note"
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            max="10"
                            defaultValue="4"
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          {status !== '-' && (
                            <span className={`text-sm px-2 py-1 rounded ${
                              status === 'Validé' 
                                ? 'bg-green-100 text-green-700' 
                                : status === 'Rattrapage'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {status}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between items-center mt-6">
              <p className="text-sm text-gray-500">
                {Object.keys(gradeData).length} note(s) modifiée(s)
              </p>
              <Button onClick={handleSaveGrades} size="lg" className="gap-2">
                <Save className="h-4 w-4" />
                Enregistrer les Notes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedSubject && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Veuillez sélectionner une matière pour commencer la saisie des notes
          </CardContent>
        </Card>
      )}
    </div>
  );
}
