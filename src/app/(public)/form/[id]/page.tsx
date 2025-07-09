
'use client';

import { notFound, useParams } from 'next/navigation';
import { getFormById, Form } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import Image from 'next/image';
import { File as FileIcon, FileText as FileTextIcon, Download, ImageIcon, FileSpreadsheet, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import ImprovedFillableTable from '@/components/improved-fillable-table';
import { Skeleton } from '@/components/ui/skeleton';

const logoUrl = 'https://i.postimg.cc/nzSLBHck/Logo.png';

function ReadOnlyTable({ tableData }: { tableData: Form['table_data'] }) {
    if (!tableData || !tableData.rows || !tableData.cols) {
        return (
            <div className="text-center text-muted-foreground p-8">
                <p>Ce formulaire n'a pas de tableau de données.</p>
            </div>
        );
    }
    
    const getCellKey = (r: number, c: number) => `${r}-${c}`;

    const renderCell = (r: number, c: number) => {
        const key = getCellKey(r, c);
        const cell = tableData.data[key] || { content: '' };
        if (cell.merged) return null;

        return (
            <td
                key={key}
                colSpan={cell.colspan}
                rowSpan={cell.rowspan}
                className="border border-slate-300 p-2 text-sm bg-white"
            >
                <div>{cell.content}</div>
            </td>
        );
    }

    return (
        <div className="overflow-auto rounded-md border bg-slate-100 p-2">
            <table className="w-full border-collapse">
                <thead>
                    <tr>
                        {[...Array(tableData.cols)].map((_, c) => (
                            <th key={c} className="border border-slate-300 p-2 bg-slate-200 text-sm font-medium text-left">
                                {tableData.headers?.[c] || `Colonne ${c + 1}`}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {[...Array(tableData.rows)].map((_, r) => (
                        <tr key={r}>
                            {[...Array(tableData.cols)].map((_, c) => renderCell(r,c))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function PublicPageSkeleton() {
    return (
         <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 sm:p-6 md:p-8">
            <main className="w-full max-w-4xl mx-auto space-y-6">
                <div className="text-center">
                    <Skeleton className="h-20 w-20 rounded-full mx-auto mb-4" />
                    <Skeleton className="h-8 w-48 mx-auto" />
                </div>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-4 w-1/2 mt-2" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-48 w-full" />
                    </CardContent>
                    <CardFooter>
                         <Skeleton className="h-10 w-48" />
                    </CardFooter>
                </Card>
            </main>
        </div>
    )
}

export default function FormPublicPage() {
    const params = useParams();
    const id = params.id as string;

    const [form, setForm] = useState<Form | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFillModalOpen, setIsFillModalOpen] = useState(false);
    
    useEffect(() => {
        if (id) {
            const fetchForm = async () => {
                setLoading(true);
                try {
                    const f = await getFormById(id);
                    if (f) {
                        setForm(f);
                    }
                } catch(e) {
                    console.error("Failed to fetch form", e);
                } finally {
                    setLoading(false);
                }
            };
            fetchForm();
        }
    }, [id]);

    if (loading) {
        return <PublicPageSkeleton />;
    }

    if (!form) {
        notFound();
    }
    
    const imageFiles = form.files?.filter(f => f.type === 'image') || [];
    const otherFiles = form.files?.filter(f => f.type !== 'image') || [];

    return (
        <>
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 sm:p-6 md:p-8">
                <main className="w-full max-w-4xl mx-auto space-y-6">
                    <div className="text-center">
                        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-md p-2">
                            <Image src={logoUrl} alt="WorkHub Central Logo" width={80} height={80} className="h-full w-full object-contain" />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900">WorkHub Central</h1>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl">{form.name}</CardTitle>
                            <CardDescription>
                                Mis à jour le {new Date(form.last_updated).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {imageFiles.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">Images jointes</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {imageFiles.map((file) => (
                                        <a key={file.url} href={file.url} target="_blank" rel="noopener noreferrer">
                                            <div className="relative aspect-video w-full rounded-lg overflow-hidden border hover:opacity-90 transition-opacity">
                                                <Image 
                                                    src={file.url} 
                                                    alt={file.name} 
                                                    fill
                                                    className="object-cover"
                                                    data-ai-hint="form image" 
                                                />
                                            </div>
                                        </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {otherFiles.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">Autres fichiers joints</h3>
                                    <div className="space-y-2">
                                    {otherFiles.map(file => (
                                        <a href={file.url} key={file.name} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-md border bg-background/50 hover:bg-accent/80 transition-colors">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                {file.type === 'pdf' && <FileTextIcon className="h-5 w-5 text-red-500 flex-shrink-0" />}
                                                {file.type === 'excel' && <FileSpreadsheet className="h-5 w-5 text-green-500 flex-shrink-0" />}
                                                {file.type === 'other' && <FileIcon className="h-5 w-5 text-gray-500 flex-shrink-0" />}
                                                <span className="text-sm font-medium truncate">{file.name}</span>
                                            </div>
                                            <ExternalLink className="h-4 w-4 text-muted-foreground ml-2"/>
                                        </a>
                                    ))}
                                    </div>
                                </div>
                            )}

                            {form.table_data && (
                            <div>
                                    <h3 className="text-lg font-semibold mb-2">Structure du formulaire</h3>
                                    <ReadOnlyTable tableData={form.table_data}/>
                                </div>
                            )}
                        </CardContent>
                        {form.table_data && (
                            <CardFooter>
                                <Button onClick={() => setIsFillModalOpen(true)}>
                                    <FileTextIcon className="mr-2 h-4 w-4" />
                                    Remplir et Exporter
                                </Button>
                            </CardFooter>
                        )}
                    </Card>
                </main>
            </div>
             {isFillModalOpen && (
                <ImprovedFillableTable
                    formName={form.name}
                    tableData={form.table_data}
                    isOpen={isFillModalOpen}
                    onClose={() => setIsFillModalOpen(false)}
                />
            )}
        </>
    );
}
