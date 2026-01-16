import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Badge } from "../ui/badge";
import { Calendar, CheckCircle2, XCircle, Clock } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

interface AttendanceHistoryProps {
  studentId: string;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function AttendanceHistory({
  studentId,
}: AttendanceHistoryProps) {
  const token = localStorage.getItem("token");
  const [loading, setLoading] = useState(true);
  const [presences, setPresences] = useState<any[]>([]);
  const [idEtudiant, setIdEtudiant] = useState<number | null>(null);

  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().getMonth().toString()
  );
  const [selectedSubject, setSelectedSubject] = useState<string>("all");

  // Récupérer id_etudiant
  useEffect(() => {
    const fetchIdEtudiant = async () => {
      try {
        const res = await axios.get(`${API_URL}/etudiants/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data?.success) {
          setIdEtudiant(res.data.data.id_etudiant);
        }
      } catch (error: any) {
        console.error("Erreur récupération id_etudiant:", error);
        toast.error("Erreur chargement profil");
      }
    };

    fetchIdEtudiant();
  }, [token]);

  // Charger présences
  useEffect(() => {
    if (!idEtudiant) return;

    const fetchPresences = async () => {
      try {
        setLoading(true);

        const res = await axios.get(
          `${API_URL}/presences/etudiant/${idEtudiant}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (res.data?.success) {
          setPresences(res.data.data || []);
        } else {
          toast.error("Erreur chargement historique");
        }
      } catch (error: any) {
        console.error("Erreur fetch presences:", error);
        toast.error("Erreur chargement historique");
      } finally {
        setLoading(false);
      }
    };

    fetchPresences();
  }, [idEtudiant, token]);

  // Filtrer par mois et matière
  const filteredRecords = presences.filter((record) => {
    const recordDate = new Date(record.created_at || record.date_seance);
    const monthMatch = recordDate.getMonth() === parseInt(selectedMonth);

    if (selectedSubject === "all") {
      return monthMatch;
    }

    return monthMatch && record.nom_matiere === selectedSubject;
  });

  // Grouper par date
  const recordsByDate = filteredRecords.reduce((acc, record) => {
    const date = new Date(record.created_at || record.date_seance)
      .toISOString()
      .split("T")[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(record);
    return acc;
  }, {} as Record<string, typeof filteredRecords>);

  const sortedDates = Object.keys(recordsByDate).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  // Matières uniques
  const subjects = Array.from(
    new Set(presences.map((p) => p.nom_matiere).filter(Boolean))
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return <CheckCircle2 className='h-5 w-5 text-green-600' />;
      case "absent":
        return <XCircle className='h-5 w-5 text-red-600' />;
      case "retard":
        return <Clock className='h-5 w-5 text-orange-600' />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return (
          <Badge className='bg-green-100 text-green-700 border-green-300 hover:bg-green-100'>
            Présent
          </Badge>
        );
      case "absent":
        return (
          <Badge className='bg-red-100 text-red-700 border-red-300 hover:bg-red-100'>
            Absent
          </Badge>
        );
      case "retard":
        return (
          <Badge className='bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-100'>
            En retard
          </Badge>
        );
      default:
        return null;
    }
  };

  const stats = {
    present: filteredRecords.filter((r) => r.statut === "present").length,
    absent: filteredRecords.filter((r) => r.statut === "absent").length,
    late: filteredRecords.filter((r) => r.statut === "retard").length,
  };

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

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h2 className='text-2xl font-bold'>Historique des Présences</h2>
        <p className='text-gray-500'>Consulte ton historique jour par jour</p>
      </div>

      {/* Stats Summary */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Card className='bg-green-50 border-green-200'>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-green-700'>
                  Jours Présents
                </p>
                <p className='text-3xl font-bold text-green-600'>
                  {stats.present}
                </p>
              </div>
              <CheckCircle2 className='h-10 w-10 text-green-600' />
            </div>
          </CardContent>
        </Card>

        <Card className='bg-red-50 border-red-200'>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-red-700'>
                  Jours Absents
                </p>
                <p className='text-3xl font-bold text-red-600'>
                  {stats.absent}
                </p>
              </div>
              <XCircle className='h-10 w-10 text-red-600' />
            </div>
          </CardContent>
        </Card>

        <Card className='bg-orange-50 border-orange-200'>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-orange-700'>Retards</p>
                <p className='text-3xl font-bold text-orange-600'>
                  {stats.late}
                </p>
              </div>
              <Clock className='h-10 w-10 text-orange-600' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className='pt-6'>
          <div className='flex gap-4'>
            <div className='space-y-2 flex-1'>
              <label className='text-sm font-medium'>Mois</label>
              <Select
                value={selectedMonth}
                onValueChange={setSelectedMonth}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='0'>
                    Janvier {new Date().getFullYear()}
                  </SelectItem>
                  <SelectItem value='1'>
                    Février {new Date().getFullYear()}
                  </SelectItem>
                  <SelectItem value='2'>
                    Mars {new Date().getFullYear()}
                  </SelectItem>
                  <SelectItem value='3'>
                    Avril {new Date().getFullYear()}
                  </SelectItem>
                  <SelectItem value='4'>
                    Mai {new Date().getFullYear()}
                  </SelectItem>
                  <SelectItem value='5'>
                    Juin {new Date().getFullYear()}
                  </SelectItem>
                  <SelectItem value='6'>
                    Juillet {new Date().getFullYear()}
                  </SelectItem>
                  <SelectItem value='7'>
                    Août {new Date().getFullYear()}
                  </SelectItem>
                  <SelectItem value='8'>
                    Septembre {new Date().getFullYear()}
                  </SelectItem>
                  <SelectItem value='9'>
                    Octobre {new Date().getFullYear()}
                  </SelectItem>
                  <SelectItem value='10'>
                    Novembre {new Date().getFullYear()}
                  </SelectItem>
                  <SelectItem value='11'>
                    Décembre {new Date().getFullYear()}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2 flex-1'>
              <label className='text-sm font-medium'>Matière</label>
              <Select
                value={selectedSubject}
                onValueChange={setSelectedSubject}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Toutes les matières</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem
                      key={subject}
                      value={subject}
                    >
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Calendar className='h-5 w-5' />
            Historique Détaillé
          </CardTitle>
          <CardDescription>
            {filteredRecords.length} enregistrement(s) pour cette période
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {sortedDates.map((date) => {
              const dateRecords = recordsByDate[date];
              const dateObj = new Date(date);

              return (
                <div
                  key={date}
                  className='border-l-4 border-indigo-200 pl-4 py-2'
                >
                  <div className='flex items-center gap-2 mb-3'>
                    <Calendar className='h-4 w-4 text-gray-400' />
                    <span className='font-medium'>
                      {dateObj.toLocaleDateString("fr-FR", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  <div className='space-y-2'>
                    {dateRecords.map((record) => (
                      <div
                        key={record.id_presence}
                        className='bg-white p-3 rounded-lg border flex items-center justify-between hover:shadow-md transition-shadow'
                      >
                        <div className='flex items-center gap-3'>
                          {getStatusIcon(record.statut)}
                          <div>
                            <p className='font-medium'>
                              {record.nom_matiere || "Cours"}
                            </p>
                            <p className='text-sm text-gray-500'>
                              {record.heure_debut || "N/A"} -{" "}
                              {record.heure_fin || "N/A"}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(record.statut)}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {sortedDates.length === 0 && (
              <div className='text-center py-12 text-gray-400'>
                <Calendar className='h-12 w-12 mx-auto mb-2 opacity-20' />
                <p>Aucun enregistrement pour cette période</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
