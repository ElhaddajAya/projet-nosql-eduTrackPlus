import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { MapPin, User, ChevronLeft, ChevronRight } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

interface StudentScheduleProps {
  studentId: string;
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

const STATUS_EMOJI: Record<string, string> = {
  normal: "📚",
  cancelled: "❌",
  postponed: "⏭️",
  makeup: "📝",
  replaced: "🔄",
};

type ApiSeance = {
  id_seance: number;
  date_seance: string;
  heure_debut: string;
  heure_fin: string;
  id_salle: number | string;
  statut: "prevue" | "remplacee" | "reportee" | "annulee" | "rattrapage";
  nom_classe?: string;
  nom_matiere?: string;
  prof_prenom?: string;
  prof_nom?: string;
  remplacant_prenom?: string;
  remplacant_nom?: string;
  date_report?: string;
};

type UISession = {
  id: string;
  day: (typeof DAYS)[number];
  startTime: string;
  endTime: string;
  subject: string;
  room: string;
  status: "normal" | "cancelled" | "postponed" | "makeup" | "replaced";
  teacherName: string;
  replacementTeacherName?: string | null;
  postponedTo?: string | null;
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
  const dateStr = isoDate.split("T")[0];
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  const js = d.getUTCDay();

  if (js === 1) return "monday";
  if (js === 2) return "tuesday";
  if (js === 3) return "wednesday";
  if (js === 4) return "thursday";
  if (js === 5) return "friday";

  console.warn(`⚠️ Séance sur un weekend détectée: ${dateStr} (jour ${js})`);
  return "monday";
};

export default function StudentSchedule({ studentId }: StudentScheduleProps) {
  const token = localStorage.getItem("token");
  const [loading, setLoading] = useState(false);
  const [className, setClassName] = useState<string>("");
  const [uiSessions, setUiSessions] = useState<UISession[]>([]);

  // ⭐ AJOUT : Navigation semaine
  const [weekDate, setWeekDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const changeWeek = (offset: number) => {
    const d = new Date(weekDate);
    d.setDate(d.getDate() + offset * 7);
    setWeekDate(d.toISOString().split("T")[0]);
  };

  const weekRange = useMemo(() => {
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

  const getSessionsByDay = (day: string) => {
    return uiSessions
      .filter((s) => s.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const totalSessions = uiSessions.length;
  const normalSessions = uiSessions.filter((s) => s.status === "normal").length;
  const modifiedSessions = uiSessions.filter(
    (s) => s.status !== "normal"
  ).length;

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true);

        let idClasse = null;

        try {
          const meRes = await axios.get(`${API_URL}/etudiants/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (meRes.data?.success) {
            idClasse = meRes.data.data.id_classe;
            console.log("✅ ID Classe récupéré:", idClasse);
          }
        } catch (error) {
          console.error("❌ Erreur /me:", error);
          toast.error("Impossible de récupérer ton profil étudiant");
          setUiSessions([]);
          setLoading(false);
          return;
        }

        if (!idClasse) {
          toast.error("Tu n'es pas assigné à une classe");
          setUiSessions([]);
          setLoading(false);
          return;
        }

        const res = await axios.get(
          `${API_URL}/emploi-temps/classe/${idClasse}`,
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
        setClassName(all[0]?.nom_classe || "");

        // ⭐ FILTRER PAR SEMAINE
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
          room: String(s.id_salle),
          status: mapBackendStatusToUI(s.statut),
          teacherName:
            `${s.prof_prenom || ""} ${s.prof_nom || ""}`.trim() || "N/A",
          // ⭐ AJOUT : Nom remplaçant
          replacementTeacherName:
            s.remplacant_prenom && s.remplacant_nom
              ? `${s.remplacant_prenom} ${s.remplacant_nom}`.trim()
              : null,
          // ⭐ AJOUT : Date report
          postponedTo: s.date_report || null,
        }));

        setUiSessions(mapped);
      } catch (e: any) {
        console.error(e);
        toast.error(
          e?.response?.data?.message ||
            "Erreur serveur (emploi du temps étudiant)"
        );
        setUiSessions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [token, weekRange]);

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-2xl'>Mon Emploi du Temps</h2>
        <p className='text-gray-500'>
          Mes cours de la semaine - {className || "..."}
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Card className='bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-blue-700'>Total Cours</p>
                <p className='text-3xl text-blue-600'>{totalSessions}</p>
              </div>
              <div className='text-3xl'>📚</div>
            </div>
          </CardContent>
        </Card>

        <Card className='bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-green-700'>Cours Normaux</p>
                <p className='text-3xl text-green-600'>{normalSessions}</p>
              </div>
              <div className='text-3xl'>✅</div>
            </div>
          </CardContent>
        </Card>

        <Card className='bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200'>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-orange-700'>Modifications</p>
                <p className='text-3xl text-orange-600'>{modifiedSessions}</p>
              </div>
              <div className='text-3xl'>🔄</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>Légende des couleurs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-wrap gap-4'>
            <div className='flex items-center gap-2'>
              <div className='w-4 h-4 bg-white border-2 border-gray-200 rounded'></div>
              <span className='text-sm'>📚 Séance normale</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-4 h-4 bg-red-50 border-2 border-red-300 rounded'></div>
              <span className='text-sm'>❌ Séance annulée</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-4 h-4 bg-green-50 border-2 border-green-300 rounded'></div>
              <span className='text-sm'>⏭️ Séance reportée</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-4 h-4 bg-purple-50 border-2 border-purple-300 rounded'></div>
              <span className='text-sm'>📝 Séance de rattrapage</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-4 h-4 bg-blue-50 border-2 border-blue-300 rounded'></div>
              <span className='text-sm'>🔄 Professeur remplaçant</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>Emploi du temps de la semaine</CardTitle>
              <CardDescription>
                Du {weekRange.monday} au {weekRange.friday}
              </CardDescription>
            </div>

            {/* ✅ Navigation semaine */}
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='icon'
                onClick={() => changeWeek(-1)}
              >
                <ChevronLeft className='h-4 w-4' />
              </Button>

              <Input
                type='date'
                className='w-44'
                value={weekDate}
                onChange={(e) => setWeekDate(e.target.value)}
              />

              <Button
                variant='outline'
                size='icon'
                onClick={() => changeWeek(1)}
              >
                <ChevronRight className='h-4 w-4' />
              </Button>
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
                    <div className='text-center pb-2 border-b border-indigo-200'>
                      <h3 className='text-indigo-700 font-semibold'>
                        {DAY_LABELS[day]}
                      </h3>
                      <p className='text-xs text-gray-500'>
                        {daySessions.length} cours
                      </p>
                    </div>

                    <div className='space-y-2'>
                      {daySessions.map((session) => (
                        <div
                          key={session.id}
                          className={`p-3 rounded-lg border-2 ${
                            STATUS_COLORS[session.status]
                          } hover:shadow-lg transition-all`}
                        >
                          <div className='flex items-start justify-between mb-2'>
                            <div className='flex items-center gap-2'>
                              <span className='text-lg'>
                                {STATUS_EMOJI[session.status]}
                              </span>
                              <div className='text-sm font-medium text-indigo-700'>
                                {session.startTime} - {session.endTime}
                              </div>
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
                            <p className='font-medium'>{session.subject}</p>
                            <div className='flex items-center gap-1 text-xs text-gray-600 mt-2'>
                              <User className='h-3 w-3' />
                              {session.teacherName}
                            </div>

                            {session.status === "replaced" &&
                              session.replacementTeacherName && (
                                <p className='text-xs text-blue-600 mt-1 font-medium'>
                                  🔄 Remplacé par{" "}
                                  {session.replacementTeacherName}
                                </p>
                              )}
                          </div>

                          <div className='flex items-center gap-1 mt-2 text-xs text-gray-500'>
                            <MapPin className='h-3 w-3' />
                            {session.room}
                          </div>

                          {session.status === "postponed" &&
                            session.postponedTo && (
                              <div className='mt-2 p-2 bg-green-100 rounded text-xs text-green-700 font-medium'>
                                ⏭️ Reporté au{" "}
                                {new Date(
                                  session.postponedTo
                                ).toLocaleDateString("fr-FR")}
                              </div>
                            )}
                        </div>
                      ))}

                      {daySessions.length === 0 && (
                        <div className='text-center py-8 text-gray-400 text-sm'>
                          😴 Pas de cours
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
