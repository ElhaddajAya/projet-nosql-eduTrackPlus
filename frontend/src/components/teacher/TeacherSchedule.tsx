import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  Clock,
  MapPin,
  Users,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

interface TeacherScheduleProps {
  teacherId: string;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"] as const;
const DAY_LABELS: Record<string, string> = {
  monday: "Lundi",
  tuesday: "Mardi",
  wednesday: "Mercredi",
  thursday: "Jeudi",
  friday: "Vendredi",
};

const STATUS_COLORS: Record<string, string> = {
  normal: "bg-white border-gray-200",
  cancelled: "bg-red-50 border-red-300",
  postponed: "bg-green-50 border-green-300",
  makeup: "bg-purple-50 border-purple-300",
  replaced: "bg-blue-50 border-blue-300",
};

const STATUS_LABELS: Record<string, string> = {
  normal: "Normale",
  cancelled: "Annulée",
  postponed: "Reportée",
  makeup: "Rattrapage",
  replaced: "Remplacée",
};

type ApiSeance = {
  id_seance: number;
  date_seance: string;
  heure_debut: string;
  heure_fin: string;
  id_salle: number;
  statut: "prevue" | "remplacee" | "reportee" | "annulee" | "rattrapage";
  code_couleur?: string;
  nom_classe?: string;
  nom_matiere?: string;
};

type UISession = {
  id: string;
  day: (typeof DAYS)[number];
  startTime: string;
  endTime: string;
  subject: string;
  room: string;
  status: "normal" | "cancelled" | "postponed" | "makeup" | "replaced";
  className: string;
  postponedTo?: string | null;
  isReplacement?: boolean;
};

const mapBackendStatusToUI = (s: ApiSeance["statut"]): UISession["status"] => {
  switch (s) {
    case "annulee":
      return "cancelled";
    case "reportee":
      return "postponed";
    case "rattrapage":
      return "makeup";
    case "remplacee":
      return "replaced";
    case "prevue":
    default:
      return "normal";
  }
};

const getDayKey = (isoDate: string): UISession["day"] => {
  const d = new Date(isoDate);
  const js = d.getDay(); // 0 Sun ... 6 Sat
  if (js === 1) return "monday";
  if (js === 2) return "tuesday";
  if (js === 3) return "wednesday";
  if (js === 4) return "thursday";
  return "friday";
};

export default function TeacherSchedule({ teacherId }: TeacherScheduleProps) {
  const [weekDate, setWeekDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);
  const [uiSessions, setUiSessions] = useState<UISession[]>([]);

  const token = localStorage.getItem("token");

  const changeWeek = (offset: number) => {
    const d = new Date(weekDate);
    d.setDate(d.getDate() + offset * 7);
    setWeekDate(d.toISOString().split("T")[0]);
  };

  const weekRange = useMemo(() => {
    // Monday -> Friday range based on weekDate
    const base = new Date(weekDate);
    const day = base.getDay();
    const diffToMonday = (day === 0 ? -6 : 1) - day;
    const monday = new Date(base);
    monday.setDate(base.getDate() + diffToMonday);
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    const toIso = (x: Date) => x.toISOString().split("T")[0];
    return { monday: toIso(monday), friday: toIso(friday) };
  }, [weekDate]);

  useEffect(() => {
    const fetchTeacherSchedule = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `${API_URL}/emploi-temps/enseignant/${teacherId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.data?.success) {
          toast.error("Erreur chargement emploi du temps");
          setUiSessions([]);
          return;
        }

        const all: ApiSeance[] = res.data.data || [];
        // filtrer semaine
        const filtered = all.filter((s) => {
          const d = s.date_seance.split("T")[0];
          return d >= weekRange.monday && d <= weekRange.friday;
        });

        const mapped: UISession[] = filtered.map((s) => ({
          id: String(s.id_seance),
          day: getDayKey(s.date_seance),
          startTime: s.heure_debut?.slice(0, 5) || s.heure_debut,
          endTime: s.heure_fin?.slice(0, 5) || s.heure_fin,
          subject: s.nom_matiere || "Cours",
          room: `Room ${s.id_salle}`,
          status: mapBackendStatusToUI(s.statut),
          className: s.nom_classe || "N/A",
          // si tu ajoutes date_report en backend, tu peux la mapper ici
          postponedTo: null,
          isReplacement: s.statut === "remplacee",
        }));

        setUiSessions(mapped);
      } catch (e: any) {
        console.error(e);
        toast.error(
          e?.response?.data?.message ||
            "Erreur serveur (emploi du temps enseignant)"
        );
        setUiSessions([]);
      } finally {
        setLoading(false);
      }
    };

    if (teacherId) fetchTeacherSchedule();
  }, [teacherId, token, weekRange]);

  const getSessionsByDay = (day: string) => {
    return uiSessions
      .filter((s) => s.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const totalSessions = uiSessions.length;
  const uniqueClasses = [...new Set(uiSessions.map((s) => s.className))].length;

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h2 className='text-2xl'>Mon Emploi du Temps</h2>
        <p className='text-gray-500'>Mes cours de la semaine</p>
      </div>

      {/* Summary Cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-500'>Total Cours</p>
                <p className='text-2xl'>{totalSessions}</p>
              </div>
              <Clock className='h-8 w-8 text-green-600' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-500'>Classes Enseignées</p>
                <p className='text-2xl'>{uniqueClasses}</p>
              </div>
              <Users className='h-8 w-8 text-blue-600' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-500'>Heures / Semaine</p>
                <p className='text-2xl'>{totalSessions * 2}h</p>
              </div>
              <Clock className='h-8 w-8 text-indigo-600' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>Légende des couleurs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-wrap gap-4'>
            <div className='flex items-center gap-2'>
              <div className='w-4 h-4 bg-white border-2 border-gray-200 rounded'></div>
              <span className='text-sm'>Séance normale</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-4 h-4 bg-red-50 border-2 border-red-300 rounded'></div>
              <span className='text-sm'>Séance annulée</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-4 h-4 bg-green-50 border-2 border-green-300 rounded'></div>
              <span className='text-sm'>Séance reportée</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-4 h-4 bg-purple-50 border-2 border-purple-300 rounded'></div>
              <span className='text-sm'>Séance de rattrapage</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-4 h-4 bg-blue-50 border-2 border-blue-300 rounded'></div>
              <span className='text-sm'>Professeur remplaçant</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Schedule */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle>Mes cours de la semaine</CardTitle>
            <div className='flex items-center gap-2'>
              <button
                className='border rounded p-2'
                onClick={() => changeWeek(-1)}
              >
                <ChevronLeft className='h-4 w-4' />
              </button>
              <div className='flex items-center gap-2 text-sm'>
                <Calendar className='h-4 w-4 text-gray-500' />
                <input
                  type='date'
                  value={weekDate}
                  onChange={(e) => setWeekDate(e.target.value)}
                  className='border rounded px-2 py-1'
                />
              </div>
              <button
                className='border rounded p-2'
                onClick={() => changeWeek(1)}
              >
                <ChevronRight className='h-4 w-4' />
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className='text-center py-8 text-gray-400 text-sm'>
              Chargement...
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
              {DAYS.map((day) => {
                const daySessions = getSessionsByDay(day);

                return (
                  <div
                    key={day}
                    className='space-y-3'
                  >
                    <div className='text-center pb-2 border-b'>
                      <h3>{DAY_LABELS[day]}</h3>
                      <p className='text-xs text-gray-500'>
                        {daySessions.length} cours
                      </p>
                    </div>

                    <div className='space-y-2'>
                      {daySessions.map((session) => {
                        return (
                          <div
                            key={session.id}
                            className={`p-3 rounded-lg border-2 ${
                              STATUS_COLORS[session.status]
                            } hover:shadow-md transition-shadow`}
                          >
                            <div className='flex items-start justify-between mb-2'>
                              <div className='text-sm text-green-700'>
                                {session.startTime} - {session.endTime}
                              </div>
                              {session.status !== "normal" && (
                                <Badge
                                  variant='outline'
                                  className='text-xs'
                                >
                                  {STATUS_LABELS[session.status]}
                                </Badge>
                              )}
                            </div>

                            <div>
                              <p>{session.subject}</p>
                              <p className='text-xs text-gray-600 mt-1'>
                                {session.className}
                              </p>

                              {session.isReplacement && (
                                <Badge
                                  variant='secondary'
                                  className='text-xs mt-2'
                                >
                                  Remplacement
                                </Badge>
                              )}
                            </div>

                            <div className='flex items-center gap-1 mt-2 text-xs text-gray-500'>
                              <MapPin className='h-3 w-3' />
                              {session.room}
                            </div>

                            {session.postponedTo && (
                              <p className='text-xs text-green-600 mt-2'>
                                Reportée au{" "}
                                {new Date(
                                  session.postponedTo
                                ).toLocaleDateString("fr-FR")}
                              </p>
                            )}
                          </div>
                        );
                      })}

                      {daySessions.length === 0 && (
                        <div className='text-center py-8 text-gray-400 text-sm'>
                          Pas de cours
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
