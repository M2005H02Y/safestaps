
import { notFound } from 'next/navigation';
import { getWorkstationById, Workstation } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Image from 'next/image';
import { File as FileIcon, FileText as FileTextIcon, Download, ImageIcon, FileSpreadsheet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import OcpLogo from '@/app/ocplogo.png';

async function WorkstationPublicPage({ params }: { params: { id: string } }) {
  const workstation = await getWorkstationById(params.id);

  if (!workstation) {
    notFound();
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 sm:p-6 md:p-8">
      <main className="w-full max-w-2xl mx-auto space-y-6">
        <div className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-md p-2">
                <Image src={OcpLogo} alt="SafeSteps Logo" width={80} height={80} className="h-full w-full object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">SafeSteps</h1>
        </div>
        
        <Card className="overflow-hidden">
          {workstation.image && (
            <div className="relative aspect-video w-full">
              <Image src={workstation.image} alt={workstation.name} fill className="object-cover" data-ai-hint="assembly line"/>
            </div>
          )}
          <CardHeader>
            <Badge variant="secondary" className="w-fit mb-2">{workstation.type}</Badge>
            <CardTitle className="text-2xl">{workstation.name}</CardTitle>
            {workstation.description && (
                <CardDescription>{workstation.description}</CardDescription>
            )}
          </CardHeader>
          {workstation.files && workstation.files.length > 0 && (
             <CardContent>
                <h3 className="text-lg font-semibold mb-2">Fichiers joints</h3>
                <div className="space-y-2">
                  {workstation.files.map(file => (
                    <a href={file.url} key={file.name} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-md border bg-background/50 hover:bg-accent/80 transition-colors">
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
                </div>
              </CardContent>
          )}
        </Card>
      </main>
    </div>
  );
}

export default WorkstationPublicPage;
