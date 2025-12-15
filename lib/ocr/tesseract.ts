import { createWorker, Worker } from 'tesseract.js';

let worker: Worker | null = null;

export const initializeOCR = async (): Promise<Worker> => {
  if (worker) return worker;
  
  try {
    worker = await createWorker('por', 1, {
      logger: (m) => {
        // Log apenas erros críticos
        if (m.status === 'error') {
          console.error('OCR Error:', m);
        }
      },
    });
    return worker;
  } catch (error) {
    console.error('Erro ao inicializar OCR:', error);
    throw new Error('Falha ao inicializar o serviço de OCR');
  }
};

// Converter File/Blob para ImageData ou URL
const prepareImage = async (imageFile: File | Blob | string): Promise<string | ImageData> => {
  // Se já é uma string (URL), retornar diretamente
  if (typeof imageFile === 'string') {
    return imageFile;
  }

  // Se é File ou Blob, converter para URL
  if (imageFile instanceof File || imageFile instanceof Blob) {
    // Se é PDF, precisa ser convertido antes (isso deve ser feito no componente)
    if (imageFile instanceof File && imageFile.type === 'application/pdf') {
      throw new Error('PDF deve ser convertido para imagem antes do processamento');
    }

    // Validar tipo de arquivo
    if (imageFile instanceof File) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/bmp'];
      if (!validTypes.includes(imageFile.type)) {
        throw new Error('Formato de arquivo não suportado. Use JPG, PNG, WEBP, BMP ou PDF.');
      }
    }

    // Criar URL do objeto
    const imageUrl = URL.createObjectURL(imageFile);
    return imageUrl;
  }

  throw new Error('Formato de arquivo não suportado');
};

export const processImage = async (
  imageFile: File | Blob | string,
  options?: { lang?: string }
): Promise<string> => {
  let imageUrl: string | null = null;
  
  try {
    const ocrWorker = await initializeOCR();
    
    if (options?.lang && options.lang !== 'por') {
      await ocrWorker.loadLanguage(options.lang);
      await ocrWorker.initialize(options.lang);
    }
    
    // Preparar a imagem
    const imageSource = await prepareImage(imageFile);
    
    // Se foi criada uma URL blob, armazenar para limpar depois
    if (typeof imageSource === 'string' && imageSource.startsWith('blob:')) {
      imageUrl = imageSource;
    }
    
    // Processar com OCR
    const { data } = await ocrWorker.recognize(imageSource);
    
    return data.text;
  } catch (error: any) {
    console.error('Erro ao processar imagem:', error);
    
    if (error.message) {
      throw error;
    }
    throw new Error('Erro ao processar a imagem. Verifique se o arquivo é uma imagem válida.');
  } finally {
    // Limpar URL do objeto se foi criada
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }
  }
};

export const terminateOCR = async (): Promise<void> => {
  if (worker) {
    try {
      await worker.terminate();
    } catch (error) {
      console.error('Erro ao finalizar OCR:', error);
    } finally {
      worker = null;
    }
  }
};

