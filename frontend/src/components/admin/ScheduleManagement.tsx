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
  DialogTrigger,
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

type BackendSeanceStatus =
  | "prevue"
  | "remplacee"
  | "reportee"
  | "annulee"
  | "rattrapage";

type ApiSeanceClasse = {
  id_seance: number;
  date_seance: string;
  heure_debut: string;
  heure_fin: string;
  id_salle: number | string; // Peut être numérique ou texte
  statut: BackendSeanceStatus;
  code_couleur?: string;
  nom_classe: string;
  nom_matiere: string;
  prof_prenom?: string;
  prof_nom?: string;
};

type ApiCours = {
  id_cours: number;
  id_classe: number;
  id_enseignant_titulaire: number;
  nom_matiere: string;
  nom_classe: string;
};

type ApiClasse = {
  id_classe: number;
  nom_classe: string;
  niveau: string;
  nom_filiere?: string;
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
  replacementTeacherId?: string;
  postponedTo?: string;
  originalSessionId?: string;
};

type ApiEnseignant = {
  id_enseignant: number;
  prenom: string;
  nom: string;
  email: string;
};

const toUIStatus = (s: BackendSeanceStatus): SessionUI["status"] => {
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

const toBackendStatus = (s: SessionUI["status"]): BackendSeanceStatus => {
  switch (s) {
    case "cancelled":
      return "annulee";
    case "postponed":
      return "reportee";
    case "makeup":
      return "rattrapage";
    case "replaced":
      return "remplacee";
    case "normal":
    default:
      return "prevue";
  }
};

const getDayKey = (isoDate: string): SessionUI["day"] => {
  // Extraire la date directement sans parse timezone
  const dateStr = isoDate.split("T")[0]; // "2026-01-20"
  const [year, month, day] = dateStr.split("-").map(Number);

  // Créer date en UTC pour éviter les décalages timezone
  const d = new Date(Date.UTC(year, month - 1, day));
  const js = d.getUTCDay(); // ⭐ Utiliser getUTCDay() au lieu de getDay()

  console.log(
    `🗓️ Date: ${dateStr} → Jour: ${js} (${
      ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"][js]
    })`
  );

  if (js === 1) return "monday";
  if (js === 2) return "tuesday";
  if (js === 3) return "wednesday";
  if (js === 4) return "thursday";
  if (js === 5) return "friday";

  // Si weekend, logger un warning
  console.warn(`⚠️ Séance sur un weekend détectée: ${dateStr} (jour ${js})`);
  return "monday"; // Fallback
};

const dayPrefix = (day: SessionUI["day"]) => {
  switch (day) {
    case "monday":
      return "LUN";
    case "tuesday":
      return "MAR";
    case "wednesday":
      return "MER";
    case "thursday":
      return "JEU";
    case "friday":
    default:
      return "VEN";
  }
};

const buildCreneauId = (
  day: SessionUI["day"],
  startTime: string,
  endTime: string
) => {
  const sh = startTime.slice(0, 2);
  const eh = endTime.slice(0, 2);
  return `${dayPrefix(day)}_${sh}_${eh}`;
};

export default function ScheduleManagement() {
  const token = localStorage.getItem("token");

  // DATA
  const [classes, setClasses] = useState<ApiClasse[]>([]);
  const [cours, setCours] = useState<ApiCours[]>([]);
  const [enseignants, setEnseignants] = useState<ApiEnseignant[]>([]);
  const [sessionList, setSessionList] = useState<SessionUI[]>([]);

  // FILTERS/UI
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [selectedField, setSelectedField] = useState<string>("");
  const [weekDate, setWeekDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // DIALOG ADD
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [addRoom, setAddRoom] = useState("");
  const [addStart, setAddStart] = useState("08:00");
  const [addEnd, setAddEnd] = useState("10:00");
  const [addCoursId, setAddCoursId] = useState<string>("");
  const [addTeacherId, setAddTeacherId] = useState<string>("__auto");
  const [addDate, setAddDate] = useState<string>(
    () => new Date().toISOString().split("T")[0]
  );

  // Protection double soumission
  const [isSubmitting, setIsSubmitting] = useState(false);

  // EDIT
  const [editingSession, setEditingSession] = useState<SessionUI | null>(null);

  const selectedClassData = useMemo(
    () => classes.find((c) => String(c.id_classe) === selectedClass),
    [classes, selectedClass]
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

  const classSessions = useMemo(
    () => sessionList.filter((s) => s.classId === selectedClass),
    [sessionList, selectedClass]
  );

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
    return classSessions
      .filter((s) => s.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  // ⭐ COURS FILTRÉS PAR CLASSE
  const coursForSelectedClass = useMemo(() => {
    if (!selectedClass) return [];
    return cours.filter((c) => String(c.id_classe) === String(selectedClass));
  }, [cours, selectedClass]);

  // ⭐ ENSEIGNANTS FILTRÉS PAR COURS SÉLECTIONNÉ
  const enseignantsForSelectedCours = useMemo(() => {
    if (!addCoursId) return enseignants;

    // Trouver le cours sélectionné
    const selectedCours = cours.find((c) => String(c.id_cours) === addCoursId);

    if (!selectedCours) return enseignants;

    // Retourner seulement l'enseignant titulaire + tous les vacataires
    return enseignants.filter(
      (e) => e.id_enseignant === selectedCours.id_enseignant_titulaire || true // Pour l'instant, on affiche tous les profs
    );
  }, [addCoursId, cours, enseignants]);

  useEffect(() => {
    setAddCoursId("");
    setAddTeacherId("__auto");
  }, [selectedClass]);

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
        } else {
          toast.error("Erreur chargement classes");
        }

        if (rCours.data?.success) {
          const mapped: ApiCours[] = (rCours.data.data || []).map((c: any) => ({
            id_cours: c.id_cours,
            id_classe: c.id_classe,
            id_enseignant_titulaire: c.id_enseignant_titulaire,
            nom_matiere: c.nom_matiere,
            nom_classe: c.nom_classe,
          }));
          setCours(mapped);
        } else {
          toast.error("Erreur chargement matières/cours");
        }

        if (rTeachers.data?.success) {
          setEnseignants(rTeachers.data.data || []);
        } else {
          toast.error("Erreur chargement enseignants");
        }
      } catch (e: any) {
        console.error(e);
        toast.error(e?.response?.data?.message || "Erreur serveur (base)");
      }
    };

    loadBase();
  }, []);

  // ===== FETCH SESSIONS (par classe) =====
  useEffect(() => {
    const loadSessions = async () => {
      if (!selectedClass) return;
      try {
        console.log("📊 Chargement séances pour classe:", selectedClass);

        const res = await axios.get(
          `${API_URL}/emploi-temps/classe/${selectedClass}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.data?.success) {
          toast.error("Erreur chargement emploi du temps");
          setSessionList([]);
          return;
        }

        const all: ApiSeanceClasse[] = res.data.data || [];

        console.log("📊 Total séances reçues:", all.length);
        console.log("📅 Semaine actuelle:", weekRange);

        // ⭐ LOG DÉTAILLÉ DE CHAQUE SÉANCE
        all.forEach((s, idx) => {
          const dateStr = s.date_seance.split("T")[0];
          const dayOfWeek = new Date(s.date_seance).toLocaleDateString(
            "fr-FR",
            { weekday: "long" }
          );
          console.log(
            `  [${idx + 1}] Séance ${s.id_seance}: ${
              s.nom_matiere
            } - ${dateStr} (${dayOfWeek}) ${s.heure_debut}-${s.heure_fin}`
          );
        });

        const filtered = all.filter((s) => {
          const d = s.date_seance.split("T")[0];
          const isInWeek = d >= weekRange.monday && d <= weekRange.friday;

          if (!isInWeek) {
            console.log(`  ❌ Hors semaine: Séance ${s.id_seance} le ${d}`);
          } else {
            console.log(`  ✅ Dans la semaine: Séance ${s.id_seance} le ${d}`);
          }

          return isInWeek;
        });

        console.log("📋 Séances filtrées affichées:", filtered.length);

        const mapped: SessionUI[] = filtered.map((s) => ({
          id: String(s.id_seance),
          classId: String(selectedClass),
          day: getDayKey(s.date_seance),
          startTime: s.heure_debut?.slice(0, 5) || s.heure_debut,
          endTime: s.heure_fin?.slice(0, 5) || s.heure_fin,
          subject: s.nom_matiere,
          room: String(s.id_salle), // ⭐ GARDER FORMAT TEXTE
          status: toUIStatus(s.statut),
          teacherName:
            `${s.prof_prenom || ""} ${s.prof_nom || ""}`.trim() || "N/A",
        }));

        setSessionList(mapped);
      } catch (e: any) {
        console.error(e);
        toast.error(
          e?.response?.data?.message ||
            "Erreur serveur (emploi du temps classe)"
        );
        setSessionList([]);
      }
    };

    loadSessions();
  }, [selectedClass, token, weekRange]);

  // ⭐ FONCTION DE RECHARGEMENT
  const reloadSessionsForClass = async () => {
    if (!selectedClass) return;

    try {
      console.log("🔄 Rechargement séances...");

      const reload = await axios.get(
        `${API_URL}/emploi-temps/classe/${selectedClass}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!reload.data?.success) return;

      const all: ApiSeanceClasse[] = reload.data.data || [];

      console.log("📊 Après rechargement:", all.length, "séances");
      console.log("📅 Semaine à afficher:", weekRange);

      const filtered = all.filter((s) => {
        const d = s.date_seance.split("T")[0];
        const isInWeek = d >= weekRange.monday && d <= weekRange.friday;

        if (!isInWeek) {
          console.log(`  ❌ Séance ${s.id_seance} hors semaine: ${d}`);
        } else {
          console.log(`  ✅ Séance ${s.id_seance} dans la semaine: ${d}`);
        }

        return isInWeek;
      });

      console.log("📋 Filtrées:", filtered.length);

      setSessionList(
        filtered.map((s) => ({
          id: String(s.id_seance),
          classId: String(selectedClass),
          day: getDayKey(s.date_seance),
          startTime: s.heure_debut?.slice(0, 5) || s.heure_debut,
          endTime: s.heure_fin?.slice(0, 5) || s.heure_fin,
          subject: s.nom_matiere,
          room: String(s.id_salle), // ⭐ GARDER FORMAT TEXTE
          status: toUIStatus(s.statut),
          teacherName:
            `${s.prof_prenom || ""} ${s.prof_nom || ""}`.trim() || "N/A",
        }))
      );
    } catch (e: any) {
      console.error("❌ Erreur rechargement:", e);
    }
  };

  // ⭐ ADD SESSION ULTRA-FINAL
  const handleAddSession = async () => {
    if (isSubmitting) {
      console.log("⚠️ Déjà en cours");
      return;
    }

    try {
      setIsSubmitting(true);
      console.log("🚀 Ajout séance...");

      if (!selectedClass) {
        toast.error("Aucune classe sélectionnée");
        return;
      }

      if (!addCoursId) {
        toast.error("Sélectionne une matière");
        return;
      }

      if (!addRoom.trim()) {
        toast.error("Salle requise");
        return;
      }

      if (!addDate) {
        toast.error("Sélectionne une date");
        return;
      }

      // ⭐ VÉRIFIER QUE LA DATE EST UN JOUR DE SEMAINE
      const selectedDate = new Date(addDate);
      const dayOfWeek = selectedDate.getDay();

      if (dayOfWeek === 0 || dayOfWeek === 6) {
        toast.error("⚠️ Impossible de planifier un cours le weekend !");
        return;
      }

      const dayKey = getDayKey(addDate);
      const id_creneau = buildCreneauId(dayKey, addStart, addEnd);

      const payload: any = {
        id_cours: Number(addCoursId),
        date_seance: addDate,
        heure_debut: addStart,
        heure_fin: addEnd,
        id_salle: addRoom, // ⭐ ENVOYER TEXTE BRUT
        id_creneau,
      };

      if (addTeacherId !== "__auto") {
        payload.id_enseignant_effectif = Number(addTeacherId);
      }

      console.log("📤 Payload:", payload);
      console.log("📅 Date sélectionnée:", addDate);
      console.log(
        "📅 Jour de la semaine:",
        ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"][dayOfWeek]
      );

      const res = await axios.post(`${API_URL}/emploi-temps/seances`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("📥 Réponse:", res.data);

      if (!res.data?.success) {
        toast.error(res.data?.message || "Erreur ajout séance");
        return;
      }

      toast.success("✅ Séance ajoutée !");

      setIsAddDialogOpen(false);

      // Reset
      setAddCoursId("");
      setAddTeacherId("__auto");
      setAddRoom("");
      setAddStart("08:00");
      setAddEnd("10:00");

      // ⭐ CHANGER LA SEMAINE VERS LA DATE AJOUTÉE
      console.log("📅 Changement de semaine vers:", addDate);
      setWeekDate(addDate);

      // ⭐ ATTENDRE QUE weekRange SE METTE À JOUR
      setTimeout(async () => {
        console.log("🔄 Rechargement après délai...");
        await reloadSessionsForClass();
      }, 500);
    } catch (e: any) {
      console.error("❌ Erreur:", e);
      toast.error(e?.response?.data?.message || "Erreur serveur");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ===== UPDATE STATUS =====
  const handleUpdateSession = async (updated: SessionUI) => {
    try {
      const statut = toBackendStatus(updated.status);

      const payload: any = { statut };

      if (statut === "remplacee" && updated.replacementTeacherId) {
        payload.id_enseignant_remplacant = Number(updated.replacementTeacherId);
      }

      if (statut === "reportee" && updated.postponedTo) {
        payload.date_report = updated.postponedTo;
      }

      const res = await axios.put(
        `${API_URL}/emploi-temps/seances/${updated.id}/statut`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.data?.success) {
        toast.error(res.data?.message || "Erreur mise à jour");
        return;
      }

      setEditingSession(null);
      toast.success("Séance mise à jour");
      await reloadSessionsForClass();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || "Erreur serveur");
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

        <Dialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
        >
          <DialogTrigger asChild>
            <Button
              className='gap-2'
              disabled={isSubmitting}
            >
              <Plus className='h-4 w-4' />
              Ajouter une séance
            </Button>
          </DialogTrigger>

          <DialogContent className='max-w-2xl'>
            <DialogHeader>
              <DialogTitle>Ajouter une séance</DialogTitle>
              <DialogDescription>
                Créer une nouvelle séance pour :{" "}
                <strong>{selectedClassData?.nom_classe}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-4 py-4'>
              <div className='space-y-2'>
                <Label>Matière *</Label>
                <Select
                  value={addCoursId}
                  onValueChange={setAddCoursId}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Sélectionner une matière' />
                  </SelectTrigger>
                  <SelectContent>
                    {coursForSelectedClass.map((c) => (
                      <SelectItem
                        key={c.id_cours}
                        value={String(c.id_cours)}
                      >
                        {c.nom_matiere}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label>Professeur</Label>
                <Select
                  value={addTeacherId}
                  onValueChange={setAddTeacherId}
                  disabled={isSubmitting || !addCoursId}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='__auto'>
                      Auto (titulaire du cours)
                    </SelectItem>
                    {enseignantsForSelectedCours.map((t) => (
                      <SelectItem
                        key={t.id_enseignant}
                        value={String(t.id_enseignant)}
                      >
                        {t.prenom} {t.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label>Date * (Lun-Ven uniquement)</Label>
                  <Input
                    type='date'
                    value={addDate}
                    onChange={(e) => setAddDate(e.target.value)}
                    disabled={isSubmitting}
                    min={new Date().toISOString().split("T")[0]}
                  />
                  <p className='text-xs text-gray-500'>
                    {addDate &&
                      (() => {
                        const d = new Date(addDate);
                        const day = d.getDay();
                        if (day === 0 || day === 6) {
                          return (
                            <span className='text-red-600 flex items-center gap-1'>
                              <AlertCircle className='h-3 w-3' />
                              Weekend non autorisé
                            </span>
                          );
                        }
                        return `${
                          ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"][day]
                        }`;
                      })()}
                  </p>
                </div>

                <div className='space-y-2'>
                  <Label>Salle * (texte libre)</Label>
                  <Input
                    placeholder='A101, B444, Amphi...'
                    value={addRoom}
                    onChange={(e) => setAddRoom(e.target.value)}
                    disabled={isSubmitting}
                  />
                  <p className='text-xs text-gray-500'>Ex: A101, B444, Amphi</p>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label>Heure début *</Label>
                  <Input
                    type='time'
                    value={addStart}
                    onChange={(e) => setAddStart(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <div className='space-y-2'>
                  <Label>Heure fin *</Label>
                  <Input
                    type='time'
                    value={addEnd}
                    onChange={(e) => setAddEnd(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => setIsAddDialogOpen(false)}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button
                onClick={handleAddSession}
                disabled={isSubmitting}
              >
                {isSubmitting && (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                )}
                {isSubmitting ? "Ajout..." : "Ajouter"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Class Selector */}
      <Card>
        <CardContent className='pt-6'>
          <div className='flex flex-wrap items-center gap-4'>
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

      {/* Edit Dialog - IDENTIQUE */}
      {editingSession && (
        <Dialog
          open={!!editingSession}
          onOpenChange={(open) => !open && setEditingSession(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier la séance</DialogTitle>
              <DialogDescription>
                Mettre à jour le statut et les détails
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-4 py-2'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label>Statut</Label>
                  <Select
                    value={editingSession.status}
                    onValueChange={(val) =>
                      setEditingSession({
                        ...editingSession,
                        status: val as any,
                        replacementTeacherId: undefined,
                        postponedTo: undefined,
                        originalSessionId: undefined,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='normal'>
                        {STATUS_LABELS["normal"]}
                      </SelectItem>
                      <SelectItem value='cancelled'>
                        {STATUS_LABELS["cancelled"]}
                      </SelectItem>
                      <SelectItem value='postponed'>
                        {STATUS_LABELS["postponed"]}
                      </SelectItem>
                      <SelectItem value='makeup'>
                        {STATUS_LABELS["makeup"]}
                      </SelectItem>
                      <SelectItem value='replaced'>
                        {STATUS_LABELS["replaced"]}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <Label>Salle</Label>
                  <Input
                    value={editingSession.room}
                    onChange={(e) =>
                      setEditingSession({
                        ...editingSession,
                        room: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label>Heure début</Label>
                  <Input
                    type='time'
                    value={editingSession.startTime}
                    onChange={(e) =>
                      setEditingSession({
                        ...editingSession,
                        startTime: e.target.value,
                      })
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Heure fin</Label>
                  <Input
                    type='time'
                    value={editingSession.endTime}
                    onChange={(e) =>
                      setEditingSession({
                        ...editingSession,
                        endTime: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              {editingSession.status === "replaced" && (
                <div className='space-y-2'>
                  <Label>Professeur remplaçant (ID)</Label>
                  <Input
                    placeholder='ex: 5'
                    value={editingSession.replacementTeacherId || ""}
                    onChange={(e) =>
                      setEditingSession({
                        ...editingSession,
                        replacementTeacherId: e.target.value,
                      })
                    }
                  />
                </div>
              )}

              {editingSession.status === "postponed" && (
                <div className='space-y-2'>
                  <Label>Reporté au</Label>
                  <Input
                    type='date'
                    value={editingSession.postponedTo || ""}
                    onChange={(e) =>
                      setEditingSession({
                        ...editingSession,
                        postponedTo: e.target.value,
                      })
                    }
                  />
                </div>
              )}

              {editingSession.status === "makeup" && (
                <div className='space-y-2'>
                  <Label>Rattrapage de</Label>
                  <Select
                    value={editingSession.originalSessionId || ""}
                    onValueChange={(val) =>
                      setEditingSession({
                        ...editingSession,
                        originalSessionId: val,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Sélectionner la séance reportée' />
                    </SelectTrigger>
                    <SelectContent>
                      {sessionList
                        .filter(
                          (s) =>
                            s.classId === editingSession.classId &&
                            s.status === "postponed"
                        )
                        .map((s) => (
                          <SelectItem
                            key={s.id}
                            value={s.id}
                          >
                            {DAY_LABELS[s.day]} {s.startTime} - {s.subject}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => setEditingSession(null)}
              >
                Annuler
              </Button>
              <Button onClick={() => handleUpdateSession(editingSession)}>
                Enregistrer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Emploi du temps */}
      <Card>
        <CardHeader>
          <CardTitle>Emploi du temps de la semaine</CardTitle>
          <CardDescription>
            {selectedClassData?.nom_classe} - Du {weekRange.monday} au{" "}
            {weekRange.friday}
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
                        } hover:shadow-md transition-shadow cursor-pointer`}
                        onClick={() => setEditingSession(session)}
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

                        {session.postponedTo && (
                          <p className='text-xs text-green-600 mt-2'>
                            Reportée au{" "}
                            {new Date(session.postponedTo).toLocaleDateString(
                              "fr-FR"
                            )}
                          </p>
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
