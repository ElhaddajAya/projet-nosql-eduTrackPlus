import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import { teacherAttendances } from '../../data/mockData';
import { toast } from 'sonner@2.0.3';

interface AbsenceDeclarationProps {
  teacherId: string;
}

export default function AbsenceDeclaration({ teacherId }: AbsenceDeclarationProps) {
  const [absenceDate, setAbsenceDate] = useState<string>('');
  const [reason, setReason] = useState<string>('');

  const teacherAbsences = teacherAttendances.filter(a => a.teacherId === teacherId);

  const handleDeclareAbsence = () => {
    if (!absenceDate || !reason) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    toast.success('Absence déclarée avec succès', {
      description: 'Un remplaçant sera automatiquement assigné si disponible',
    });

    setAbsenceDate('');
    setReason('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl">Déclarer une Absence</h2>
        <p className="text-gray-500">Signaler votre indisponibilité pour vos cours</p>
      </div>

      {/* Declaration Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Nouvelle Déclaration
            </CardTitle>
            <CardDescription>
              Remplissez le formulaire pour déclarer votre absence
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="absence-date">Date d'absence</Label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <Input
                  id="absence-date"
                  type="date"
                  value={absenceDate}
                  onChange={(e) => setAbsenceDate(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Motif de l'absence</Label>
              <Textarea
                id="reason"
                placeholder="Expliquez la raison de votre absence..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Un remplaçant sera automatiquement assigné si un professeur enseignant la même matière est disponible à cet horaire.
              </p>
            </div>

            <Button onClick={handleDeclareAbsence} className="w-full" size="lg">
              Déclarer l'Absence
            </Button>
          </CardContent>
        </Card>

        {/* Absence History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Historique des Absences
            </CardTitle>
            <CardDescription>
              Vos absences déclarées
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teacherAbsences.map((absence) => (
                <div key={absence.id} className="p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        {new Date(absence.date).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <Badge variant="secondary">Validée</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    <strong>Motif:</strong> {absence.reason}
                  </p>
                </div>
              ))}

              {teacherAbsences.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>Aucune absence déclarée</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Conseils pour la Déclaration d'Absence</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">•</span>
              <span>Déclarez votre absence le plus tôt possible pour faciliter l'organisation des remplacements</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">•</span>
              <span>Fournissez un motif clair et précis pour votre absence</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">•</span>
              <span>Vérifiez votre emploi du temps pour voir si un remplaçant a été assigné</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">•</span>
              <span>En cas d'absence prolongée, contactez l'administration</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
