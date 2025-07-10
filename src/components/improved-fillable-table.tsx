
"use client";

import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { TableData, logAnalyticsEvent } from '@/lib/data';
import { ScrollArea } from './ui/scroll-area';
import { Download, Loader2, FileArchive } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

interface ImprovedFillableTableProps {
  formName: string;
  tableData?: TableData;
  isOpen: boolean;
  onClose: () => void;
  formId: string;
}

const getCellKey = (row: number, col: number) => `${row}-${col}`;

export default function ImprovedFillableTable({ formName, tableData, isOpen, onClose, formId }: ImprovedFillableTableProps) {
  const { toast } = useToast();
  const [filledData, setFilledData] = useState<Record<string, string>>({});
  const [zipBlobUrl, setZipBlobUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Cleanup function to revoke the blob URL when the component unmounts
    // or when a new blob URL is created.
    return () => {
      if (zipBlobUrl) {
        URL.revokeObjectURL(zipBlobUrl);
      }
    };
  }, [zipBlobUrl]);

  // Reset state when the dialog is closed.
  useEffect(() => {
    if (!isOpen) {
      setIsGenerating(false);
      setZipBlobUrl(null);
      // We keep filledData so the user doesn't lose their work if they accidentally close the modal.
    }
  }, [isOpen]);

  if (!tableData) return null;

  const handleInputChange = (key: string, value: string) => {
    setFilledData(prev => ({ ...prev, [key]: value }));
  };

  const generateTimestamp = (): string => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${day}-${month}-${year}_${hours}h${minutes}`;
  };

  const generatePdfBlob = async (): Promise<Blob | null> => {
    const printableElement = document.getElementById('printable-table-container');
    if (!printableElement) return null;
    
    try {
        const canvas = await html2canvas(printableElement, { scale: 2, useCORS: true, logging: false });
        const imgData = canvas.toDataURL('image/png');
        const pdfWidth = canvas.width;
        const pdfHeight = canvas.height;
        const pdf = new jsPDF({ orientation: pdfWidth > pdfHeight ? 'l' : 'p', unit: 'px', format: [pdfWidth, pdfHeight] });
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        return pdf.output('blob');
    } catch (e) {
        console.error("PDF generation failed:", e);
        return null;
    }
  };

  const generateExcelBlob = (): Blob | null => {
    try {
      const headerRow = tableData.headers || Array(tableData.cols).fill('').map((_, i) => `Colonne ${i+1}`);
      const aoa: (string | null)[][] = [headerRow];
      const merges = [];

      for (let r = 0; r < tableData.rows; r++) {
        const rowData: (string | null)[] = [];
        for (let c = 0; c < tableData.cols; c++) {
          const key = getCellKey(r, c);
          const cell = tableData.data[key];

          if (cell?.merged) {
            rowData.push(null);
            continue;
          }

          const originalContent = cell?.content || '';
          const filledContent = filledData[key] || '';
          const fullContent = [originalContent, filledContent].filter(Boolean).join('\n\n');
          rowData.push(fullContent);

          if (cell?.colspan || cell?.rowspan) {
            const rowspan = cell.rowspan || 1;
            const colspan = cell.colspan || 1;
            if (rowspan > 1 || colspan > 1) {
              merges.push({
                s: { r: r + 1, c: c },
                e: { r: r + rowspan - 1 + 1, c: c + colspan - 1 }
              });
            }
          }
        }
        aoa.push(rowData);
      }

      const worksheet = XLSX.utils.aoa_to_sheet(aoa);
      worksheet['!merges'] = merges;
      
      const colWidths = headerRow.map((h, i) => {
        let max_width = h.length;
        for (let r = 1; r < aoa.length; r++) {
          if (aoa[r][i]) {
            const cell_length = aoa[r][i]!.split('\n')[0].length;
            if (cell_length > max_width) {
              max_width = cell_length;
            }
          }
        }
        return { wch: Math.min(max_width + 2, 60) };
      });
      worksheet['!cols'] = colWidths;
      
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Réponses Formulaire');
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      return new Blob([excelBuffer], {type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8"});
    } catch (e) {
        console.error("Excel generation failed:", e);
        return null;
    }
  };

  const handleGenerateZip = async () => {
    setIsGenerating(true);
    // Revoke any existing blob URL to prevent memory leaks
    if (zipBlobUrl) {
      URL.revokeObjectURL(zipBlobUrl);
    }
    setZipBlobUrl(null);
    toast({ title: "Préparation des fichiers...", description: "Veuillez patienter pendant la génération du PDF et de l'Excel." });

    const pdfBlob = await generatePdfBlob();
    const excelBlob = generateExcelBlob();

    if (!pdfBlob || !excelBlob) {
        toast({ title: "Erreur de génération", description: "Impossible de créer un ou plusieurs fichiers.", variant: "destructive"});
        setIsGenerating(false);
        return;
    }

    try {
        const zip = new JSZip();
        const timestamp = generateTimestamp();
        zip.file(`${formName}_${timestamp}.pdf`, pdfBlob);
        zip.file(`${formName}_${timestamp}.xlsx`, excelBlob);

        const zipBlob = await zip.generateAsync({ type: "blob" });
        setZipBlobUrl(URL.createObjectURL(zipBlob));
        toast({ title: "Fichiers prêts !", description: "Vous pouvez maintenant télécharger le fichier ZIP." });
        
        // Log the "form_filled" event
        logAnalyticsEvent({
            event_type: 'form_filled',
            target_type: 'form',
            target_id: formId,
        });

    } catch (e) {
        console.error("ZIP generation failed:", e);
        toast({ title: "Erreur ZIP", description: "La création du fichier ZIP a échoué.", variant: "destructive"});
    } finally {
        setIsGenerating(false);
    }
  };

  const zipFilename = `${formName}_${generateTimestamp()}.zip`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Remplir le formulaire: {formName}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-grow pr-6">
          <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${tableData.cols}, 1fr)` }}>
            {Array.from({ length: tableData.rows }).map((_, r) =>
              Array.from({ length: tableData.cols }).map((_, c) => {
                const key = getCellKey(r, c);
                const cellData = tableData.data[key];
                if (cellData?.merged) return null;
                
                return (
                  <div 
                    key={key} 
                    className="flex flex-col gap-2 p-2 border rounded-md"
                    style={{ gridColumn: `span ${cellData?.colspan || 1}`, gridRow: `span ${cellData?.rowspan || 1}` }}
                  >
                    <Label className="text-sm font-medium text-slate-700">{tableData.headers?.[c] || `Colonne ${c+1}`}</Label>
                    {cellData?.content && <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-md">{cellData.content}</p>}
                    <Textarea
                      placeholder="Votre réponse..."
                      value={filledData[key] || ''}
                      onChange={(e) => handleInputChange(key, e.target.value)}
                      className="h-24"
                    />
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
        <DialogFooter className="mt-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <DialogClose asChild>
            <Button variant="outline">Fermer</Button>
          </DialogClose>
          
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-4">
            {isGenerating ? (
              <Button disabled className="w-full sm:w-auto">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Génération en cours...
              </Button>
            ) : zipBlobUrl ? (
              <Button asChild className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
                <a href={zipBlobUrl} download={zipFilename}>
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger le ZIP
                </a>
              </Button>
            ) : (
              <Button onClick={handleGenerateZip} className="w-full sm:w-auto">
                <FileArchive className="mr-2 h-4 w-4" />
                Générer les Fichiers (PDF & Excel)
              </Button>
            )}
          </div>
        </DialogFooter>

        {/* Hidden printable element for PDF generation */}
        <div className="absolute -left-[9999px] top-0 w-[1000px]">
            <div id="printable-table-container" className="p-4 bg-white">
                <h2 className="text-2xl font-bold mb-4 text-black">{formName}</h2>
                <p className="text-sm mb-4 text-black">Rempli le: {generateTimestamp()}</p>
                <table className="border-collapse w-full text-black">
                    <thead>
                        <tr>
                            {Array.from({ length: tableData.cols }).map((_, c) => (
                                <th key={`h-${c}`} className="border border-black p-2 bg-slate-200 text-sm font-bold text-left">
                                    {tableData.headers?.[c] || `Colonne ${c + 1}`}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: tableData.rows }).map((_, r) => (
                            <tr key={`r-${r}`}>
                                {Array.from({ length: tableData.cols }).map((_, c) => {
                                    const key = getCellKey(r, c);
                                    const cell = tableData.data[key];
                                    if (cell?.merged) return null;

                                    const originalContent = cell?.content || '';
                                    const filledContent = filledData[key] || '';

                                    return (
                                        <td
                                            key={key}
                                            colSpan={cell?.colspan || 1}
                                            rowSpan={cell?.rowspan || 1}
                                            className="border border-black p-2 align-top text-xs"
                                        >
                                            <div className="font-semibold">{originalContent}</div>
                                            <div className="mt-1 text-blue-800 whitespace-pre-wrap">{filledContent}</div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
