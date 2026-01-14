import { useEffect, useMemo, useState } from "react";
import axios from "axios";

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";

import { UserPlus, Search, Mail, Key, Users } from "lucide-react";
import { toast } from "sonner";

type ApiEtudiant = {
  id_etudiant: number;
  id_utilisateur: number;
  id_classe: number | null;
  prenom: string;
  nom: string;
  email: string;
  niveau?: string | null;
  nom_classe?: string | null;
  matricule?: string | null;
};

type ApiEnseignant = {
  id_enseignant: number;
  id_utilisateur: number;
  prenom: string;
  nom: string;
  email: string;
  specialite?: string | null;
  type_contrat?: string | null;
  nom_departement?: string | null;
};

type UiUser = {
  id: string; // student-1 / teacher-2
  role: "student" | "teacher";
  firstName: string;
  lastName: string;
  email: string;
  details: string;
};

type ApiClasse = {
  id_classe: number;
  nom_classe: string;
  niveau?: string | null;
  annee_scolaire?: string | null;
};

export default function UserManagement() {
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<UiUser[]>([]);
  const [teachers, setTeachers] = useState<UiUser[]>([]);

  // ✅ classes (pour le select)
  const [classesLoading, setClassesLoading] = useState(false);
  const [classes, setClasses] = useState<ApiClasse[]>([]);

  // ✅ champs formulaire création
  const [createRole, setCreateRole] = useState<"student" | "teacher">(
    "student"
  );
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<string>(""); // string pour Select

  // ✅ mot de passe auto: prenom + 123
  const generatedPassword = (firstName || "").trim()
    ? `${firstName.trim()}123`
    : "";

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<"student" | "teacher" | "admin">(
    "student"
  );

  const allUsers = useMemo(
    () => [...students, ...teachers],
    [students, teachers]
  );

  const filteredUsers = useMemo(() => {
    return allUsers.filter((user) => {
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch =
        !q ||
        user.firstName.toLowerCase().includes(q) ||
        user.lastName.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q);

      const matchesRole = filterRole === "all" || user.role === filterRole;

      return matchesSearch && matchesRole;
    });
  }, [allUsers, searchQuery, filterRole]);

  const getTokenOrThrow = () => {
    const token = localStorage.getItem("token");
    if (!token || token === "undefined")
      throw new Error("Token manquant. Merci de te reconnecter.");
    return token;
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = getTokenOrThrow();

      const res = await axios.get(`${API_BASE}/api/utilisateurs`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = Array.isArray(res.data?.data) ? res.data.data : [];

      // data: { id_utilisateur, prenom, nom, email, role }
      const uiUsers = data.map((u: any) => ({
        id: `user-${u.id_utilisateur}`,
        role: String(u.role).toLowerCase(), // "student" | "teacher" | "admin"
        firstName: u.prenom,
        lastName: u.nom,
        email: u.email,
        details: "—",
      }));

      // si tu veux garder tes compteurs student/teacher :
      setStudents(uiUsers.filter((u: any) => u.role === "student"));
      setTeachers(uiUsers.filter((u: any) => u.role === "teacher"));
    } catch (e: any) {
      toast.error("Erreur chargement utilisateurs", {
        description:
          e?.response?.data?.message || e?.message || "Erreur inconnue",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    setClassesLoading(true);
    try {
      const token = getTokenOrThrow();
      const res = await axios.get(`${API_BASE}/api/classes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: ApiClasse[] = Array.isArray(res.data?.data)
        ? res.data.data
        : [];
      setClasses(data);
    } catch (e: any) {
      toast.error("Erreur chargement classes", {
        description:
          e?.response?.data?.message || e?.message || "Erreur inconnue",
      });
    } finally {
      setClassesLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_BASE]);

  // Quand on ouvre le dialog, on charge les classes (une seule fois si déjà chargé)
  useEffect(() => {
    if (!isCreateDialogOpen) return;
    if (classes.length > 0) return;
    fetchClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCreateDialogOpen]);

  const resetCreateForm = () => {
    setCreateRole("student");
    setFirstName("");
    setLastName("");
    setEmail("");
    setSelectedClassId("");
  };

  const handleCreateUser = async () => {
    try {
      const token = getTokenOrThrow();

      if (!firstName.trim() || !lastName.trim() || !email.trim()) {
        toast.error("Champs obligatoires", {
          description: "Prénom, nom et email sont obligatoires.",
        });
        return;
      }

      if (createRole === "student" && !selectedClassId) {
        toast.error("Classe obligatoire", {
          description: "Choisis une classe pour l'étudiante.",
        });
        return;
      }

      if (!generatedPassword) {
        toast.error("Mot de passe", {
          description:
            "Impossible de générer le mot de passe. Vérifie le prénom.",
        });
        return;
      }

      await axios.post(
        `${API_BASE}/api/utilisateurs`,
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          password: generatedPassword, // prenom + 123
          role: createRole,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Utilisateur créé", {
        description: `Mot de passe: ${generatedPassword}`,
      });
      setIsCreateDialogOpen(false);
      resetCreateForm();
      fetchUsers();
    } catch (e: any) {
      toast.error("Erreur création utilisateur", {
        description:
          e?.response?.data?.message || e?.message || "Erreur inconnue",
      });
    }
  };

  const handleUpdateUser = async () => {
    try {
      const token = getTokenOrThrow();
      const id = editingUser.id.replace("user-", "");

      await axios.put(
        `${API_BASE}/api/utilisateurs/${id}`,
        {
          firstName: editFirstName,
          lastName: editLastName,
          email: editEmail,
          role: editRole,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Utilisateur modifié");
      setIsEditDialogOpen(false);
      fetchUsers();
    } catch (e: any) {
      toast.error("Erreur modification", {
        description: e?.response?.data?.message || e.message,
      });
    }
  };

  const handleDeleteUser = async (user: any) => {
    if (!confirm(`Supprimer ${user.firstName} ${user.lastName} ?`)) return;

    try {
      const token = getTokenOrThrow();

      const id = user.id.replace("user-", "");

      await axios.delete(`${API_BASE}/api/utilisateurs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Utilisateur supprimé");
      fetchUsers();
    } catch (e: any) {
      toast.error("Erreur suppression", {
        description: e?.response?.data?.message || e.message,
      });
    }
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl'>Gestion des Utilisateurs</h2>
          <p className='text-gray-500'>
            Créer et gérer les comptes étudiants et professeurs
          </p>
        </div>

        <Dialog
          open={isCreateDialogOpen}
          onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (!open) resetCreateForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className='gap-2'>
              <UserPlus className='h-4 w-4' />
              Créer un utilisateur
            </Button>
          </DialogTrigger>

          <DialogContent className='max-w-md'>
            <DialogHeader>
              <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
              <DialogDescription>
                Le mot de passe est généré automatiquement:{" "}
                <span className='font-medium'>prenom + 123</span>.
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-4 py-4'>
              <div className='space-y-2'>
                <Label>Type d'utilisateur</Label>
                <Select
                  value={createRole}
                  onValueChange={(v) => setCreateRole(v as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='student'>Étudiant</SelectItem>
                    <SelectItem value='teacher'>Professeur</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label>Prénom</Label>
                  <Input
                    placeholder='Jean'
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Nom</Label>
                  <Input
                    placeholder='Dupont'
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label>Email</Label>
                <Input
                  type='email'
                  placeholder='ex: jean.dupont@ecole.com'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Mot de passe auto (readonly) */}
              <div className='space-y-2'>
                <Label>Mot de passe (auto)</Label>
                <div className='relative'>
                  <Key className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
                  <Input
                    className='pl-10'
                    value={generatedPassword || "—"}
                    readOnly
                  />
                </div>
                <p className='text-xs text-gray-500'>
                  Exemple: si prénom = <span className='font-medium'>Sara</span>{" "}
                  → mot de passe = <span className='font-medium'>Sara123</span>
                </p>
              </div>

              {/* Classe (étudiant uniquement) */}
              {createRole === "student" && (
                <div className='space-y-2'>
                  <Label>Classe</Label>
                  <Select
                    value={selectedClassId}
                    onValueChange={setSelectedClassId}
                    disabled={classesLoading}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          classesLoading
                            ? "Chargement..."
                            : "Choisir une classe"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((c) => (
                        <SelectItem
                          key={c.id_classe}
                          value={String(c.id_classe)}
                        >
                          {c.nom_classe}
                          {c.niveau ? ` • ${c.niveau}` : ""}
                          {c.annee_scolaire ? ` • ${c.annee_scolaire}` : ""}
                        </SelectItem>
                      ))}
                      {!classesLoading && classes.length === 0 && (
                        <SelectItem
                          value='__none'
                          disabled
                        >
                          Aucune classe trouvée
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button onClick={handleCreateUser}>Créer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-500'>Total Étudiants</p>
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
                <p className='text-sm text-gray-500'>Total Professeurs</p>
                <p className='text-2xl'>{teachers.length}</p>
              </div>
              <Users className='h-8 w-8 text-green-600' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-500'>Total Utilisateurs</p>
                <p className='text-2xl'>{allUsers.length}</p>
              </div>
              <Users className='h-8 w-8 text-indigo-600' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters + Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Utilisateurs</CardTitle>
          <CardDescription>
            Rechercher et filtrer les utilisateurs
          </CardDescription>
        </CardHeader>

        <CardContent className='space-y-4'>
          <div className='flex gap-4'>
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
              <Input
                placeholder='Rechercher par nom, prénom ou email...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-10'
              />
            </div>

            <Select
              value={filterRole}
              onValueChange={setFilterRole}
            >
              <SelectTrigger className='w-48'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tous les rôles</SelectItem>
                <SelectItem value='student'>Étudiants</SelectItem>
                <SelectItem value='teacher'>Professeurs</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='border rounded-lg'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead className='w-[180px] text-center'>
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className='text-center text-sm text-gray-500 py-8'
                    >
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className='text-center text-sm text-gray-500 py-8'
                    >
                      Aucun utilisateur trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        {user.firstName} {user.lastName}
                      </TableCell>

                      <TableCell className='flex items-center gap-2'>
                        <Mail className='h-4 w-4 text-gray-400' />
                        {user.email}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={
                            user.role === "student" ? "default" : "secondary"
                          }
                        >
                          {user.role === "student" ? "Étudiant" : "Professeur"}
                        </Badge>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className='text-center'>
                        <div className='inline-flex items-center gap-2'>
                          <Button
                            variant='outline'
                            size='sm'
                            className='h-8 px-3'
                            onClick={() => {
                              setEditingUser(user);
                              setEditFirstName(user.firstName);
                              setEditLastName(user.lastName);
                              setEditEmail(user.email);
                              setEditRole(user.role);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            Modifier
                          </Button>

                          <Button
                            variant='outline'
                            size='sm'
                            className='h-8 px-3 border-red-200 text-red-600 hover:bg-red-50'
                            onClick={() => handleDeleteUser(user)}
                          >
                            Supprimer
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      >
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Modifier utilisateur</DialogTitle>
            <DialogDescription>
              Modifier les informations de base de l’utilisateur
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>Prénom</Label>
                <Input
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                />
              </div>
              <div className='space-y-2'>
                <Label>Nom</Label>
                <Input
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label>Email</Label>
              <Input
                type='email'
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
            </div>

            <div className='space-y-2'>
              <Label>Rôle</Label>
              <Select
                value={editRole}
                onValueChange={(v) => setEditRole(v as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='student'>Étudiant</SelectItem>
                  <SelectItem value='teacher'>Professeur</SelectItem>
                  <SelectItem value='admin'>Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsEditDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button onClick={handleUpdateUser}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
