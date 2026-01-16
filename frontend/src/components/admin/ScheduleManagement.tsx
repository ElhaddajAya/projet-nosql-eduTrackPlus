import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  Plus,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Users,
  UserCheck,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

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

type SessionUI = {
  id: string;
  classId: string;
  day: (typeof DAYS)[number];
  startTime: string;
  endTime: string;
  subject: string;
  room: string;
  status: "normal" | "cancelled" | "postponed" | "makeup" | "replaced";
  teacherName: string;
  teacherId?: string;
  replacementTeacherId?: string;
  postponedTo?: string;
  originalSessionId?: string;
  id_remplacement?: number; // ⭐ Pour lier à la demande
};

export default function ScheduleManagement() {
  const token = localStorage.getItem("token");

  // DATA
  const [classes, setClasses] = useState<any[]>([]);
  const [cours, setCours] = useState<any[]>([]);
  const [enseignants, setEnseignants] = useState<any[]>([]);
  const [sessionList, setSessionList] = useState<SessionUI[]>([]);

  // FILTERS/UI
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [selectedField, setSelectedField] = useState<string>("");
  const [selectedTeacher, setSelectedTeacher] = useState<string>(""); // ⭐ NOUVEAU
  const [viewMode, setViewMode] = useState<"class" | "teacher">("class"); // ⭐ NOUVEAU
  const [weekDate, setWeekDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // ⭐ REMPLACEMENT DIALOG
  const [replacementDialogOpen, setReplacementDialogOpen] = useState(false);
  const [selectedSeanceForReplacement, setSelectedSeanceForReplacement] =
    useState<SessionUI | null>(null);
  const [availableTeachers, setAvailableTeachers] = useState<any[]>([]);
  const [selectedReplacement, setSelectedReplacement] = useState<string>("");
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [assigningReplacement, setAssigningReplacement] = useState(false);

  const selectedClassData = useMemo(
    () => classes.find((c) => String(c.id_classe) === selectedClass),
    [classes, selectedClass]
  );

  const selectedTeacherData = useMemo(
    () => enseignants.find((e) => String(e.id_enseignant) === selectedTeacher),
    [enseignants, selectedTeacher]
  );

  const levels = useMemo(
    () => Array.from(new Set(classes.map((c) => c.niveau))),
    [classes]
  );

  const fields = useMemo(
    () =>
      Array.from(
        new Set(classes.map((c) => c.nom_filiere).filter(Boolean) as string[])
      ),
    [classes]
  );

  const filteredClasses = useMemo(() => {
    return classes.filter(
      (c) =>
        (selectedLevel ? c.niveau === selectedLevel : true) &&
        (selectedField ? c.nom_filiere === selectedField : true)
    );
  }, [classes, selectedLevel, selectedField]);

  const displayedSessions = useMemo(() => {
    if (viewMode === "class") {
      return sessionList.filter((s) => s.classId === selectedClass);
    } else {
      return sessionList.filter((s) => s.teacherId === selectedTeacher);
    }
  }, [sessionList, selectedClass, selectedTeacher, viewMode]);

  const adjustWeek = (delta: number) => {
    const d = new Date(weekDate);
    d.setDate(d.getDate() + delta * 7);
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
    return displayedSessions
      .filter((s) => s.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  // ===== FETCH CLASSES + COURS + ENSEIGNANTS =====
  useEffect(() => {
    const loadBase = async () => {
      try {
        const [rClasses, rCours, rTeachers] = await Promise.all([
          axios.get(`${API_URL}/classes`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_URL}/cours`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_URL}/enseignants`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (rClasses.data?.success) {
          const cls = rClasses.data.data || [];
          setClasses(cls);
          const first = cls[0];
          if (first && !selectedClass)
            setSelectedClass(String(first.id_classe));
        }

        if (rCours.data?.success) {
          setCours(rCours.data.data || []);
        }

        if (rTeachers.data?.success) {
          setEnseignants(rTeachers.data.data || []);
        }
      } catch (e: any) {
        console.error(e);
        toast.error("Erreur chargement données");
      }
    };

    loadBase();
  }, []);

  // ===== FETCH SESSIONS (par classe OU enseignant) =====
  useEffect(() => {
    const loadSessions = async () => {
      if (viewMode === "class" && !selectedClass) return;
      if (viewMode === "teacher" && !selectedTeacher) return;

      try {
        const endpoint =
          viewMode === "class"
            ? `${API_URL}/emploi-temps/classe/${selectedClass}`
            : `${API_URL}/emploi-temps/enseignant/${selectedTeacher}`;

        const res = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.data?.success) {
          setSessionList([]);
          return;
        }

        const all: any[] = res.data.data || [];

        const filtered = all.filter((s) => {
          const d = s.date_seance.split("T")[0];
          return d >= weekRange.monday && d <= weekRange.friday;
        });

        const mapped: SessionUI[] = filtered
          .map((s) => {
            const dayKey = getDayKey(s.date_seance);
            if (!dayKey) return null;

            return {
              id: String(s.id_seance),
              classId: String(
                viewMode === "class" ? selectedClass : s.id_classe || ""
              ),
              teacherId: String(s.id_enseignant_effectif || ""),
              day: dayKey,
              startTime: s.heure_debut?.slice(0, 5) || s.heure_debut,
              endTime: s.heure_fin?.slice(0, 5) || s.heure_fin,
              subject: s.nom_matiere || "Cours",
              room: String(s.id_salle),
              status: toUIStatus(s.statut),
              teacherName:
                `${s.prof_prenom || ""} ${s.prof_nom || ""}`.trim() || "N/A",
            };
          })
          .filter((s): s is SessionUI => s !== null);

        setSessionList(mapped);
      } catch (e: any) {
        console.error(e);
        toast.error("Erreur chargement emploi du temps");
        setSessionList([]);
      }
    };

    loadSessions();
  }, [viewMode, selectedClass, selectedTeacher, token, weekRange]);

  // ⭐ FONCTION : Ouvrir modal remplacement
  const handleFindReplacement = async (session: SessionUI) => {
    if (session.status !== "cancelled") {
      toast.error("Seulement pour séances annulées");
      return;
    }

    setSelectedSeanceForReplacement(session);
    setReplacementDialogOpen(true);
    setSelectedReplacement("");
    setLoadingTeachers(true);

    try {
      const res = await axios.get(
        `${API_URL}/remplacements/enseignants-disponibles/${session.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.data?.success) {
        toast.error("Erreur chargement remplaçants");
        setAvailableTeachers([]);
        return;
      }

      setAvailableTeachers(res.data.data || []);

      if (res.data.data.length === 0) {
        toast.warning("Aucun remplaçant disponible à ce créneau");
      }
    } catch (error: any) {
      console.error(error);
      toast.error("Erreur serveur");
      setAvailableTeachers([]);
    } finally {
      setLoadingTeachers(false);
    }
  };

  // ⭐ FONCTION : Assigner remplacement
  const handleAssignReplacement = async () => {
    if (!selectedReplacement || !selectedSeanceForReplacement) {
      toast.error("Sélectionnez un remplaçant");
      return;
    }

    // Trouver la demande de remplacement
    try {
      setAssigningReplacement(true);

      // Récupérer la demande
      const demandesRes = await axios.get(
        `${API_URL}/remplacements/en-attente`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!demandesRes.data?.success) {
        toast.error("Erreur récupération demande");
        return;
      }

      const demande = (demandesRes.data.data || []).find(
        (d: any) => String(d.id_seance) === selectedSeanceForReplacement.id
      );

      if (!demande) {
        toast.error("Demande de remplacement non trouvée");
        return;
      }

      // Accepter le remplacement
      const res = await axios.post(
        `${API_URL}/remplacements/${demande.id_remplacement}/accepter`,
        {
          id_enseignant_remplacant: Number(selectedReplacement),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.data?.success) {
        toast.error(res.data?.message || "Erreur assignation");
        return;
      }

      toast.success("✅ Remplaçant assigné avec succès !");

      setReplacementDialogOpen(false);

      // Recharger emploi du temps
      setTimeout(() => {
        if (viewMode === "class" && selectedClass) {
          window.location.reload();
        } else if (viewMode === "teacher" && selectedTeacher) {
          window.location.reload();
        }
      }, 500);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Erreur serveur");
    } finally {
      setAssigningReplacement(false);
    }
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl'>Emplois du Temps</h2>
          <p className='text-gray-500'>
            Gérer les horaires et attributions des cours
          </p>
        </div>
      </div>

      {/* ⭐ MODE SELECTION */}
      <Card>
        <CardContent className='pt-6'>
          <div className='flex items-center gap-4 mb-4'>
            <Label>Vue :</Label>
            <Button
              variant={viewMode === "class" ? "default" : "outline"}
              onClick={() => {
                setViewMode("class");
                setSelectedTeacher("");
              }}
            >
              <Users className='mr-2 h-4 w-4' />
              Par Classe
            </Button>
            <Button
              variant={viewMode === "teacher" ? "default" : "outline"}
              onClick={() => {
                setViewMode("teacher");
                setSelectedClass("");
              }}
            >
              <UserCheck className='mr-2 h-4 w-4' />
              Par Enseignant
            </Button>
          </div>

          <div className='flex flex-wrap items-center gap-4'>
            {viewMode === "class" ? (
              <>
                <div className='flex items-center gap-2'>
                  <Label>Niveau:</Label>
                  <Select
                    value={selectedLevel}
                    onValueChange={setSelectedLevel}
                  >
                    <SelectTrigger className='w-40'>
                      <SelectValue placeholder='Tous' />
                    </SelectTrigger>
                    <SelectContent>
                      {levels.map((l) => (
                        <SelectItem
                          key={l}
                          value={l}
                        >
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='flex items-center gap-2'>
                  <Label>Filière:</Label>
                  <Select
                    value={selectedField}
                    onValueChange={setSelectedField}
                  >
                    <SelectTrigger className='w-40'>
                      <SelectValue placeholder='Toutes' />
                    </SelectTrigger>
                    <SelectContent>
                      {fields.map((f) => (
                        <SelectItem
                          key={f}
                          value={f}
                        >
                          {f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='flex items-center gap-2'>
                  <Label>Classe:</Label>
                  <Select
                    value={selectedClass}
                    onValueChange={setSelectedClass}
                  >
                    <SelectTrigger className='w-64'>
                      <SelectValue placeholder='Sélectionner' />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredClasses.map((cls) => (
                        <SelectItem
                          key={cls.id_classe}
                          value={String(cls.id_classe)}
                        >
                          {cls.nom_classe}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedClassData && (
                    <Badge variant='secondary'>
                      ✓ {selectedClassData.nom_classe}
                    </Badge>
                  )}
                </div>
              </>
            ) : (
              <div className='flex items-center gap-2'>
                <Label>Enseignant:</Label>
                <Select
                  value={selectedTeacher}
                  onValueChange={setSelectedTeacher}
                >
                  <SelectTrigger className='w-80'>
                    <SelectValue placeholder='Sélectionner' />
                  </SelectTrigger>
                  <SelectContent>
                    {enseignants.map((ens) => (
                      <SelectItem
                        key={ens.id_enseignant}
                        value={String(ens.id_enseignant)}
                      >
                        {ens.prenom} {ens.nom} - {ens.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedTeacherData && (
                  <Badge variant='secondary'>
                    ✓ {selectedTeacherData.prenom} {selectedTeacherData.nom}
                  </Badge>
                )}
              </div>
            )}

            <div className='flex items-center gap-2'>
              <Label>Semaine:</Label>
              <Button
                variant='outline'
                size='icon'
                onClick={() => adjustWeek(-1)}
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
                onClick={() => adjustWeek(1)}
              >
                <ChevronRight className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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
              <span className='text-sm'>
                Séance annulée (cliquez pour assigner remplaçant)
              </span>
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

      {/* ⭐ DIALOG REMPLACEMENT */}
      <Dialog
        open={replacementDialogOpen}
        onOpenChange={setReplacementDialogOpen}
      >
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>Assigner un Remplaçant</DialogTitle>
            <DialogDescription>
              Choisir un enseignant disponible pour cette séance
            </DialogDescription>
          </DialogHeader>

          {selectedSeanceForReplacement && (
            <div className='space-y-4 py-4'>
              <div className='bg-orange-50 border border-orange-200 rounded-lg p-4'>
                <p className='text-sm font-medium text-orange-900 mb-2'>
                  📅 Séance à remplacer :
                </p>
                <div className='space-y-1 text-sm text-orange-800'>
                  <p>
                    <strong>Matière :</strong>{" "}
                    {selectedSeanceForReplacement.subject}
                  </p>
                  <p>
                    <strong>Horaire :</strong>{" "}
                    {selectedSeanceForReplacement.startTime} -{" "}
                    {selectedSeanceForReplacement.endTime}
                  </p>
                  <p>
                    <strong>Salle :</strong> {selectedSeanceForReplacement.room}
                  </p>
                </div>
              </div>

              {loadingTeachers ? (
                <div className='text-center py-4'>
                  <Loader2 className='h-6 w-6 animate-spin mx-auto text-indigo-600' />
                  <p className='text-sm text-gray-500 mt-2'>
                    Recherche des remplaçants...
                  </p>
                </div>
              ) : availableTeachers.length === 0 ? (
                <div className='text-center py-8 text-gray-500'>
                  <AlertCircle className='h-12 w-12 mx-auto mb-2 opacity-20' />
                  <p>Aucun remplaçant disponible à ce créneau</p>
                </div>
              ) : (
                <div className='space-y-2'>
                  <Label>Sélectionner un remplaçant *</Label>
                  <Select
                    value={selectedReplacement}
                    onValueChange={setSelectedReplacement}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Choisir un enseignant' />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTeachers.map((teacher) => (
                        <SelectItem
                          key={teacher.id_enseignant}
                          value={String(teacher.id_enseignant)}
                        >
                          {teacher.nom} - {teacher.type_contrat} (
                          {teacher.specialite})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <p className='text-xs text-gray-500 mt-2'>
                    {availableTeachers.length} enseignant(s) disponible(s) pour
                    ce créneau
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setReplacementDialogOpen(false)}
              disabled={assigningReplacement}
            >
              Annuler
            </Button>
            <Button
              onClick={handleAssignReplacement}
              disabled={!selectedReplacement || assigningReplacement}
            >
              {assigningReplacement && (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              )}
              {assigningReplacement ? "Attribution..." : "Assigner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Emploi du temps */}
      <Card>
        <CardHeader>
          <CardTitle>Emploi du temps de la semaine</CardTitle>
          <CardDescription>
            {viewMode === "class"
              ? selectedClassData?.nom_classe || "Aucune classe"
              : selectedTeacherData
              ? `${selectedTeacherData.prenom} ${selectedTeacherData.nom}`
              : "Aucun enseignant"}{" "}
            - Du {weekRange.monday} au {weekRange.friday}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
            {DAYS.map((day) => {
              const daySessions = getSessionsByDay(day);

              return (
                <div
                  key={day}
                  className='space-y-3'
                >
                  <div className='text-center pb-2 border-b'>
                    <h3 className='font-semibold'>{DAY_LABELS[day]}</h3>
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
                        } hover:shadow-md transition-shadow ${
                          session.status === "cancelled" ? "cursor-pointer" : ""
                        }`}
                        onClick={() => {
                          if (session.status === "cancelled") {
                            handleFindReplacement(session);
                          }
                        }}
                      >
                        <div className='flex items-start justify-between mb-2'>
                          <div className='text-sm font-medium text-indigo-700'>
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
                          <p className='font-medium'>{session.subject}</p>
                          <p className='text-xs text-gray-600 mt-1'>
                            {session.teacherName}
                          </p>
                        </div>

                        <div className='flex items-center gap-1 mt-2 text-xs text-gray-500'>
                          <MapPin className='h-3 w-3' />
                          {session.room}
                        </div>

                        {session.status === "cancelled" && (
                          <div className='mt-2 pt-2 border-t border-red-200'>
                            <p className='text-xs text-red-600 font-medium'>
                              🔍 Cliquez pour assigner un remplaçant
                            </p>
                          </div>
                        )}
                      </div>
                    ))}

                    {daySessions.length === 0 && (
                      <div className='text-center py-8 text-gray-400 text-sm'>
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

// Helper functions
const toUIStatus = (s: string): SessionUI["status"] => {
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

const getDayKey = (isoDate: string): SessionUI["day"] | null => {
  const dateStr = isoDate.split("T")[0];
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  const dayIndex = d.getDay();

  switch (dayIndex) {
    case 1:
      return "monday";
    case 2:
      return "tuesday";
    case 3:
      return "wednesday";
    case 4:
      return "thursday";
    case 5:
      return "friday";
    default:
      return null;
  }
};
