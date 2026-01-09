import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { AlertTriangle, Bell, Mail, MessageSquare } from 'lucide-react';
import { alertThresholds } from '../../data/mockData';
import { toast } from 'sonner@2.0.3';

export default function AlertConfiguration() {
  const [attendanceThreshold, setAttendanceThreshold] = useState(80);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [inAppNotifications, setInAppNotifications] = useState(true);

  const handleSaveSettings = () => {
    toast.success('Paramètres enregistrés avec succès');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl">Configuration des Alertes</h2>
        <p className="text-gray-500">Gérer les seuils d'alerte et les notifications</p>
      </div>

      {/* Attendance Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Seuils d'Assiduité
          </CardTitle>
          <CardDescription>
            Configurer les alertes automatiques pour l'assiduité des étudiants
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="attendance-threshold">Taux de présence minimum (%)</Label>
                <p className="text-sm text-gray-500">
                  Alerter quand le taux de présence est inférieur à ce seuil
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  id="attendance-threshold"
                  type="number"
                  min="0"
                  max="100"
                  value={attendanceThreshold}
                  onChange={(e) => setAttendanceThreshold(Number(e.target.value))}
                  className="w-20"
                />
                <span className="text-2xl">{attendanceThreshold}%</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p>Alertes hebdomadaires</p>
                    <p className="text-sm text-gray-500">Envoyer un rapport chaque semaine</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p>Alertes immédiates</p>
                    <p className="text-sm text-gray-500">Notification en temps réel</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Channels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-indigo-600" />
            Canaux de Notification
          </CardTitle>
          <CardDescription>
            Choisir comment recevoir les alertes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-blue-600" />
                <div>
                  <p>Notifications par Email</p>
                  <p className="text-sm text-gray-500">Envoyer les alertes par email aux parents</p>
                </div>
              </div>
              <Switch
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-green-600" />
                <div>
                  <p>Notifications par SMS</p>
                  <p className="text-sm text-gray-500">Envoyer les alertes par SMS aux parents</p>
                </div>
              </div>
              <Switch
                checked={smsNotifications}
                onCheckedChange={setSmsNotifications}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-indigo-600" />
                <div>
                  <p>Notifications in-app</p>
                  <p className="text-sm text-gray-500">Afficher les alertes dans l'application</p>
                </div>
              </div>
              <Switch
                checked={inAppNotifications}
                onCheckedChange={setInAppNotifications}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Other Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Autres Paramètres</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="space-y-1">
              <Label>Alertes de retard répétés</Label>
              <p className="text-sm text-gray-500">
                Alerter après 3 retards consécutifs
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="space-y-1">
              <Label>Rapport mensuel automatique</Label>
              <p className="text-sm text-gray-500">
                Générer et envoyer un rapport mensuel aux parents
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} size="lg">
          Enregistrer les paramètres
        </Button>
      </div>
    </div>
  );
}
