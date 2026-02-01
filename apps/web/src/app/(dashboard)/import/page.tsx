"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react";

interface ImportResult {
  success: boolean;
  bagsCreated: number;
  salesCreated: number;
  bankAccountsCreated: number;
  errors: string[];
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
    }
  }

  async function handleImport() {
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
      } else {
        const data = await res.json();
        setError(data.error || "Erreur lors de l'import");
      }
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Import Excel</h1>
        <p className="text-muted-foreground">
          Importez vos donnees depuis un fichier Excel
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Important</AlertTitle>
        <AlertDescription>
          L&apos;import va creer les comptes bancaires (Beatrice, Tiziana, Goergio, Jenacha),
          les sacs et les ventes a partir des donnees du fichier Excel.
          Cette operation ne peut pas etre annulee.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Fichier Excel</CardTitle>
          <CardDescription>
            Selectionnez le fichier Excel a importer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="flex-1">
              <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={loading}
                />
                <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                {file ? (
                  <p className="text-sm font-medium">{file.name}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Cliquez pour selectionner un fichier Excel (.xlsx, .xls)
                  </p>
                )}
              </div>
            </label>
          </div>

          <Button
            onClick={handleImport}
            disabled={!file || loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Import en cours...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Importer les donnees
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <CardTitle className="text-green-800">Import termine</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="bg-white p-4 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {result.bankAccountsCreated}
                </p>
                <p className="text-sm text-muted-foreground">
                  Comptes bancaires crees
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {result.bagsCreated}
                </p>
                <p className="text-sm text-muted-foreground">Sacs crees</p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {result.salesCreated}
                </p>
                <p className="text-sm text-muted-foreground">Ventes creees</p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">
                  Erreurs ({result.errors.length})
                </h4>
                <ul className="text-sm text-yellow-700 space-y-1 max-h-40 overflow-auto">
                  {result.errors.map((err, index) => (
                    <li key={index}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Format attendu</CardTitle>
          <CardDescription>
            Structure du fichier Excel pour l&apos;import
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Feuille &quot;achats&quot;</h4>
            <p className="text-sm text-muted-foreground">
              Colonnes: date, descriptif, prix
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">
              Feuilles &quot;beatrice&quot;, &quot;tiziana&quot;, &quot;goergio&quot;, &quot;jenacha&quot;
            </h4>
            <p className="text-sm text-muted-foreground">
              Colonnes: descriptif, prix achat, prix vente, frais gianni, marge
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Feuille &quot;historique&quot;</h4>
            <p className="text-sm text-muted-foreground">
              Colonnes: date, achats libelle, prix achats, prix vente, marge
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
