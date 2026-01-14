import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Users,
  BookOpen,
  TrendingUp,
  AlertTriangle,
  BarChart3,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type AdminStats = {
  total_utilisateurs: number;
  total_etudiants: number;
  total_enseignants: number;
  total_classes: number;
  total_matieres: number;
  seances_aujourdhui: number;
  absences_aujourdhui: number;
  remplacements_attente: number;
};

type TopPresence = {
  id_etudiant: number;
  prenom: string;
  nom: string;
  streak_count: number;
  bonus_gagnes: number;
  total_presences: number;
  presences: number;
  taux: number;
};

type ClasseAbsence = {
  nom_classe: string;
  absences: number;
};

export default function StatisticsDashboard() {
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [topPresence, setTopPresence] = useState<TopPresence[]>([]);
  const [classesAbsences, setClassesAbsences] = useState<ClasseAbsence[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");
        if (!token || token === "undefined") {
          throw new Error("Token manquant. Merci de te reconnecter.");
        }

        const res = await axios.get(`${API_BASE}/api/dashboard/admin`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = res.data?.data;

        setStats(data?.stats || null);
        setTopPresence(
          Array.isArray(data?.top_presence) ? data.top_presence : []
        );
        setClassesAbsences(
          Array.isArray(data?.classes_absences) ? data.classes_absences : []
        );
      } catch (e: any) {
        setError(
          e?.response?.data?.message ||
            e?.message ||
            "Erreur lors du chargement des statistiques"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [API_BASE]);

  const tauxPresenceRef = useMemo(() => {
    if (!topPresence.length) return null;
    const values = topPresence
      .map((t) => Number(t.taux))
      .filter((v) => Number.isFinite(v));
    if (!values.length) return null;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  }, [topPresence]);

  const topPresenceChartData = useMemo(() => {
    return topPresence.slice(0, 5).map((s) => ({
      name: `${s.prenom} ${s.nom}`.trim(),
      taux: Number(s.taux),
      presences: s.presences,
      total: s.total_presences,
    }));
  }, [topPresence]);

  const classesAbsencesChartData = useMemo(() => {
    return classesAbsences.slice(0, 5).map((c) => ({
      name: c.nom_classe,
      absences: Number(c.absences),
    }));
  }, [classesAbsences]);

  if (loading) {
    return (
      <div className='text-sm text-gray-500'>
        Chargement des statistiques...
      </div>
    );
  }

  if (error) {
    return (
      <div className='p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700'>
        {error}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className='text-sm text-gray-500'>
        Aucune statistique disponible.
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Titre global */}
      <div>
        <h2 className='text-2xl font-bold'>Statistiques globales</h2>
        <p className='text-gray-600'>
          Vue d’ensemble sur la présence, les utilisateurs et l’activité du jour
        </p>
      </div>

      {/* Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm'>Total Utilisateurs</CardTitle>
            <Users className='h-4 w-4 text-purple-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl'>{stats.total_utilisateurs}</div>
            <p className='text-xs text-gray-500 mt-1'>
              {stats.total_etudiants} étudiants • {stats.total_enseignants}{" "}
              enseignants
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm'>Classes</CardTitle>
            <BookOpen className='h-4 w-4 text-green-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl'>{stats.total_classes}</div>
            <p className='text-xs text-gray-500 mt-1'>
              {stats.total_matieres} matières
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm'>Présence (référence)</CardTitle>
            <TrendingUp className='h-4 w-4 text-indigo-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl'>
              {tauxPresenceRef !== null ? `${tauxPresenceRef}%` : "—"}
            </div>
            <p className='text-xs text-gray-500 mt-1'>
              Basé sur le top présence (temporaire)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm'>Aujourd’hui</CardTitle>
            <AlertTriangle className='h-4 w-4 text-gray-700' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl'>{stats.absences_aujourdhui}</div>
            <p className='text-xs text-gray-500 mt-1'>
              Absences • {stats.seances_aujourdhui} séances •{" "}
              {stats.remplacements_attente} en attente
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div>
        <h3 className='text-xl font-semibold flex items-center gap-2'>
          <BarChart3 className='h-5 w-5' />
          Graphiques
        </h3>
        <p className='text-gray-600'>
          Analyse rapide de la présence et des absences
        </p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <Card>
          <CardHeader>
            <CardTitle>Top 5 présence (%)</CardTitle>
            <CardDescription>
              Meilleurs taux de présence par étudiant
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topPresenceChartData.length === 0 ? (
              <div className='h-[300px] flex items-center justify-center text-sm text-gray-500'>
                Pas de données pour le moment
              </div>
            ) : (
              <ResponsiveContainer
                width='100%'
                height={300}
              >
                <BarChart
                  data={topPresenceChartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis
                    dataKey='name'
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={-15}
                    textAnchor='end'
                    height={60}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value: any, _name: any, props: any) => {
                      const v = Number(value);
                      const p = props?.payload;
                      return [
                        `${v.toFixed(2)}%`,
                        `Présence (${p.presences}/${p.total})`,
                      ];
                    }}
                  />
                  <Bar
                    dataKey='taux'
                    fill='#4f46e5'
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Absences par classe (Top 5)</CardTitle>
            <CardDescription>
              Classes avec le plus d’absences enregistrées
            </CardDescription>
          </CardHeader>
          <CardContent>
            {classesAbsencesChartData.length === 0 ? (
              <div className='h-[300px] flex items-center justify-center text-sm text-gray-500'>
                Aucune absence enregistrée
              </div>
            ) : (
              <ResponsiveContainer
                width='100%'
                height={300}
              >
                <BarChart
                  data={classesAbsencesChartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis
                    dataKey='name'
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={-15}
                    textAnchor='end'
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: any) => [`${Number(value)}`, "Absences"]}
                  />
                  <Bar
                    dataKey='absences'
                    fill='#6b7280'
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Listes */}
      <div>
        <h3 className='text-xl font-semibold'>Top 5 présence</h3>
        <p className='text-gray-600'>
          Étudiants avec le meilleur taux de présence
        </p>
      </div>

      <Card>
        <CardContent className='pt-6'>
          <div className='space-y-3'>
            {topPresence.slice(0, 5).map((s) => (
              <div
                key={s.id_etudiant}
                className='flex items-center justify-between p-4 bg-white rounded-lg border'
              >
                <div>
                  <p className='font-medium'>
                    {s.prenom} {s.nom}
                  </p>
                  <p className='text-xs text-gray-500'>
                    Streak : {s.streak_count} • Bonus : {s.bonus_gagnes}
                  </p>
                </div>
                <div className='text-right'>
                  <p className='font-semibold'>{Number(s.taux).toFixed(2)}%</p>
                  <p className='text-xs text-gray-500'>
                    {s.presences}/{s.total_presences} présents
                  </p>
                </div>
              </div>
            ))}

            {topPresence.length === 0 && (
              <p className='text-center text-gray-500 py-8'>
                Aucune donnée de présence pour le moment
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
