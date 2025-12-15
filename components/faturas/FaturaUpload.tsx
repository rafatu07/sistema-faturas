'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { extractFaturaData, ExtractedData } from '@/lib/ocr/extractors';
import { uploadFile } from '@/lib/firebase/storage';
import { pdfToImageDataURL } from '@/lib/ocr/pdfConverter';
import { Loader2, Upload, FileImage, FileText } from 'lucide-react';

interface FaturaUploadProps {
  onExtract: (data: ExtractedData, fileUrl: string) => void;
}

export default function FaturaUpload({ onExtract }: FaturaUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError(null);
    setFile(selectedFile);

    // Criar preview para imagens
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else if (selectedFile.type === 'application/pdf') {
      // Para PDF, converter primeira página para preview
      try {
        const dataURL = await pdfToImageDataURL(selectedFile, 1);
        setPreview(dataURL);
      } catch (err) {
        console.error('Erro ao gerar preview do PDF:', err);
        setPreview(null);
      }
    } else {
      setPreview(null);
    }
  };

  const handleProcess = async () => {
    if (!file) return;

    setProcessing(true);
    setError(null);

    try {
      // Validar tipo de arquivo
      const isImage = file.type.startsWith('image/');
      const isPDF = file.type === 'application/pdf';

      if (!isImage && !isPDF) {
        setError('Formato não suportado. Use imagens (JPG, PNG, WEBP, BMP) ou PDF');
        setProcessing(false);
        return;
      }

      // Validar tamanho (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Arquivo muito grande. Tamanho máximo: 10MB');
        setProcessing(false);
        return;
      }

      // Converter PDF para imagem se necessário
      let fileToProcess: File | Blob | string = file;
      if (isPDF) {
        try {
          // Converter PDF para data URL (imagem)
          const dataURL = await pdfToImageDataURL(file, 1);
          // Converter data URL para Blob para processar com OCR
          const response = await fetch(dataURL);
          const imageBlob = await response.blob();
          fileToProcess = imageBlob;
        } catch (pdfError: any) {
          console.error('Erro ao converter PDF:', pdfError);
          setError('Erro ao processar PDF. Tente novamente ou use uma imagem.');
          setProcessing(false);
          return;
        }
      }

      // Processar OCR primeiro (antes do upload)
      let extractedData;
      try {
        extractedData = await extractFaturaData(fileToProcess);
      } catch (ocrError: any) {
        console.error('Erro no OCR:', ocrError);
        // Continuar mesmo se OCR falhar - usuário pode preencher manualmente
        extractedData = {
          confiabilidade: 0,
        };
        setError('Não foi possível extrair dados automaticamente. Você pode preencher manualmente.');
      }

      // Upload do arquivo original (PDF ou imagem)
      const timestamp = Date.now();
      const filePath = `faturas/${timestamp}_${file.name}`;
      const fileUrl = await uploadFile(file, filePath);

      onExtract(extractedData, fileUrl);
    } catch (err: any) {
      console.error('Erro ao processar fatura:', err);
      let errorMessage = 'Erro ao processar fatura';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.code === 'storage/unauthorized') {
        errorMessage = 'Erro de autorização no upload. Verifique as permissões.';
      } else if (err.code === 'storage/quota-exceeded') {
        errorMessage = 'Quota de armazenamento excedida.';
      }
      
      setError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload de Fatura</CardTitle>
        <CardDescription>
          Faça upload de uma imagem ou PDF da fatura para extração automática dos dados
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>
        )}

        <div className="space-y-2">
          <Label htmlFor="file">Arquivo da Fatura</Label>
          <Input
            id="file"
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/bmp,application/pdf"
            onChange={handleFileChange}
            ref={fileInputRef}
            disabled={processing}
          />
          <p className="text-sm text-gray-500">
            Formatos aceitos: JPG, PNG, WEBP, BMP, PDF (máx. 10MB)
          </p>
        </div>

        {preview && (
          <div className="mt-4">
            <img
              src={preview}
              alt="Preview"
              className="max-w-full h-auto max-h-64 rounded-md border"
            />
          </div>
        )}

        {file && (
          <Button
            onClick={handleProcess}
            disabled={processing}
            className="w-full"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processando OCR...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Processar Fatura
              </>
            )}
          </Button>
        )}

        {!file && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="flex justify-center gap-4 mb-4">
              <FileImage className="w-12 h-12 text-gray-400" />
              <FileText className="w-12 h-12 text-gray-400" />
            </div>
            <p className="text-gray-500">Selecione uma imagem ou PDF para fazer upload</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

