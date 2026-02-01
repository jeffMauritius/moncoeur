"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
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
import { Separator } from "@/components/ui/separator";
import { Loader2, Save, User, Bell, Shield } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSaveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    // Simulate save (would connect to API)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setLoading(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Parametres</h1>
        <p className="text-muted-foreground">
          Gerez vos preferences et parametres de compte
        </p>
      </div>

      <div className="grid gap-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <CardTitle>Profil</CardTitle>
            </div>
            <CardDescription>
              Vos informations personnelles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet</Label>
                  <Input
                    id="name"
                    defaultValue={session?.user?.name || ""}
                    placeholder="Votre nom"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue={session?.user?.email || ""}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    L&apos;email ne peut pas etre modifie
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Enregistrer
                </Button>
              </div>
              {success && (
                <p className="text-sm text-green-600 text-center">
                  Parametres enregistres avec succes
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>
              Configurez vos preferences de notification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notifications email</Label>
                <p className="text-sm text-muted-foreground">
                  Recevoir des emails pour les evenements importants
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Nouveau sac enregistre</Label>
                <p className="text-sm text-muted-foreground">
                  Notification quand un nouveau sac est ajoute au stock
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Vente realisee</Label>
                <p className="text-sm text-muted-foreground">
                  Notification quand une vente est enregistree
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Rapport hebdomadaire</Label>
                <p className="text-sm text-muted-foreground">
                  Recevoir un resume des performances chaque semaine
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Securite</CardTitle>
            </div>
            <CardDescription>
              Parametres de securite de votre compte
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Mot de passe actuel</Label>
              <Input
                id="current-password"
                type="password"
                placeholder="Entrez votre mot de passe actuel"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nouveau mot de passe</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Nouveau mot de passe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirmer le mot de passe"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="outline">
                Changer le mot de passe
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* App Info */}
        <Card>
          <CardHeader>
            <CardTitle>A propos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong>MonCoeur</strong> - Application de gestion de vente de sacs de luxe</p>
              <p>Version 1.0.0</p>
              <Separator className="my-4" />
              <p>
                Developpe avec Next.js, React et MongoDB.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
