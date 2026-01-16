import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import {
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

interface AbsenceDeclarationProps {
  teacherId: string;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

type SeanceInfo = {
  id_seance: number;
  matiere: string;
  classe: string;
  horaire: string;
};

type HistoriqueAbsence = {
  id_remplacement: number;
  date_absence: string;
  raison: string;
  statut: string;
  nb_seances: number;
  date_demande: string;
};

export default function AbsenceDeclaration({
  teacherId,
}: AbsenceDeclarationProps) {
  const token = localStorage.getItem("token");

  // Form states
  const [absenceDate, setAbsenceDate] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Data states
  const [seancesConcernees, setSeancesConcernees] = useState<SeanceInfo[]>([]);
  const [historique, setHistorique] = useState<HistoriqueAbsence[]>([]);

  // Charger séances du jour sélectionné
  useEffect(() => {
    if (absenceDate) {
      loadSeancesJour();
    } else {
      setSeancesConcernees([]);
    }
  }, [absenceDate]);

  // Charger historique au mount
  useEffect(() => {
    loadHistorique();
  }, []);

  const loadSeancesJour = async () => {
    try {
      setLoading(true);

      // 1. Récupérer id_enseignant
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const id_utilisateur = user?.id || user?.id_utilisateur;

      const ensRes = await axios.get(`${API_URL}/enseignants`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const enseignants = ensRes.data?.data || [];
      const enseignant = enseignants.find(
        (e: any) => e.id_utilisateur === id_utilisateur
      );

      if (!enseignant) {
        toast.error("Profil enseignant non trouvé");
        setSeancesConcernees([]);
        return;
      }

      const id_enseignant = enseignant.id_enseignant;

      // 2. Charger séances du jour
      const res = await axios.get(
        `${API_URL}/emploi-temps/enseignant/${id_enseignant}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.data?.success) {
        setSeancesConcernees([]);
        return;
      }

      const all = res.data.data || [];

      // Filtrer par date sélectionnée + statut "prevue"
      const filtered = all.filter((s: any) => {
        const dateSeance = s.date_seance.split("T")[0];
        return dateSeance === absenceDate && s.statut === "prevue";
      });

      const mapped: SeanceInfo[] = filtered.map((s: any) => ({
        id_seance: s.id_seance,
        matiere: s.nom_matiere || "Cours",
        classe: s.nom_classe || "N/A",
        horaire: `${s.heure_debut?.slice(0, 5) || s.heure_debut} - ${
          s.heure_fin?.slice(0, 5) || s.heure_fin
        }`,
      }));

      setSeancesConcernees(mapped);

      if (mapped.length === 0) {
        toast.info("Aucune séance prévue ce jour-là");
      }
    } catch (error: any) {
      console.error("❌ Erreur chargement séances:", error);
      toast.error("Erreur chargement séances");
      setSeancesConcernees([]);
    } finally {
      setLoading(false);
    }
  };

  const loadHistorique = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const id_utilisateur = user?.id || user?.id_utilisateur;

      // Récupérer id_enseignant
      const ensRes = await axios.get(`${API_URL}/enseignants`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const enseignants = ensRes.data?.data || [];
      const enseignant = enseignants.find(
        (e: any) => e.id_utilisateur === id_utilisateur
      );

      if (!enseignant) return;

      const id_enseignant = enseignant.id_enseignant;

      // Charger historique (toutes demandes, pas que "en attente")
      const res = await axios.get(
        `${API_URL}/remplacements/historique/${id_enseignant}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data?.success) {
        setHistorique(res.data.data || []);
      }
    } catch (error: any) {
      // Endpoint peut ne pas exister, on ignore silencieusement
      console.log("Historique non disponible");
    }
  };

  const handleDeclareAbsence = async () => {
    if (!absenceDate || !reason.trim()) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    if (seancesConcernees.length === 0) {
      toast.error("Aucune séance à annuler ce jour-là");
      return;
    }

    // Confirmation
    const confirmed = window.confirm(
      `⚠️ CONFIRMATION D'ABSENCE\n\n` +
        `Date: ${new Date(absenceDate).toLocaleDateString("fr-FR")}\n` +
        `Séances concernées: ${seancesConcernees.length}\n\n` +
        `${seancesConcernees
          .map((s) => `• ${s.horaire} - ${s.matiere} (${s.classe})`)
          .join("\n")}\n\n` +
        `Ces séances seront marquées ANNULÉES et l'administration sera notifiée.\n\n` +
        `Confirmer ?`
    );

    if (!confirmed) return;

    try {
      setSubmitting(true);

      const res = await axios.post(
        `${API_URL}/remplacements/demander`,
        {
          date_absence: absenceDate,
          raison: reason,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.data?.success) {
        toast.error(res.data?.message || "Erreur lors de la déclaration");
        return;
      }

      toast.success("✅ Absence déclarée avec succès", {
        description: `${seancesConcernees.length} séance(s) annulée(s). L'administration va chercher des remplaçants.`,
        duration: 6000,
      });

      // Reset form
      setAbsenceDate("");
      setReason("");
      setSeancesConcernees([]);

      // Recharger historique
      loadHistorique();
    } catch (error: any) {
      console.error("❌ Erreur déclaration:", error);
      toast.error(error?.response?.data?.message || "Erreur serveur");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h2 className='text-2xl'>Déclarer une Absence</h2>
        <p className='text-gray-500'>
          Signaler votre indisponibilité pour vos cours
        </p>
      </div>

      {/* Declaration Form */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <AlertCircle className='h-5 w-5 text-orange-600' />
              Nouvelle Déclaration
            </CardTitle>
            <CardDescription>
              Remplissez le formulaire pour déclarer votre absence
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='absence-date'>Date d'absence *</Label>
              <div className='flex items-center gap-2'>
                <Calendar className='h-4 w-4 text-gray-400' />
                <Input
                  id='absence-date'
                  type='date'
                  value={absenceDate}
                  onChange={(e) => setAbsenceDate(e.target.value)}
                  className='flex-1'
                  min={new Date().toISOString().split("T")[0]}
                  disabled={submitting}
                />
              </div>
            </div>

            {/* ⭐ Séances concernées */}
            {loading && (
              <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                <div className='flex items-center gap-2'>
                  <Loader2 className='h-4 w-4 animate-spin text-blue-600' />
                  <p className='text-sm text-blue-800'>
                    Chargement des séances...
                  </p>
                </div>
              </div>
            )}

            {!loading && seancesConcernees.length > 0 && (
              <div className='bg-orange-50 border border-orange-200 rounded-lg p-4'>
                <p className='text-sm font-semibold text-orange-900 mb-2'>
                  📅 {seancesConcernees.length} séance(s) seront annulée(s) :
                </p>
                <div className='space-y-2'>
                  {seancesConcernees.map((s, idx) => (
                    <div
                      key={idx}
                      className='bg-white rounded p-2 text-xs'
                    >
                      <div className='flex items-center gap-2'>
                        <Clock className='h-3 w-3 text-orange-600' />
                        <span className='font-medium'>{s.horaire}</span>
                        <span className='text-gray-500'>•</span>
                        <span>{s.matiere}</span>
                        <span className='text-gray-500'>•</span>
                        <span className='text-gray-600'>{s.classe}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!loading && absenceDate && seancesConcernees.length === 0 && (
              <div className='bg-gray-50 border border-gray-200 rounded-lg p-4'>
                <p className='text-sm text-gray-600'>
                  Aucune séance prévue ce jour-là
                </p>
              </div>
            )}

            <div className='space-y-2'>
              <Label htmlFor='reason'>Motif de l'absence *</Label>
              <Textarea
                id='reason'
                placeholder='Expliquez la raison de votre absence...'
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                disabled={submitting}
              />
            </div>

            <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
              <p className='text-sm text-blue-800'>
                <strong>Procédure :</strong> Après votre déclaration, toutes vos
                séances du jour seront marquées <strong>ANNULÉES</strong>.
                L'administration recevra une notification et pourra assigner des
                remplaçants disponibles.
              </p>
            </div>

            <Button
              onClick={handleDeclareAbsence}
              className='w-full'
              size='lg'
              disabled={
                submitting ||
                !absenceDate ||
                !reason.trim() ||
                seancesConcernees.length === 0
              }
            >
              {submitting ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Déclaration en cours...
                </>
              ) : (
                "Déclarer l'Absence"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Absence History */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <CheckCircle2 className='h-5 w-5 text-green-600' />
              Historique des Absences
            </CardTitle>
            <CardDescription>Vos absences déclarées</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {historique.map((absence) => {
                const date = new Date(absence.date_absence);
                const dateDemande = new Date(absence.date_demande);

                return (
                  <div
                    key={absence.id_remplacement}
                    className='p-4 bg-gray-50 rounded-lg border'
                  >
                    <div className='flex items-start justify-between mb-2'>
                      <div className='flex items-center gap-2'>
                        <Calendar className='h-4 w-4 text-gray-400' />
                        <span className='text-sm font-medium'>
                          {date.toLocaleDateString("fr-FR", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <Badge
                        variant={
                          absence.statut === "accepte"
                            ? "default"
                            : absence.statut === "refuse"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {absence.statut === "accepte"
                          ? "✅ Remplacé"
                          : absence.statut === "refuse"
                          ? "❌ Refusé"
                          : "⏳ En attente"}
                      </Badge>
                    </div>
                    <p className='text-sm text-gray-600 mt-2'>
                      <strong>Motif:</strong> {absence.raison}
                    </p>
                    <p className='text-xs text-gray-500 mt-1'>
                      {absence.nb_seances} séance(s) concernée(s) • Déclaré le{" "}
                      {dateDemande.toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                );
              })}

              {historique.length === 0 && (
                <div className='text-center py-12 text-gray-400'>
                  <AlertCircle className='h-12 w-12 mx-auto mb-2 opacity-20' />
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
          <ul className='space-y-2 text-sm text-gray-600'>
            <li className='flex items-start gap-2'>
              <span className='text-green-600 mt-1'>•</span>
              <span>
                Déclarez votre absence <strong>le plus tôt possible</strong>{" "}
                pour faciliter l'organisation des remplacements
              </span>
            </li>
            <li className='flex items-start gap-2'>
              <span className='text-green-600 mt-1'>•</span>
              <span>
                Fournissez un <strong>motif clair et précis</strong> pour votre
                absence
              </span>
            </li>
            <li className='flex items-start gap-2'>
              <span className='text-green-600 mt-1'>•</span>
              <span>
                Vérifiez votre emploi du temps pour voir si un remplaçant a été
                assigné
              </span>
            </li>
            <li className='flex items-start gap-2'>
              <span className='text-green-600 mt-1'>•</span>
              <span>
                En cas d'absence prolongée, contactez l'administration
                directement
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
