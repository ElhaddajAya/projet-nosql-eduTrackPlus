import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  AlertCircle,
  Calendar,
  Clock,
  User,
  ArrowRight,
  X,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

type DemandeRemplacement = {
  id_remplacement: number;
  id_seance: number;
  date_absence: string;
  raison: string;
  date_seance: string;
  heure_debut: string;
  heure_fin: string;
  id_salle: string;
  nom_matiere: string;
  nom_classe: string;
  absent_prenom: string;
  absent_nom: string;
  date_demande: string;
};

interface ReplacementNotificationsProps {
  onClose?: () => void;
  onViewSchedule?: (seanceId: number) => void;
}

export default function ReplacementNotifications({
  onClose,
  onViewSchedule,
}: ReplacementNotificationsProps) {
  const token = localStorage.getItem("token");
  const [demandes, setDemandes] = useState<DemandeRemplacement[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDemandes();
  }, []);

  const loadDemandes = async () => {
    try {
      setLoading(true);

      const res = await axios.get(`${API_URL}/remplacements/en-attente`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.data?.success) {
        toast.error("Erreur chargement demandes");
        return;
      }

      const all = res.data.data || [];

      // ⭐ Filtrer UNIQUEMENT les demandes d'AUJOURD'HUI
      const aujourdhui = new Date().toISOString().split("T")[0];

      const aujourdhuiDemandes = all.filter((d: DemandeRemplacement) => {
        const dateSeance = d.date_seance.split("T")[0];
        return dateSeance === aujourdhui;
      });

      setDemandes(aujourdhuiDemandes);
    } catch (error: any) {
      console.error("❌ Erreur:", error);
      toast.error("Erreur serveur");
    } finally {
      setLoading(false);
    }
  };

  const handleViewSchedule = (seanceId: number) => {
    if (onViewSchedule) {
      onViewSchedule(seanceId);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className='py-12 text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto'></div>
          <p className='text-gray-500 mt-4'>Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='border-orange-300 shadow-lg'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='flex items-center gap-2'>
              <AlertCircle className='h-5 w-5 text-orange-600' />
              Demandes de Remplacement - Aujourd'hui
            </CardTitle>
            <CardDescription>
              {demandes.length} demande(s) en attente pour aujourd'hui
            </CardDescription>
          </div>
          {onClose && (
            <Button
              variant='ghost'
              size='icon'
              onClick={onClose}
            >
              <X className='h-4 w-4' />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {demandes.length === 0 ? (
          <div className='text-center py-8 text-gray-500'>
            <Calendar className='h-12 w-12 mx-auto mb-2 opacity-20' />
            <p className='font-medium'>Aucune demande pour aujourd'hui</p>
            <p className='text-sm mt-1'>Toutes les séances sont couvertes</p>
          </div>
        ) : (
          <div className='space-y-4'>
            {demandes.map((demande) => {
              const date = new Date(demande.date_seance);
              const dateDemande = new Date(demande.date_demande);

              return (
                <div
                  key={demande.id_remplacement}
                  className='bg-orange-50 border-2 border-orange-300 rounded-lg p-4 hover:shadow-md transition-shadow'
                >
                  <div className='flex items-start justify-between mb-3'>
                    <div className='flex items-center gap-2'>
                      <User className='h-4 w-4 text-orange-600' />
                      <span className='font-semibold text-orange-900'>
                        {demande.absent_prenom} {demande.absent_nom}
                      </span>
                    </div>
                    <Badge className='bg-orange-200 text-orange-800 border-orange-400'>
                      ⏳ En attente
                    </Badge>
                  </div>

                  <div className='space-y-2 text-sm'>
                    <div className='flex items-center gap-2 text-gray-700'>
                      <Calendar className='h-4 w-4' />
                      <span>
                        {date.toLocaleDateString("fr-FR", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <div className='flex items-center gap-2 text-gray-700'>
                      <Clock className='h-4 w-4' />
                      <span>
                        {demande.heure_debut?.slice(0, 5)} -{" "}
                        {demande.heure_fin?.slice(0, 5)}
                      </span>
                      <span className='text-gray-500'>•</span>
                      <span className='font-medium'>{demande.nom_matiere}</span>
                      <span className='text-gray-500'>•</span>
                      <span>{demande.nom_classe}</span>
                    </div>

                    <div className='bg-white rounded p-2 mt-2'>
                      <p className='text-xs text-gray-600'>
                        <strong>Motif :</strong> {demande.raison}
                      </p>
                    </div>

                    <p className='text-xs text-gray-500 mt-2'>
                      Déclaré le {dateDemande.toLocaleDateString("fr-FR")} à{" "}
                      {dateDemande.toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  <div className='mt-4 pt-3 border-t border-orange-200'>
                    <Button
                      onClick={() => handleViewSchedule(demande.id_seance)}
                      className='w-full bg-orange-600 hover:bg-orange-700'
                      size='sm'
                    >
                      Assigner un remplaçant
                      <ArrowRight className='ml-2 h-4 w-4' />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
