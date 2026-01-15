import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface AttendanceMarkingProps {
  teacherId: string;
}

interface StudentAttendance {
  studentId: string;
  present: boolean;
  absent: boolean;
  late: boolean;
}

export default function AttendanceMarking({
  teacherId,
}: AttendanceMarkingProps) {
  // États pour les filtres
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [markAllPresent, setMarkAllPresent] = useState(false);
  const [attendance, setAttendance] = useState<
    Record<string, StudentAttendance>
  >({});
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [selectedField, setSelectedField] = useState<string>("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [studentQuery, setStudentQuery] = useState<string>("");

  // États pour les données
  const [classes, setClasses] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // États pour l'alerte
  const [alreadyMarked, setAlreadyMarked] = useState(false);
  const [markedDate, setMarkedDate] = useState<string>("");
  const [showStudentList, setShowStudentList] = useState(false);

  const token = localStorage.getItem("token");

  // Charger les classes et cours
  useEffect(() => {
    loadClasses();
    loadCourses();
  }, []);

  // Charger les étudiants quand une classe est sélectionnée
  useEffect(() => {
    if (selectedClassId) {
      loadStudents(selectedClassId);
    }
  }, [selectedClassId]);

  // Charger les séances quand les filtres changent
  useEffect(() => {
    if (selectedClassId) {
      loadSessions();
    }
  }, [selectedClassId, selectedDate]);

  const loadClasses = async () => {
    try {
      const response = await axios.get(`${API_URL}/classes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setClasses(response.data.data);
      }
    } catch (error) {
      console.error("Erreur classes:", error);
      toast.error("Erreur lors du chargement des classes");
    }
  };

  const loadCourses = async () => {
    try {
      const response = await axios.get(`${API_URL}/cours`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setCourses(response.data.data);
      }
    } catch (error) {
      console.error("Erreur cours:", error);
    }
  };

  const loadStudents = async (classId: string) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/classes/${classId}/etudiants`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data.success) {
        setStudents(response.data.data);
      }
    } catch (error) {
      console.error("Erreur étudiants:", error);
      toast.error("Erreur lors du chargement des étudiants");
    } finally {
      setLoading(false);
    }
  };

  const loadSessions = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/emploi-temps/classe/${selectedClassId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const filteredSessions = response.data.data.filter(
          (s: any) => s.date_seance.split("T")[0] === selectedDate
        );
        setSessions(filteredSessions);
      }
    } catch (error) {
      console.error("Erreur séances:", error);
    }
  };

  // ========================================
  // 🆕 FONCTION CLÉE : Vérifier + Charger
  // ========================================
  const handleSessionSelect = async (sessionId: string) => {
    if (!sessionId) return;

    setSelectedSession(sessionId);
    setLoading(true);
    setAlreadyMarked(false);
    setMarkedDate("");
    setShowStudentList(false);

    try {
      // 1. VÉRIFIER SI DÉJÀ MARQUÉ (BACKEND)
      const checkResponse = await axios.get(
        `${API_URL}/presences/verifier/${sessionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (checkResponse.data.success) {
        if (checkResponse.data.alreadyMarked) {
          // ✅ DÉJÀ MARQUÉ
          setAlreadyMarked(true);

          // Formater la date
          const date = new Date(checkResponse.data.markedDate);
          setMarkedDate(
            date.toLocaleDateString("fr-FR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          );

          // Pré-remplir les cases avec les données existantes
          const existingAttendance: Record<string, StudentAttendance> = {};
          checkResponse.data.data.forEach((record: any) => {
            existingAttendance[record.id_etudiant] = {
              studentId: record.id_etudiant.toString(),
              present: record.statut === "present",
              absent: record.statut === "absent",
              late: record.statut === "late",
            };
          });
          setAttendance(existingAttendance);

          // Afficher toast
          toast.warning("Présences déjà enregistrées", {
            description:
              "Cette séance a déjà été marquée. Vérifiez avant de modifier.",
            duration: 6000,
          });
        } else {
          // ✅ JAMAIS MARQUÉ
          setAlreadyMarked(false);

          // Initialiser cases vides
          const initialAttendance: Record<string, StudentAttendance> = {};
          students.forEach((student) => {
            initialAttendance[student.id_etudiant] = {
              studentId: student.id_etudiant.toString(),
              present: false,
              absent: false,
              late: false,
            };
          });
          setAttendance(initialAttendance);
        }

        // Afficher la liste
        setShowStudentList(true);
      }
    } catch (error) {
      console.error("Erreur vérification:", error);
      toast.error("Erreur lors de la vérification");
    } finally {
      setLoading(false);
    }
  };

  // Extraire les données pour les filtres
  const levels = Array.from(new Set(classes.map((c) => c.niveau)));
  const fields = Array.from(new Set(classes.map((c) => c.nom_filiere)));
  const subjects = Array.from(new Set(courses.map((c) => c.nom_matiere)));

  const filteredClasses = classes.filter(
    (c) =>
      (selectedLevel ? c.niveau === selectedLevel : true) &&
      (selectedField ? c.nom_filiere === selectedField : true)
  );

  const filteredSessions = sessions.filter((s) =>
    selectedSubject ? s.nom_matiere === selectedSubject : true
  );

  const sessionData = sessions.find(
    (s) => s.id_seance === Number(selectedSession)
  );

  const filteredStudents = students.filter((st) =>
    `${st.prenom} ${st.nom}`.toLowerCase().includes(studentQuery.toLowerCase())
  );

  // Marquer tous présents
  const handleMarkAllPresent = (checked: boolean) => {
    setMarkAllPresent(checked);
    const newAttendance: Record<string, StudentAttendance> = {};
    students.forEach((student) => {
      newAttendance[student.id_etudiant] = {
        studentId: student.id_etudiant.toString(),
        present: checked,
        absent: false,
        late: false,
      };
    });
    setAttendance(newAttendance);
  };

  // Gérer le changement de présence
  const handleAttendanceChange = (
    studentId: string,
    type: "present" | "absent" | "late"
  ) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: {
        studentId,
        present: type === "present",
        absent: type === "absent",
        late: type === "late",
      },
    }));
  };

  // Obtenir le statut
  const getStatus = (
    studentId: string
  ): "present" | "absent" | "late" | null => {
    const record = attendance[studentId];
    if (!record) return null;
    if (record.present) return "present";
    if (record.absent) return "absent";
    if (record.late) return "late";
    return null;
  };

  // Annuler
  const handleCancel = () => {
    setSelectedSession("");
    setShowStudentList(false);
    setAlreadyMarked(false);
    setMarkedDate("");
    setAttendance({});
  };

  // Sauvegarder
  const handleSaveAttendance = async () => {
    if (!selectedSession) {
      toast.error("Veuillez sélectionner une séance");
      return;
    }

    // Confirmation si déjà marqué
    if (alreadyMarked) {
      const confirmed = window.confirm(
        "⚠️ ATTENTION - MISE À JOUR\n\n" +
          "Les présences ont déjà été enregistrées pour cette séance.\n" +
          (markedDate ? `Date d'enregistrement: ${markedDate}\n\n` : "") +
          "Êtes-vous sûr de vouloir les ÉCRASER ?\n\n" +
          "Cette action est IRRÉVERSIBLE !"
      );

      if (!confirmed) return;
    }

    try {
      setSaving(true);

      // Préparer les données
      const presencesData = Object.keys(attendance).map((studentId) => {
        const record = attendance[studentId];
        let statut = "present";

        if (record.present) statut = "present";
        else if (record.absent) statut = "absent";
        else if (record.late) statut = "late";

        return {
          id_etudiant: Number(studentId),
          statut: statut,
        };
      });

      // Envoyer en masse
      await axios.post(
        `${API_URL}/presences/masse`,
        {
          id_seance: Number(selectedSession),
          presences: presencesData,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const presentCount = Object.values(attendance).filter(
        (a) => a.present
      ).length;
      const absentCount = Object.values(attendance).filter(
        (a) => a.absent
      ).length;

      if (alreadyMarked) {
        toast.success("✅ Présences mises à jour", {
          description: `${presentCount} présents, ${absentCount} absents`,
        });
      } else {
        toast.success("✅ Présences enregistrées", {
          description: `${presentCount} présents, ${absentCount} absents`,
        });
      }

      // Mettre à jour l'état
      setAlreadyMarked(true);
      const now = new Date();
      setMarkedDate(
        now.toLocaleDateString("fr-FR", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch (error: any) {
      console.error("Erreur sauvegarde:", error);
      toast.error(
        error.response?.data?.message || "Erreur lors de l'enregistrement"
      );
    } finally {
      setSaving(false);
    }
  };

  // Calculer les stats
  const presentCount = Object.values(attendance).filter(
    (a) => a.present
  ).length;
  const absentCount = Object.values(attendance).filter((a) => a.absent).length;
  const lateCount = Object.values(attendance).filter((a) => a.late).length;

  return (
    <div className='space-y-6'>
      {/* Sélection de la séance */}
      <Card>
        <CardHeader>
          <CardTitle>Marquer les Présences</CardTitle>
          <CardDescription>
            Sélectionner le cours pour marquer les présences
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            <div className='space-y-2'>
              <label className='text-sm'>Niveau</label>
              <Select
                value={selectedLevel}
                onValueChange={setSelectedLevel}
              >
                <SelectTrigger>
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
            <div className='space-y-2'>
              <label className='text-sm'>Filière</label>
              <Select
                value={selectedField}
                onValueChange={setSelectedField}
              >
                <SelectTrigger>
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
            <div className='space-y-2'>
              <label className='text-sm'>Classe</label>
              <Select
                value={selectedClassId}
                onValueChange={setSelectedClassId}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Sélectionner' />
                </SelectTrigger>
                <SelectContent>
                  {filteredClasses.map((cls) => (
                    <SelectItem
                      key={cls.id_classe}
                      value={cls.id_classe.toString()}
                    >
                      {cls.nom_classe}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <label className='text-sm'>Matière</label>
              <Select
                value={selectedSubject}
                onValueChange={setSelectedSubject}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Toutes' />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((su) => (
                    <SelectItem
                      key={su}
                      value={su}
                    >
                      {su}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <label className='text-sm'>Date</label>
              <div className='flex items-center gap-2'>
                <Calendar className='h-4 w-4 text-gray-400' />
                <input
                  type='date'
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className='flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm'
                />
              </div>
            </div>

            <div className='space-y-2'>
              <label className='text-sm'>Cours</label>
              <Select
                value={selectedSession}
                onValueChange={handleSessionSelect}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loading ? "Vérification..." : "Sélectionner un cours"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredSessions.map((session) => (
                    <SelectItem
                      key={session.id_seance}
                      value={session.id_seance.toString()}
                    >
                      {session.nom_matiere} - {session.nom_classe} (
                      {session.heure_debut})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 🚨 ALERTE SI DÉJÀ MARQUÉ */}
      {selectedSession && showStudentList && alreadyMarked && (
        <Card className='border-orange-300 bg-orange-50 shadow-lg'>
          <CardContent className='pt-6'>
            <div className='flex items-start gap-4'>
              <div className='flex-shrink-0 mt-1'>
                <AlertTriangle className='h-8 w-8 text-orange-600' />
              </div>
              <div className='flex-1'>
                <h3 className='text-lg font-bold text-orange-900 mb-2'>
                  PRÉSENCES DÉJÀ ENREGISTRÉES
                </h3>
                <div className='space-y-2 text-orange-800'>
                  <p className='font-medium'>
                    Les présences ont déjà été marquées pour cette séance.
                  </p>
                  {markedDate && (
                    <p className='text-sm'>
                      <strong>Date d'enregistrement :</strong> {markedDate}
                    </p>
                  )}
                  <div className='bg-orange-100 border border-orange-200 rounded p-3 mt-3'>
                    <p className='text-sm font-semibold text-orange-900'>
                      Les cases ci-dessous sont déjà cochées selon les présences
                      enregistrées.
                    </p>
                    <p className='text-xs text-orange-700 mt-1'>
                      Si vous modifiez et enregistrez, vous ÉCRASEREZ les
                      données précédentes !
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des étudiants */}
      {selectedSession && showStudentList && !loading && (
        <>
          {/* Stats */}
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            <Card>
              <CardContent className='pt-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm text-gray-500'>Total</p>
                    <p className='text-2xl'>{students.length}</p>
                  </div>
                  <Users className='h-8 w-8 text-blue-600' />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='pt-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm text-gray-500'>Présents</p>
                    <p className='text-2xl text-green-600'>{presentCount}</p>
                  </div>
                  <CheckCircle2 className='h-8 w-8 text-green-600' />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='pt-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm text-gray-500'>Absents</p>
                    <p className='text-2xl text-red-600'>{absentCount}</p>
                  </div>
                  <XCircle className='h-8 w-8 text-red-600' />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='pt-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm text-gray-500'>En retard</p>
                    <p className='text-2xl text-orange-600'>{lateCount}</p>
                  </div>
                  <Clock className='h-8 w-8 text-orange-600' />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tableau */}
          <Card>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <div>
                  <CardTitle className='flex items-center gap-2'>
                    <Users className='h-5 w-5' />
                    Présences - {sessionData?.nom_matiere}
                  </CardTitle>
                  <CardDescription>
                    {alreadyMarked
                      ? "Présences déjà enregistrées - Modification possible"
                      : "Marquer les présences"}
                  </CardDescription>
                </div>
                <div className='flex items-center gap-2'>
                  <Input
                    placeholder='Rechercher'
                    className='w-64'
                    value={studentQuery}
                    onChange={(e) => setStudentQuery(e.target.value)}
                  />
                  <Checkbox
                    id='mark-all'
                    checked={markAllPresent}
                    onCheckedChange={handleMarkAllPresent}
                  />
                  <label
                    htmlFor='mark-all'
                    className='text-sm cursor-pointer'
                  >
                    Tout présent
                  </label>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className='border rounded-lg overflow-hidden'>
                <table className='w-full'>
                  <thead className='bg-gray-50'>
                    <tr>
                      <th className='px-4 py-3 text-left text-sm'>Roll No.</th>
                      <th className='px-4 py-3 text-left text-sm'>
                        Nom de l'Étudiant
                      </th>
                      <th className='px-4 py-3 text-center text-sm'>Présent</th>
                      <th className='px-4 py-3 text-center text-sm'>Absent</th>
                      <th className='px-4 py-3 text-center text-sm'>
                        En retard
                      </th>
                      <th className='px-4 py-3 text-center text-sm'>Statut</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-200'>
                    {filteredStudents.map((student, index) => {
                      const status = getStatus(student.id_etudiant.toString());
                      const isMarked =
                        attendance[student.id_etudiant] &&
                        (attendance[student.id_etudiant].present ||
                          attendance[student.id_etudiant].absent ||
                          attendance[student.id_etudiant].late);

                      return (
                        <tr
                          key={student.id_etudiant}
                          className={`hover:bg-gray-50 ${
                            alreadyMarked && isMarked ? "bg-orange-50" : ""
                          }`}
                        >
                          <td className='px-4 py-3 text-sm'>
                            {student.matricule ||
                              String(index + 1).padStart(3, "0")}
                          </td>
                          <td className='px-4 py-3 text-sm font-medium'>
                            {student.prenom} {student.nom}
                          </td>
                          <td className='px-4 py-3 text-center'>
                            <div className='flex justify-center'>
                              <Checkbox
                                checked={
                                  attendance[student.id_etudiant]?.present ||
                                  false
                                }
                                onCheckedChange={() =>
                                  handleAttendanceChange(
                                    student.id_etudiant.toString(),
                                    "present"
                                  )
                                }
                              />
                            </div>
                          </td>
                          <td className='px-4 py-3 text-center'>
                            <div className='flex justify-center'>
                              <Checkbox
                                checked={
                                  attendance[student.id_etudiant]?.absent ||
                                  false
                                }
                                onCheckedChange={() =>
                                  handleAttendanceChange(
                                    student.id_etudiant.toString(),
                                    "absent"
                                  )
                                }
                              />
                            </div>
                          </td>
                          <td className='px-4 py-3 text-center'>
                            <div className='flex justify-center'>
                              <Checkbox
                                checked={
                                  attendance[student.id_etudiant]?.late || false
                                }
                                onCheckedChange={() =>
                                  handleAttendanceChange(
                                    student.id_etudiant.toString(),
                                    "late"
                                  )
                                }
                              />
                            </div>
                          </td>
                          <td className='px-4 py-3 text-center'>
                            {status === "present" && (
                              <Badge className='bg-green-100 text-green-700 border-green-300'>
                                <CheckCircle2 className='h-3 w-3 mr-1' />
                                Présent
                              </Badge>
                            )}
                            {status === "absent" && (
                              <Badge className='bg-red-100 text-red-700 border-red-300'>
                                <XCircle className='h-3 w-3 mr-1' />
                                Absent
                              </Badge>
                            )}
                            {status === "late" && (
                              <Badge className='bg-orange-100 text-orange-700 border-orange-300'>
                                <Clock className='h-3 w-3 mr-1' />
                                En retard
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Actions */}
              <div className='flex justify-between items-center mt-6'>
                <Button
                  variant='outline'
                  onClick={handleCancel}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleSaveAttendance}
                  size='lg'
                  disabled={saving}
                  className='flex items-center justify-center gap-2 whitespace-nowrap px-6 py-2 rounded-md'
                  style={{
                    backgroundColor: alreadyMarked ? "#ea580c" : "#4f46e5", // orange / indigo
                    color: "#fff",
                  }}
                >
                  {saving ? (
                    "Enregistrement..."
                  ) : alreadyMarked ? (
                    <>
                      <AlertTriangle className='h-4 w-4' />
                      Mettre à jour les Présences
                    </>
                  ) : (
                    "Enregistrer les Présences"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {loading && (
        <Card>
          <CardContent className='py-12 text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto'></div>
            <p className='text-gray-500 mt-4'>Vérification en cours...</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
