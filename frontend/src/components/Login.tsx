import { useState } from "react";
import { GraduationCap } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import axios from "axios";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface LoginProps {
  onLogin: (user: any) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Formulaire soumis !");

    setIsLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        {
          email,
          password,
        }
      );

      console.log("Réponse complète du backend :", response.data);

      // ✅ Ton backend renvoie: { success, message, data: { token, user } }
      const payload = response.data?.data;
      const token = payload?.token;
      const user = payload?.user;

      if (!token || !user) {
        throw new Error("Réponse invalide : token ou user manquant");
      }

      // ✅ Stockage (en évitant "undefined")
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // ✅ Nom d’accueil (backend: firstName/lastName, mais on garde aussi prenom/nom au cas où)
      const first =
        user.firstName ||
        user.prenom ||
        user.email?.split("@")[0] ||
        "Utilisateur";
      const last = user.lastName || user.nom || "";
      const welcomeName = `${first} ${last}`.trim();

      toast.success(`Bienvenue ${welcomeName} !`);

      // ✅ Redirection selon rôle
      const role = String(user.role || "").toLowerCase();

      if (role === "admin") {
        navigate("/admin");
      } else if (role === "teacher") {
        navigate("/teacher");
      } else if (role === "student") {
        navigate("/student");
      } else {
        toast.error("Rôle inconnu");
      }

      onLogin(user);
    } catch (error: any) {
      console.error("Erreur login complète :", error);

      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Erreur de connexion";

      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4'>
      <Card className='w-full max-w-md shadow-xl'>
        <CardHeader className='space-y-1 text-center'>
          <div className='flex items-center justify-center mb-4'>
            <GraduationCap className='h-12 w-12 text-primary' />
          </div>
          <CardTitle className='text-2xl font-bold'>EduTrackPlus</CardTitle>
          <CardDescription>Connectez-vous à votre espace</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            className='space-y-4'
          >
            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                type='email'
                placeholder='exemple@edutrackplus.com'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='password'>Mot de passe</Label>
              <Input
                id='password'
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button
              type='submit'
              className='w-full'
              disabled={isLoading}
            >
              {isLoading ? "Connexion en cours..." : "Se connecter"}
            </Button>
          </form>

          {/* Quick login pour tests */}
          <div className='mt-6 text-center text-sm text-muted-foreground'>
            Test rapide :
            <div className='flex justify-center gap-3 mt-2 flex-wrap'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => {
                  setEmail("admin@edutrackplus.com");
                  setPassword("admin123");
                }}
              >
                Admin
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => {
                  setEmail("m.alami@emsi.ma");
                  setPassword("Prof123!");
                }}
              >
                Prof
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => {
                  setEmail("z.benmoussa@emsi.ma");
                  setPassword("Student123!");
                }}
              >
                Étudiant
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
