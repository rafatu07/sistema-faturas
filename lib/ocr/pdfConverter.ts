import * as pdfjsLib from 'pdfjs-dist';

// Configurar worker do PDF.js
if (typeof window !== 'undefined') {
  // Usar worker da pasta public
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

export const pdfToImage = async (file: File, pageNumber: number = 1): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    
    fileReader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        
        // Carregar o PDF
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        
        // Obter a página especificada (ou primeira página)
        const page = await pdf.getPage(Math.min(pageNumber, pdf.numPages));
        
        // Configurar escala para melhor qualidade
        const scale = 2.0; // Aumentar escala para melhor qualidade OCR
        const viewport = page.getViewport({ scale });
        
        // Criar canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (!context) {
          throw new Error('Não foi possível criar contexto do canvas');
        }
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // Renderizar página no canvas
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };
        
        await page.render(renderContext).promise;
        
        // Converter canvas para blob
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Erro ao converter canvas para blob'));
          }
        }, 'image/png', 1.0);
      } catch (error) {
        console.error('Erro ao converter PDF:', error);
        reject(error);
      }
    };
    
    fileReader.onerror = (error) => {
      reject(new Error('Erro ao ler arquivo PDF'));
    };
    
    fileReader.readAsArrayBuffer(file);
  });
};

export const pdfToImageDataURL = async (file: File, pageNumber: number = 1): Promise<string> => {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    
    fileReader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        
        // Carregar o PDF
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        
        // Obter a página especificada (ou primeira página)
        const page = await pdf.getPage(Math.min(pageNumber, pdf.numPages));
        
        // Configurar escala para melhor qualidade
        const scale = 2.0;
        const viewport = page.getViewport({ scale });
        
        // Criar canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (!context) {
          throw new Error('Não foi possível criar contexto do canvas');
        }
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // Renderizar página no canvas
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };
        
        await page.render(renderContext).promise;
        
        // Converter canvas para data URL
        const dataURL = canvas.toDataURL('image/png', 1.0);
        resolve(dataURL);
      } catch (error) {
        console.error('Erro ao converter PDF:', error);
        reject(error);
      }
    };
    
    fileReader.onerror = (error) => {
      reject(new Error('Erro ao ler arquivo PDF'));
    };
    
    fileReader.readAsArrayBuffer(file);
  });
};

