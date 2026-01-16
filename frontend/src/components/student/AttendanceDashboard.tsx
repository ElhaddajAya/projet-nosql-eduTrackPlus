import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import {
  TrendingUp,
  Award,
  Calendar,
  Target,
  BookOpen,
  Flame,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
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

interface AttendanceDashboardProps {
  studentId: string;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const COLORS = {
  present: "#10b981",
  absent: "#ef4444",
  retard: "#f59e0b",
};

export default function AttendanceDashboard({
  studentId,
}: AttendanceDashboardProps) {
  const token = localStorage.getItem("token");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [idEtudiant, setIdEtudiant] = useState<number | null>(null);

  useEffect(() => {
    const fetchIdEtudiant = async () => {
      try {
        const res = await axios.get(`${API_URL}/etudiants/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data?.success) {
          const id = res.data.data.id_etudiant;
          console.log("✅ ID Étudiant récupéré:", id);
          setIdEtudiant(id);
        } else {
          toast.error("Profil étudiant non trouvé");
        }
      } catch (error: any) {
        console.error("❌ Erreur récupération id_etudiant:", error);
        toast.error("Erreur chargement profil");
      }
    };

    fetchIdEtudiant();
  }, [token]);

  useEffect(() => {
    if (!idEtudiant) return;

    const fetchStats = async () => {
      try {
        setLoading(true);

        console.log(`📊 Chargement stats pour étudiant ${idEtudiant}...`);

        const res = await axios.get(
          `${API_URL}/dashboard/student/${idEtudiant}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.data?.success) {
          toast.error("Erreur chargement statistiques");
          return;
        }

        const data = res.data.data;
        console.log("📊 Données reçues:", data);

        // ✅ VÉRIFIER LES DONNÉES DE PRÉSENCE
        const presents = data.presences?.presents || 0;
        const absents = data.presences?.absents || 0;
        const retards = data.presences?.retards || 0;
        const total = data.presences?.total || 0;

        console.log(
          `📊 Présences: ${presents}/${total} (${absents} absents, ${retards} retards)`
        );

        // ✅ CRÉER PIE DATA SEULEMENT SI DONNÉES EXISTENT
        const pieData =
          total > 0
            ? [
                {
                  name: "Présent",
                  value: presents,
                  color: COLORS.present,
                },
                {
                  name: "Absent",
                  value: absents,
                  color: COLORS.absent,
                },
                {
                  name: "Retard",
                  value: retards,
                  color: COLORS.retard,
                },
              ].filter((d) => d.value > 0)
            : [];

        console.log("📊 pieData:", pieData);

        // ✅ GRAPHIQUE PAR MATIÈRE
        const chartMatiere = (data.coursLesPlusSuivis || []).map((c: any) => {
          const taux =
            c.total_presences > 0
              ? parseFloat(((c.presents / c.total_presences) * 100).toFixed(1))
              : 0;

          console.log(
            `  📚 ${c.nom_matiere}: ${c.presents}/${c.total_presences} = ${taux}%`
          );

          return {
            matiere: c.nom_matiere,
            taux,
          };
        });

        console.log("📊 chartMatiere:", chartMatiere);

        setStats({
          ...data,
          pieData,
          chartMatiere,
        });
      } catch (error: any) {
        console.error("❌ Erreur fetch stats:", error);
        toast.error("Erreur chargement statistiques");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [idEtudiant, token]);

  if (loading) {
    return (
      <div className='flex items-center justify-center h-96'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto'></div>
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

  const streak = stats.etudiant?.streak || 0;
  const streakBonus = Math.floor(streak / 5);
  const progressToNextBonus = ((streak % 5) / 5) * 100;

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg p-6'>
        <h2 className='text-2xl font-bold mb-2'>
          Bonjour, {stats.etudiant?.nom} ! 👋
        </h2>
        <p className='opacity-90'>
          {stats.presences?.tauxPresence >= 80
            ? "Continue comme ça! Ton taux de présence est excellent."
            : "Tu peux améliorer ton taux de présence!"}
        </p>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <Card className='bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm text-green-700'>
              Taux de Présence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold text-green-600 mb-2'>
              {stats.presences?.tauxPresence || 0}%
            </div>
            <Progress
              value={stats.presences?.tauxPresence || 0}
              className='mt-2'
            />
            <p className='text-xs text-gray-600 mt-2'>
              {stats.presences?.presents || 0}/{stats.presences?.total || 0}{" "}
              séances
            </p>
          </CardContent>
        </Card>

        <Card className='bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm text-blue-700'>
              Jours Présents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold text-blue-600 mb-2'>
              {stats.presences?.presents || 0}
            </div>
            <p className='text-xs text-gray-600'>
              sur {stats.presences?.total || 0} jours
            </p>
          </CardContent>
        </Card>

        <Card className='bg-gradient-to-br from-orange-50 to-red-50 border-orange-200'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm text-orange-700 flex items-center gap-2'>
              <Flame className='h-4 w-4' />
              Série Actuelle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold text-orange-600 mb-2'>
              {streak} jours
            </div>
            <p className='text-xs text-gray-600'>
              {5 - (streak % 5)} jours pour +1%
            </p>
            <Progress
              value={progressToNextBonus}
              className='mt-2'
            />
          </CardContent>
        </Card>

        <Card className='bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm text-purple-700 flex items-center gap-2'>
              <Award className='h-4 w-4' />
              Récompenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold text-purple-600 mb-2'>
              {streakBonus}
            </div>
            <p className='text-xs text-gray-600'>
              bonus gagnés ({streakBonus}%)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Streak Explanation */}
      <Card className='bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-orange-700'>
            <Flame className='h-5 w-5' />
            Système de Séries (Streak)
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          <p className='text-sm text-gray-700'>
            Pour chaque <strong>5 jours consécutifs</strong> de présence, tu
            gagnes <strong>+1%</strong> à ton taux de présence! 🎯
          </p>
          <div className='flex items-center gap-4 bg-white p-4 rounded-lg border border-orange-200'>
            <div className='flex-1'>
              <p className='text-sm font-medium mb-2'>
                Progrès vers le prochain bonus:
              </p>
              <Progress
                value={progressToNextBonus}
                className='h-3'
              />
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-orange-600'>
                {streak % 5}/5
              </div>
              <p className='text-xs text-gray-500'>jours</p>
            </div>
          </div>
          {streakBonus > 0 && (
            <div className='bg-green-100 text-green-800 p-3 rounded-lg flex items-start gap-2'>
              <CheckCircle2 className='h-5 w-5 mt-0.5' />
              <p className='text-sm'>
                Excellent! Tu as gagné {streakBonus} bonus. Continue sur cette
                lancée!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Graphiques */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* ⭐ GRAPHIQUE PAR MATIÈRE */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <BookOpen className='h-5 w-5' />
              Présence par Matière
            </CardTitle>
            <CardDescription>Ton assiduité dans chaque cours</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.chartMatiere && stats.chartMatiere.length > 0 ? (
              <ResponsiveContainer
                width='100%'
                height={300}
              >
                <BarChart data={stats.chartMatiere}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis
                    dataKey='matiere'
                    angle={-45}
                    textAnchor='end'
                    height={100}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey='taux'
                    fill='#6366f1'
                    name='Taux de présence (%)'
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className='h-[300px] flex flex-col items-center justify-center text-gray-500'>
                <BookOpen className='h-16 w-16 mb-4 opacity-20' />
                <p className='text-lg font-medium'>Aucune donnée</p>
                <p className='text-sm mt-2'>
                  Assiste à des cours pour voir tes stats
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ⭐ GRAPHIQUE PIE - CORRIGÉ */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <TrendingUp className='h-5 w-5' />
              Répartition des Présences
            </CardTitle>
            <CardDescription>Distribution de ton assiduité</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.pieData && stats.pieData.length > 0 ? (
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
              <div className='h-[300px] flex flex-col items-center justify-center text-gray-500'>
                <TrendingUp className='h-16 w-16 mb-4 opacity-20' />
                <p className='text-lg font-medium'>Aucune donnée disponible</p>
                <p className='text-sm mt-2 text-center px-4'>
                  Assiste à quelques cours pour voir tes statistiques ici
                </p>
                <div className='mt-4 text-xs text-gray-400'>
                  Total: {stats.presences?.total || 0} séances
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerte si besoin */}
      {stats.presences?.tauxPresence < 80 && stats.presences?.total > 0 && (
        <Card className='bg-red-50 border-red-200'>
          <CardContent className='pt-6'>
            <div className='flex items-start gap-3'>
              <AlertCircle className='h-5 w-5 text-red-600 mt-0.5' />
              <div>
                <p className='font-semibold text-red-800'>
                  Attention! Ton taux de présence est inférieur à 80%.
                </p>
                <p className='text-sm text-red-700 mt-1'>
                  Essaie d'être plus assidu pour améliorer tes résultats et
                  gagner des bonus!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
