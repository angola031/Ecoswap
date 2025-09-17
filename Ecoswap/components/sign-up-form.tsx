"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { registerUser, type RegisterData } from "../../lib/auth";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validaciones del formulario
    if (password !== repeatPassword) {
      setError("Las contraseñas no coinciden");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      setIsLoading(false);
      return;
    }

    if (!name.trim()) {
      setError("El nombre es requerido");
      setIsLoading(false);
      return;
    }

    if (!phone.trim()) {
      setError("El teléfono es requerido");
      setIsLoading(false);
      return;
    }

    if (!location) {
      setError("La ubicación es requerida");
      setIsLoading(false);
      return;
    }

    try {
      const registerData: RegisterData = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        location: location,
        password: password
      };

      const { user, error: registerError, needsVerification } = await registerUser(registerData);

      if (registerError) {
        setError(registerError);
        setIsLoading(false);
        return;
      }

      if (needsVerification) {
        router.push("/auth/sign-up-success");
        return;
      }

      if (user) {
        router.push("/auth/sign-up-success");
      }
    } catch (error: unknown) {
      console.error('Error en registro:', error);
      setError("Error interno del servidor. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Sign up</CardTitle>
          <CardDescription>Create a new account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre Completo</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Tu nombre completo"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+57 300 123 4567"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="location">Ciudad</Label>
                <select
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="">Selecciona una ciudad</option>
                  <option value="Pereira, Risaralda">Pereira, Risaralda</option>
                  <option value="Bogotá D.C.">Bogotá D.C.</option>
                  <option value="Medellín, Antioquia">Medellín, Antioquia</option>
                  <option value="Cali, Valle del Cauca">Cali, Valle del Cauca</option>
                  <option value="Barranquilla, Atlántico">Barranquilla, Atlántico</option>
                  <option value="Cartagena, Bolívar">Cartagena, Bolívar</option>
                </select>
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="repeat-password">Repeat Password</Label>
                </div>
                <Input
                  id="repeat-password"
                  type="password"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link href="/auth/login" className="underline underline-offset-4">
                Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
