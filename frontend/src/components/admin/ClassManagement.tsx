import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Filter,
  BookOpen,
  Users,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";

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
import { Badge } from "../ui/badge";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { ScrollArea } from "../ui/scroll-area";

type Classe = {
  id_classe: number;
  nom_classe: string;
  niveau: string;
  annee_scolaire: string;
  capacite_max?: number | null;
  id_filiere: number;
  nom_filiere?: string | null;
  code_filiere?: string | null;
  nom_departement?: string | null;
};

type Filiere = {
  id_filiere: number;
  nom_filiere: string;
  code_filiere?: string | null;
};

type EtudiantClasse = {
  id_etudiant: number;
  id_utilisateur?: number;
  id_classe?: number | null;
  matricule?: string | null;
  prenom: string;
  nom: string;
  email: string;
};

// ✅ Type pour les candidats (utilisateurs non encore étudiants)
type CandidatEtudiant = {
  id_utilisateur: number;
  prenom: string;
  nom: string;
  email: string;
};

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function ClassManagement() {
  const [classes, setClasses] = useState<Classe[]>([]);
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");

  // Create dialog
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newClassData, setNewClassData] = useState({
    nom_classe: "",
    niveau: "",
    annee_scolaire: "",
    id_filiere: "",
    capacite_max: "",
  });

  // Manage dialog (edit + delete)
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Classe | null>(null);
  const [editData, setEditData] = useState({
    nom_classe: "",
    niveau: "",
    annee_scolaire: "",
    id_filiere: "",
    capacite_max: "",
  });

  // Details dialog (students)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [students, setStudents] = useState<EtudiantClasse[]>([]);
  const [studentSearch, setStudentSearch] = useState("");

  // Assign dialog - ✅ MAINTENANT ON UTILISE DES CANDIDATS (utilisateurs)
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [candidatsLoading, setCandidatsLoading] = useState(false);
  const [candidats, setCandidats] = useState<CandidatEtudiant[]>([]);
  const [assignSearch, setAssignSearch] = useState("");
  const [selectedCandidatIds, setSelectedCandidatIds] = useState<
    Record<number, boolean>
  >({});

  async function fetchClasses() {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/classes`, {
        headers: getAuthHeaders(),
      });
      const data = res?.data?.data || res?.data || [];
      setClasses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error("Impossible de charger les classes");
    } finally {
      setLoading(false);
    }
  }

  async function fetchFilieres() {
    try {
      const res = await axios.get(`${API_BASE}/api/filieres`, {
        headers: getAuthHeaders(),
      });
      const data = res?.data?.data || res?.data || [];
      setFilieres(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setFilieres([]);
    }
  }

  async function fetchStudentsByClass(classId: number) {
    setStudentsLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE}/api/classes/${classId}/etudiants`,
        {
          headers: getAuthHeaders(),
        }
      );
      const data = res?.data?.data || res?.data || [];
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setStudents([]);
      toast.error("Impossible de charger les étudiants de cette classe");
    } finally {
      setStudentsLoading(false);
    }
  }

  // ✅ NOUVELLE FONCTION : Récupérer les candidats (utilisateurs 'student' non encore dans Etudiant)
  async function fetchCandidats() {
    setCandidatsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/etudiants/candidats`, {
        headers: getAuthHeaders(),
      });
      const data = res?.data?.data || res?.data || [];

      setCandidats(Array.isArray(data) ? data : []);

      if (data.length === 0) {
        toast.info("Aucun candidat disponible", {
          description:
            "Tous les utilisateurs 'student' sont déjà assignés à une classe.",
        });
      }
    } catch (err: any) {
      console.error("❌ Erreur fetchCandidats:", err);
      setCandidats([]);
      toast.error("Impossible de charger les candidats", {
        description:
          err?.response?.data?.message || err?.message || "Erreur réseau",
      });
    } finally {
      setCandidatsLoading(false);
    }
  }

  useEffect(() => {
    fetchClasses();
    fetchFilieres();
  }, []);

  const levels = useMemo(() => {
    const unique = Array.from(
      new Set(classes.map((c) => c.niveau).filter(Boolean))
    );
    return unique.sort();
  }, [classes]);

  const filteredClasses = useMemo(() => {
    const s = searchTerm.trim().toLowerCase();
    return classes.filter((cls) => {
      const matchesSearch =
        !s ||
        cls.nom_classe.toLowerCase().includes(s) ||
        cls.niveau.toLowerCase().includes(s) ||
        (cls.annee_scolaire || "").toLowerCase().includes(s) ||
        (cls.nom_filiere || "").toLowerCase().includes(s) ||
        (cls.code_filiere || "").toLowerCase().includes(s);

      const matchesLevel = filterLevel === "all" || cls.niveau === filterLevel;
      return matchesSearch && matchesLevel;
    });
  }, [classes, searchTerm, filterLevel]);

  const filteredStudents = useMemo(() => {
    const s = studentSearch.trim().toLowerCase();
    if (!s) return students;
    return students.filter((e) => {
      const fullName = `${e.prenom} ${e.nom}`.toLowerCase();
      return (
        fullName.includes(s) ||
        e.email.toLowerCase().includes(s) ||
        (e.matricule || "").toLowerCase().includes(s)
      );
    });
  }, [students, studentSearch]);

  // ✅ Filtrer les candidats selon la recherche
  const assignableCandidats = useMemo(() => {
    if (!selectedClass) return [];

    const q = assignSearch.trim().toLowerCase();
    if (!q) return candidats;

    return candidats.filter((c) => {
      const fullName = `${c.prenom} ${c.nom}`.toLowerCase();
      return fullName.includes(q) || c.email.toLowerCase().includes(q);
    });
  }, [candidats, assignSearch, selectedClass]);

  function openManage(cls: Classe) {
    setSelectedClass(cls);
    setEditData({
      nom_classe: cls.nom_classe || "",
      niveau: cls.niveau || "",
      annee_scolaire: cls.annee_scolaire || "",
      id_filiere: String(cls.id_filiere ?? ""),
      capacite_max: cls.capacite_max == null ? "" : String(cls.capacite_max),
    });
    setIsManageOpen(true);
  }

  async function openDetails(cls: Classe) {
    setSelectedClass(cls);
    setStudentSearch("");
    setIsDetailsOpen(true);
    await fetchStudentsByClass(cls.id_classe);
  }

  async function openAssignDialog() {
    if (!selectedClass) return;

    setAssignSearch("");
    setSelectedCandidatIds({});
    setIsAssignOpen(true);

    // ✅ Charger les candidats disponibles
    await fetchCandidats();
  }

  function toggleCandidat(id: number) {
    setSelectedCandidatIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function selectAllVisible() {
    const ids = assignableCandidats.map((c) => c.id_utilisateur);
    setSelectedCandidatIds((prev) => {
      const copy = { ...prev };
      ids.forEach((id) => (copy[id] = true));
      return copy;
    });
  }

  function clearSelection() {
    setSelectedCandidatIds({});
  }

  const selectedCount = useMemo(() => {
    return Object.values(selectedCandidatIds).filter(Boolean).length;
  }, [selectedCandidatIds]);

  async function handleAssignSelected() {
    if (!selectedClass) return;

    const ids = Object.entries(selectedCandidatIds)
      .filter(([, v]) => v)
      .map(([k]) => Number(k));

    if (ids.length === 0) {
      toast.error("Sélection vide", {
        description: "Choisis au moins un candidat.",
      });
      return;
    }

    setAssignLoading(true);
    try {
      // ✅ CRÉER les étudiants avec POST /api/etudiants (pas PUT)
      await Promise.all(
        ids.map((id_utilisateur) =>
          axios.post(
            `${API_BASE}/api/etudiants`,
            {
              id_utilisateur,
              id_classe: selectedClass.id_classe,
              matricule: `ETU-${Date.now()}-${id_utilisateur}`, // Générer un matricule
              date_inscription: new Date().toISOString().split("T")[0],
            },
            { headers: getAuthHeaders() }
          )
        )
      );

      toast.success("Assignation réussie", {
        description: `${ids.length} étudiant(s) assigné(s) à ${selectedClass.nom_classe}.`,
      });

      // Refresh
      await fetchStudentsByClass(selectedClass.id_classe);
      fetchClasses();

      setIsAssignOpen(false);
      setSelectedCandidatIds({});
    } catch (err: any) {
      console.error(err);
      toast.error("Erreur assignation", {
        description: err?.response?.data?.message || "Assignation impossible",
      });
    } finally {
      setAssignLoading(false);
    }
  }

  async function handleCreateClass(e: FormEvent) {
    e.preventDefault();

    if (
      !newClassData.nom_classe ||
      !newClassData.niveau ||
      !newClassData.annee_scolaire ||
      !newClassData.id_filiere
    ) {
      toast.error("Erreur création classe", {
        description:
          "Tous les champs obligatoires doivent être remplis (nom, niveau, année scolaire, filière).",
      });
      return;
    }

    try {
      await axios.post(
        `${API_BASE}/api/classes`,
        {
          nom_classe: newClassData.nom_classe,
          niveau: newClassData.niveau,
          annee_scolaire: newClassData.annee_scolaire,
          id_filiere: Number(newClassData.id_filiere),
          capacite_max: newClassData.capacite_max
            ? Number(newClassData.capacite_max)
            : undefined,
        },
        { headers: getAuthHeaders() }
      );

      toast.success("Classe créée avec succès");
      setIsCreateOpen(false);
      setNewClassData({
        nom_classe: "",
        niveau: "",
        annee_scolaire: "",
        id_filiere: "",
        capacite_max: "",
      });
      fetchClasses();
    } catch (err: any) {
      console.error(err);
      toast.error("Erreur création classe", {
        description: err?.response?.data?.message || "Création impossible",
      });
    }
  }

  async function handleUpdateClass(e: FormEvent) {
    e.preventDefault();
    if (!selectedClass) return;

    if (
      !editData.nom_classe ||
      !editData.niveau ||
      !editData.annee_scolaire ||
      !editData.id_filiere
    ) {
      toast.error("Erreur modification", {
        description: "Tous les champs obligatoires doivent être remplis.",
      });
      return;
    }

    try {
      await axios.put(
        `${API_BASE}/api/classes/${selectedClass.id_classe}`,
        {
          nom_classe: editData.nom_classe,
          niveau: editData.niveau,
          annee_scolaire: editData.annee_scolaire,
          id_filiere: Number(editData.id_filiere),
          capacite_max: editData.capacite_max
            ? Number(editData.capacite_max)
            : undefined,
        },
        { headers: getAuthHeaders() }
      );

      toast.success("Classe modifiée avec succès");
      setIsManageOpen(false);
      setSelectedClass(null);
      fetchClasses();
    } catch (err: any) {
      console.error(err);
      toast.error("Erreur modification", {
        description: err?.response?.data?.message || "Modification impossible",
      });
    }
  }

  async function handleDeleteClass() {
    if (!selectedClass) return;

    try {
      await axios.delete(`${API_BASE}/api/classes/${selectedClass.id_classe}`, {
        headers: getAuthHeaders(),
      });

      toast.success("Classe supprimée");
      setIsManageOpen(false);
      setSelectedClass(null);
      fetchClasses();
    } catch (err: any) {
      console.error(err);
      toast.error("Erreur suppression", {
        description: err?.response?.data?.message || "Suppression impossible",
      });
    }
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl'>Gestion des Classes</h2>
          <p className='text-gray-500'>Créer, consulter et gérer les classes</p>
        </div>

        <Dialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
        >
          <DialogTrigger asChild>
            <Button className='gap-2'>
              <Plus className='h-4 w-4' />
              Créer une classe
            </Button>
          </DialogTrigger>

          <DialogContent className='max-w-md'>
            <DialogHeader>
              <DialogTitle>Créer une nouvelle classe</DialogTitle>
              <DialogDescription>
                Renseigne les informations de base
              </DialogDescription>
            </DialogHeader>

            <form
              className='space-y-4 py-4'
              onSubmit={handleCreateClass}
            >
              <div className='space-y-2'>
                <Label>Nom de la classe</Label>
                <Input
                  value={newClassData.nom_classe}
                  onChange={(e) =>
                    setNewClassData((p) => ({
                      ...p,
                      nom_classe: e.target.value,
                    }))
                  }
                  placeholder='Ex: GI-1A'
                />
              </div>

              <div className='space-y-2'>
                <Label>Niveau</Label>
                <Input
                  value={newClassData.niveau}
                  onChange={(e) =>
                    setNewClassData((p) => ({ ...p, niveau: e.target.value }))
                  }
                  placeholder='Ex: 1ère année'
                />
              </div>

              <div className='space-y-2'>
                <Label>Année scolaire</Label>
                <Input
                  value={newClassData.annee_scolaire}
                  onChange={(e) =>
                    setNewClassData((p) => ({
                      ...p,
                      annee_scolaire: e.target.value,
                    }))
                  }
                  placeholder='Ex: 2024-2025'
                />
              </div>

              <div className='space-y-2'>
                <Label>Filière</Label>
                <Select
                  value={newClassData.id_filiere}
                  onValueChange={(value) =>
                    setNewClassData((p) => ({ ...p, id_filiere: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        filieres.length
                          ? "Sélectionner une filière"
                          : "Aucune filière disponible"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {filieres.map((f) => (
                      <SelectItem
                        key={f.id_filiere}
                        value={String(f.id_filiere)}
                      >
                        {f.nom_filiere}{" "}
                        {f.code_filiere ? `(${f.code_filiere})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label>Capacité max (optionnel)</Label>
                <Input
                  value={newClassData.capacite_max}
                  onChange={(e) =>
                    setNewClassData((p) => ({
                      ...p,
                      capacite_max: e.target.value,
                    }))
                  }
                  placeholder='Ex: 30'
                />
              </div>

              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setIsCreateOpen(false)}
                >
                  Annuler
                </Button>
                <Button type='submit'>Créer</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-500'>Total Classes</p>
                <p className='text-2xl'>{classes.length}</p>
              </div>
              <BookOpen className='h-8 w-8 text-indigo-600' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-500'>Filières</p>
                <p className='text-2xl'>{filieres.length}</p>
              </div>
              <Filter className='h-8 w-8 text-gray-700' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-500'>Affichées</p>
                <p className='text-2xl'>{filteredClasses.length}</p>
              </div>
              <Users className='h-8 w-8 text-blue-600' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters + list */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Classes</CardTitle>
          <CardDescription>Rechercher et filtrer les classes</CardDescription>
        </CardHeader>

        <CardContent className='space-y-4'>
          <div className='flex gap-4'>
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
              <Input
                placeholder='Rechercher par nom, niveau, année, filière...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='pl-10'
              />
            </div>

            <Select
              value={filterLevel}
              onValueChange={setFilterLevel}
            >
              <SelectTrigger className='w-48'>
                <SelectValue placeholder='Tous les niveaux' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tous les niveaux</SelectItem>
                {levels.map((lvl) => (
                  <SelectItem
                    key={lvl}
                    value={lvl}
                  >
                    {lvl}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className='py-10 text-center text-sm text-gray-500'>
              Chargement...
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className='py-10 text-center text-sm text-gray-500'>
              Aucune classe trouvée
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'>
              {filteredClasses.map((cls) => (
                <Card
                  key={cls.id_classe}
                  className='hover:shadow-md transition-shadow'
                >
                  <CardHeader className='pb-3'>
                    <div className='flex items-start justify-between'>
                      <div>
                        <CardTitle className='text-lg'>
                          {cls.nom_classe}
                        </CardTitle>
                        <CardDescription>
                          {cls.niveau} • {cls.annee_scolaire}
                        </CardDescription>
                      </div>
                      <BookOpen className='h-5 w-5 text-indigo-600' />
                    </div>
                  </CardHeader>

                  <CardContent className='space-y-3'>
                    <div className='flex flex-wrap gap-2'>
                      {cls.nom_filiere ? (
                        <Badge
                          variant='secondary'
                          className='text-xs'
                        >
                          {cls.nom_filiere}
                          {cls.code_filiere ? ` (${cls.code_filiere})` : ""}
                        </Badge>
                      ) : (
                        <Badge
                          variant='secondary'
                          className='text-xs'
                        >
                          Filière: —
                        </Badge>
                      )}

                      {cls.nom_departement ? (
                        <Badge
                          variant='outline'
                          className='text-xs'
                        >
                          {cls.nom_departement}
                        </Badge>
                      ) : null}

                      <Badge
                        variant='outline'
                        className='text-xs'
                      >
                        Capacité: {cls.capacite_max ?? 30}
                      </Badge>
                    </div>

                    <div className='flex gap-2 pt-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        className='flex-1 gap-2'
                        onClick={() => openDetails(cls)}
                      >
                        <Eye className='h-4 w-4' />
                        Détails
                      </Button>
                      <Button
                        size='sm'
                        className='flex-1 gap-2'
                        onClick={() => openManage(cls)}
                      >
                        <Edit className='h-4 w-4' />
                        Gérer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manage dialog */}
      <Dialog
        open={isManageOpen}
        onOpenChange={setIsManageOpen}
      >
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Gérer la classe</DialogTitle>
            <DialogDescription>
              {selectedClass
                ? `${selectedClass.nom_classe} • ${selectedClass.annee_scolaire}`
                : ""}
            </DialogDescription>
          </DialogHeader>

          <form
            className='space-y-4 py-2'
            onSubmit={handleUpdateClass}
          >
            <div className='space-y-2'>
              <Label>Nom</Label>
              <Input
                value={editData.nom_classe}
                onChange={(e) =>
                  setEditData((p) => ({ ...p, nom_classe: e.target.value }))
                }
              />
            </div>

            <div className='space-y-2'>
              <Label>Niveau</Label>
              <Input
                value={editData.niveau}
                onChange={(e) =>
                  setEditData((p) => ({ ...p, niveau: e.target.value }))
                }
              />
            </div>

            <div className='space-y-2'>
              <Label>Année scolaire</Label>
              <Input
                value={editData.annee_scolaire}
                onChange={(e) =>
                  setEditData((p) => ({ ...p, annee_scolaire: e.target.value }))
                }
              />
            </div>

            <div className='space-y-2'>
              <Label>Filière</Label>
              <Select
                value={editData.id_filiere}
                onValueChange={(value) =>
                  setEditData((p) => ({ ...p, id_filiere: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Sélectionner une filière' />
                </SelectTrigger>
                <SelectContent>
                  {filieres.map((f) => (
                    <SelectItem
                      key={f.id_filiere}
                      value={String(f.id_filiere)}
                    >
                      {f.nom_filiere}{" "}
                      {f.code_filiere ? `(${f.code_filiere})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label>Capacité max</Label>
              <Input
                value={editData.capacite_max}
                onChange={(e) =>
                  setEditData((p) => ({ ...p, capacite_max: e.target.value }))
                }
                placeholder='Ex: 30'
              />
            </div>

            <div className='flex items-center justify-between pt-2'>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type='button'
                    variant='destructive'
                    className='gap-2'
                  >
                    <Trash2 className='h-4 w-4' />
                    Supprimer
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Supprimer cette classe ?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action est définitive. Si la classe contient des
                      étudiants, l'API peut refuser la suppression.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteClass}>
                      Confirmer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <div className='flex gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setIsManageOpen(false)}
                >
                  Fermer
                </Button>
                <Button type='submit'>Enregistrer</Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Details dialog */}
      <Dialog
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      >
        <DialogContent className='max-w-5xl w-[95vw] max-h-[85vh]'>
          <DialogHeader>
            <DialogTitle>Détails de la classe</DialogTitle>
            <DialogDescription>
              {selectedClass
                ? `${selectedClass.nom_classe} • ${selectedClass.niveau} • ${selectedClass.annee_scolaire}`
                : ""}
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            <div className='flex items-center gap-3'>
              <div className='relative flex-1'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
                <Input
                  className='pl-10'
                  placeholder='Rechercher un étudiant (nom, email, matricule)...'
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                />
              </div>
              <Badge
                variant='secondary'
                className='text-xs'
              >
                {filteredStudents.length} étudiant(s)
              </Badge>
            </div>

            <div className='border rounded-lg'>
              <ScrollArea className='h-[480px]'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='w-[220px]'>Nom</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className='w-[160px]'>Matricule</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentsLoading ? (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className='py-8 text-center text-sm text-gray-500'
                        >
                          Chargement...
                        </TableCell>
                      </TableRow>
                    ) : filteredStudents.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className='py-8 text-center text-sm text-gray-500'
                        >
                          Aucun étudiant trouvé
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStudents.map((e) => (
                        <TableRow key={e.id_etudiant}>
                          <TableCell className='font-medium'>
                            {e.prenom} {e.nom}
                          </TableCell>
                          <TableCell>{e.email}</TableCell>
                          <TableCell>{e.matricule || "—"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>

            <DialogFooter className='flex items-center justify-between'>
              <Button
                variant='outline'
                onClick={openAssignDialog}
                disabled={!selectedClass}
              >
                Assigner des étudiants
              </Button>
              <Button
                variant='outline'
                onClick={() => setIsDetailsOpen(false)}
              >
                Fermer
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign dialog */}
      <Dialog
        open={isAssignOpen}
        onOpenChange={setIsAssignOpen}
      >
        <DialogContent className='max-w-5xl w-[95vw] max-h-[85vh]'>
          <DialogHeader>
            <DialogTitle>Assigner des étudiants</DialogTitle>
            <DialogDescription>
              {selectedClass ? `Classe: ${selectedClass.nom_classe}` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            <div className='flex items-center gap-3'>
              <div className='relative flex-1'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
                <Input
                  className='pl-10'
                  placeholder='Rechercher (nom, email)...'
                  value={assignSearch}
                  onChange={(e) => setAssignSearch(e.target.value)}
                />
              </div>

              <Badge
                variant='secondary'
                className='text-xs'
              >
                {selectedCount} sélectionné(s)
              </Badge>

              <Button
                variant='outline'
                onClick={selectAllVisible}
                disabled={candidatsLoading}
              >
                Tout sélectionner
              </Button>
              <Button
                variant='outline'
                onClick={clearSelection}
                disabled={selectedCount === 0}
              >
                Effacer
              </Button>
            </div>

            <div className='border rounded-lg'>
              <ScrollArea className='h-[480px]'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='w-[60px]'> </TableHead>
                      <TableHead className='w-[260px]'>Nom</TableHead>
                      <TableHead>Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {candidatsLoading ? (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className='py-8 text-center text-sm text-gray-500'
                        >
                          Chargement...
                        </TableCell>
                      </TableRow>
                    ) : assignableCandidats.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className='py-8 text-center text-sm text-gray-500'
                        >
                          Aucun candidat disponible
                        </TableCell>
                      </TableRow>
                    ) : (
                      assignableCandidats.map((c) => (
                        <TableRow key={c.id_utilisateur}>
                          <TableCell className='align-middle'>
                            <input
                              type='checkbox'
                              className='h-4 w-4'
                              checked={!!selectedCandidatIds[c.id_utilisateur]}
                              onChange={() => toggleCandidat(c.id_utilisateur)}
                            />
                          </TableCell>
                          <TableCell className='font-medium'>
                            {c.prenom} {c.nom}
                          </TableCell>
                          <TableCell>{c.email}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>

            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => setIsAssignOpen(false)}
                disabled={assignLoading}
              >
                Annuler
              </Button>
              <Button
                onClick={handleAssignSelected}
                disabled={assignLoading || selectedCount === 0}
              >
                {assignLoading ? "Assignation..." : "Assigner"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
