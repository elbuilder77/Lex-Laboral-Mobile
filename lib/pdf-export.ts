import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import type { jsPDF } from 'jspdf';

const sanitizeFilename = (filename: string) => filename.replace(/[^a-zA-Z0-9._-]/g, '_');

export const exportPdf = async (document: jsPDF, filename: string, title: string): Promise<void> => {
  const safeFilename = sanitizeFilename(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);

  if (!Capacitor.isNativePlatform()) {
    document.save(safeFilename);
    return;
  }

  const dataUri = document.output('datauristring');
  const base64Data = dataUri.substring(dataUri.indexOf(',') + 1);
  const savedFile = await Filesystem.writeFile({
    path: `pdf/${safeFilename}`,
    data: base64Data,
    directory: Directory.Cache,
    recursive: true,
  });

  await Share.share({
    title,
    text: 'PDF generado por Lex Laboral',
    url: savedFile.uri,
    dialogTitle: 'Guardar o compartir PDF',
  });
};
