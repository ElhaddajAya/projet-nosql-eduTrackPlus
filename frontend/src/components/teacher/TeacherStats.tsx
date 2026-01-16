import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import {
  Calendar,
  Users,
  BookOpen,
  TrendingUp,
  Clock,
  BarChart3,
  AlertTriangle,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import axios from "axios";
import { toast } from "sonner";

interface TeacherStatsProps {
  teacherId: string;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const STATUS_COLORS: Record<string, string> = {
  prevue: "#6366f1",
  remplacee: "#3b82f6",
  reportee: "#10b981",
  annulee: "#ef4444",
  rattrapage: "#a855f7",
};

export default function TeacherStats({ teacherId }: TeacherStatsProps) {
  const token = localStorage.getItem("token");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [idEnseignant, setIdEnseignant] = useState<number | null>(null);

  // Récupération id_enseignant
  useEffect(() => {
    const fetchIdEnseignant = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const id_utilisateur = user?.id || user?.id_utilisateur;

        if (!id_utilisateur) {
          toast.error("Utilisateur non connecté");
          return;
        }

        const res = await axios.get(`${API_URL}/enseignants`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data?.success) {
          const enseignants = res.data.data || [];
          const enseignant = enseignants.find(
            (e: any) => e.id_utilisateur === id_utilisateur
          );

          if (enseignant) {
            setIdEnseignant(enseignant.id_enseignant);
          } else {
            toast.error("Profil enseignant non trouvé");
          }
        }
      } catch (error: any) {
        console.error("Erreur récupération id_enseignant:", error);
        toast.error("Erreur chargement profil");
      }
    };

    fetchIdEnseignant();
  }, [token]);

  // Chargement stats
  useEffect(() => {
    if (!idEnseignant) return;

    const fetchStats = async () => {
      try {
        setLoading(true);

        const res = await axios.get(
          `${API_URL}/dashboard/teacher/${idEnseignant}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.data?.success) {
          toast.error("Erreur chargement statistiques");
          return;
        }

        const data = res.data.data;

        const pieData = (data.seancesParStatut || [])
          .filter((s: any) => s.total > 0)
          .map((s: any) => ({
            name:
              s.statut === "prevue"
                ? "Prévue"
                : s.statut === "remplacee"
                ? "Remplacée"
                : s.statut === "reportee"
                ? "Reportée"
                : s.statut === "annulee"
                ? "Annulée"
                : "Rattrapage",
            value: s.total,
            color: STATUS_COLORS[s.statut] || "#6b7280",
          }));

        const now = new Date();
        const next7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(now);
          d.setDate(d.getDate() + i);
          return d.toISOString().split("T")[0];
        });

        const seancesParJour = next7Days.map((date) => {
          const count = (data.prochainesSeances || []).filter(
            (s: any) => s.date_seance.split("T")[0] === date
          ).length;
          return {
            date: new Date(date).toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "2-digit",
            }),
            count,
          };
        });

        setStats({
          ...data,
          pieData,
          seancesParJour,
        });
      } catch (error: any) {
        console.error("Erreur fetch stats:", error);
        toast.error("Erreur chargement statistiques");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [idEnseignant, token]);

  if (loading) {
    return (
      <div className='flex items-center justify-center h-96'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto'></div>
          <p className='mt-4 text-gray-500'>Chargement...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className='text-center py-12'>
        <p className='text-gray-500'>Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h2 className='text-2xl font-bold'>Statistiques de mes Classes</h2>
        <p className='text-gray-500'>
          Vue d'ensemble des présences de vos étudiants
        </p>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm'>Mes Classes</CardTitle>
            <Users className='h-4 w-4 text-blue-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {stats.stats?.classesEnseignees || 0}
            </div>
            <p className='text-xs text-gray-500 mt-1'>
              {stats.stats?.coursEnseignes || 0} cours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm'>Taux de Présence Moyen</CardTitle>
            <TrendingUp className='h-4 w-4 text-green-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {stats.stats?.tauxPresenceMoyen || 0}%
            </div>
            <p className='text-xs text-green-600 mt-1'>de vos étudiants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm'>Séances Cette Semaine</CardTitle>
            <Calendar className='h-4 w-4 text-indigo-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {stats.stats?.seancesCetteSemaine || 0}
            </div>
            <p className='text-xs text-gray-500 mt-1'>prévues</p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <Card>
          <CardHeader>
            <CardTitle>Répartition des Séances</CardTitle>
            <CardDescription>Par statut</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.pieData?.length > 0 ? (
              <ResponsiveContainer
                width='100%'
                height={300}
              >
                <PieChart>
                  <Pie
                    data={stats.pieData}
                    cx='50%'
                    cy='50%'
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={100}
                    fill='#8884d8'
                    dataKey='value'
                  >
                    {stats.pieData.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className='h-[300px] flex items-center justify-center text-gray-500'>
                Aucune donnée
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Séances - 7 Prochains Jours</CardTitle>
            <CardDescription>Charge de travail à venir</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer
              width='100%'
              height={300}
            >
              <BarChart data={stats.seancesParJour}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='date' />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey='count'
                  fill='#10b981'
                  name='Séances'
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Classes Enseignées */}
      <Card>
        <CardHeader>
          <CardTitle>Mes Classes</CardTitle>
          <CardDescription>
            Liste des classes que vous enseignez
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.classesEnseignees?.length > 0 ? (
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              {stats.classesEnseignees.map((c: any, idx: number) => (
                <div
                  key={idx}
                  className='bg-green-50 border border-green-200 rounded-lg p-4 text-center'
                >
                  <p className='font-semibold text-green-900'>{c.nom_classe}</p>
                  <p className='text-xs text-green-600'>{c.niveau}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className='text-center text-gray-500 py-4'>
              Aucune classe assignée
            </p>
          )}
        </CardContent>
      </Card>

      {/* Prochaines Séances */}
      <Card>
        <CardHeader>
          <CardTitle>Prochaines Séances</CardTitle>
          <CardDescription>Vos 5 prochains cours à venir</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-2'>
            {stats.prochainesSeances?.length > 0 ? (
              stats.prochainesSeances.slice(0, 5).map((s: any) => (
                <div
                  key={s.id_seance}
                  className='flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:shadow-md transition-shadow'
                >
                  <div className='flex items-center gap-4'>
                    <div className='text-center'>
                      <p className='text-2xl font-bold text-green-600'>
                        {new Date(s.date_seance).getDate()}
                      </p>
                      <p className='text-xs text-gray-500'>
                        {new Date(s.date_seance).toLocaleDateString("fr-FR", {
                          month: "short",
                        })}
                      </p>
                    </div>
                    <div>
                      <p className='font-medium'>{s.nom_matiere}</p>
                      <p className='text-sm text-gray-600'>{s.nom_classe}</p>
                      <p className='text-xs text-gray-500 mt-1'>
                        {s.heure_debut} - {s.heure_fin} | Salle {s.id_salle}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      s.statut === "prevue"
                        ? "default"
                        : s.statut === "remplacee"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {s.statut === "prevue"
                      ? "Prévue"
                      : s.statut === "remplacee"
                      ? "Remplacée"
                      : s.statut === "reportee"
                      ? "Reportée"
                      : s.statut === "rattrapage"
                      ? "Rattrapage"
                      : "Annulée"}
                  </Badge>
                </div>
              ))
            ) : (
              <p className='text-center text-gray-500 py-8'>
                Aucune séance prévue prochainement
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
