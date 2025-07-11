
"use client";

import { notFound, useRouter, useParams } from 'next/navigation';
import { getWorkstationById, Workstation } from '@/lib/data';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Image from 'next/image';
import { ArrowLeft, Printer, File as FileIcon, FileText as FileTextIcon, Download, ImageIcon, FileSpreadsheet } from 'lucide-react';
import QRCode from '@/components/qr-code';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export default function WorkstationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [workstation, setWorkstation] = useState<Workstation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const fetchWorkstation = async () => {
        setLoading(true);
        const ws = await getWorkstationById(id);
        if (ws) {
          setWorkstation(ws);
        }
        setLoading(false);
      };
      fetchWorkstation();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col h-full p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-[400px] w-full" />
            <Skeleton className="h-[200px] w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-[250px] w-full" />
            <Skeleton className="h-[150px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!workstation) {
    notFound();
  }
  
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="print-hidden">
        <PageHeader title={workstation.name}>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimer
            </Button>
          </div>
        </PageHeader>
      </div>

      <main className="flex-1 p-4 md:p-6 space-y-6 printable-area">
        <div className="md:hidden mb-4">
          <CardHeader className="p-0">
            <CardTitle className="break-words">{workstation.name}</CardTitle>
            <CardDescription className="break-words">{workstation.description}</CardDescription>
          </CardHeader>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="hidden md:block">
                  <CardTitle className="break-words">{workstation.name}</CardTitle>
                  <CardDescription className="break-words">
                    <Badge variant="secondary" className="mr-2">{workstation.type}</Badge>
                    {workstation.description}
                  </CardDescription>
              </CardHeader>
              <CardContent>
                  {workstation.image && (
                      <div className="relative aspect-video w-full">
                          <Image src={workstation.image} alt={workstation.name} width={800} height={450} className="rounded-lg w-full h-auto object-cover" data-ai-hint="assembly line" />
                      </div>
                  )}
              </CardContent>
            </Card>

          </div>

          <div className="space-y-6">
            <QRCode type="workstation" id={id} />
            
            {workstation.files && workstation.files.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Fichiers joints</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {workstation.files.map(file => (
                    <a href={file.url} key={file.name} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-2 rounded-md border bg-background/50 hover:bg-accent/80 transition-colors">
                      <div className="flex items-center gap-3 overflow-hidden">
                        {file.type === 'pdf' && <FileTextIcon className="h-5 w-5 text-red-500 flex-shrink-0" />}
                        {file.type === 'excel' && <FileSpreadsheet className="h-5 w-5 text-green-500 flex-shrink-0" />}
                        {file.type === 'image' && <ImageIcon className="h-5 w-5 text-blue-500 flex-shrink-0" />}
                        {file.type === 'other' && <FileIcon className="h-5 w-5 text-gray-500 flex-shrink-0" />}
                        <span className="text-sm font-medium truncate">{file.name}</span>
                      </div>
                      <Download className="h-4 w-4 text-muted-foreground ml-2"/>
                    </a>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
