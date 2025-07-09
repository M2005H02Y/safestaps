
"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import FileUpload from '@/components/file-upload';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { addWorkstation, FileAttachment, engineTypes } from '@/lib/data';
import { useState, useEffect, Suspense } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from '@/components/ui/skeleton';

function PageSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Créer un nouveau poste de travail">
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-48" />
        </div>
      </PageHeader>
      <main className="flex-1 p-4 md:p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle><Skeleton className="h-6 w-1/3" /></CardTitle>
            <CardDescription><Skeleton className="h-4 w-2/3" /></CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-24 w-full" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle><Skeleton className="h-6 w-1/4" /></CardTitle>
            <CardDescription><Skeleton className="h-4 w-3/4" /></CardDescription>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function NewWorkstationPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [customType, setCustomType] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const OTHER_ENGINE_VALUE = 'AUTRE';

  useEffect(() => {
    if (searchParams.get('newEngine') === 'true') {
      setType(OTHER_ENGINE_VALUE);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalType = type === OTHER_ENGINE_VALUE ? customType.trim() : type;

    if (!name.trim() || !finalType) {
        toast({
            title: "Erreur de validation",
            description: "Le nom et le type du poste de travail sont obligatoires.",
            variant: "destructive",
        });
        return;
    }

    setIsSubmitting(true);

    try {
      const mainImage = files.find(f => f.type === 'image');
      const otherFiles = files.filter(f => f.url !== mainImage?.url);

      const success = await addWorkstation({ 
        name,
        type: finalType, 
        description, 
        image: mainImage?.url,
        files: otherFiles
      });

      if (success) {
        toast({
          title: "Poste de travail créé",
          description: "Le nouveau poste de travail a été enregistré avec succès.",
        });
        router.push('/workstations');
        router.refresh();
      } else {
        throw new Error("API call failed");
      }
    } catch(error) {
        toast({
            title: "Erreur d'enregistrement",
            description: "Impossible de sauvegarder le poste de travail. Veuillez réessayer.",
            variant: "destructive",
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <PageHeader title="Créer un nouveau poste de travail">
        <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
            Enregistrer le poste de travail
            </Button>
        </div>
      </PageHeader>
      
      <main className="flex-1 p-4 md:p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations de base</CardTitle>
            <CardDescription>Fournissez un nom et une description pour le nouveau poste de travail.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="grid md:grid-cols-2 gap-4">
               <div className="space-y-2">
                <Label htmlFor="ws-name">Nom du poste de travail</Label>
                <Input id="ws-name" placeholder="ex: Ligne d'assemblage Alpha" required value={name} onChange={(e) => setName(e.target.value)} />
              </div>
               <div className="space-y-2">
                <Label htmlFor="ws-type">Type d'engine</Label>
                 <Select onValueChange={setType} value={type} required>
                    <SelectTrigger id="ws-type">
                        <SelectValue placeholder="Sélectionnez un type d'engine" />
                    </SelectTrigger>
                    <SelectContent>
                        {engineTypes.map(engine => (
                            <SelectItem key={engine} value={engine}>{engine}</SelectItem>
                        ))}
                        <SelectItem value={OTHER_ENGINE_VALUE}>Autre (spécifier)</SelectItem>
                    </SelectContent>
                  </Select>
                  {type === OTHER_ENGINE_VALUE && (
                    <Input
                        id="ws-custom-type"
                        placeholder="Entrez le nom de l'engine"
                        required
                        value={customType}
                        onChange={e => setCustomType(e.target.value)}
                        className="mt-2"
                    />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ws-desc">Description</Label>
              <Textarea id="ws-desc" placeholder="Décrivez le but de ce poste de travail." value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pièces jointes</CardTitle>
            <CardDescription>Téléchargez des images, des PDF ou des feuilles de calcul pertinents. La première image sera utilisée comme image principale.</CardDescription>
          </CardHeader>
          <CardContent>
            <FileUpload onUploadComplete={setFiles} />
          </CardContent>
        </Card>

      </main>
    </form>
  );
}

export default function NewWorkstationPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <NewWorkstationPageContent />
    </Suspense>
  )
}
