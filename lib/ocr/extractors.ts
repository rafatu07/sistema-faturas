import { FaturaTipo } from '@/types';
import { processImage } from './tesseract';

export interface ExtractedData {
  tipo?: FaturaTipo;
  valorTotal?: number;
  vencimento?: Date;
  confiabilidade: number;
}

// Função para extrair valor monetário do texto
const extractValue = (text: string): number | undefined => {
  // Normalizar texto para facilitar busca
  const normalizedText = text.replace(/\s+/g, ' ').toUpperCase();
  
  // Padrões prioritários (mais específicos primeiro)
  const patterns = [
    // Buscar especificamente por "TOTAL A PAGAR" seguido de valor
    /TOTAL\s+A\s+PAGAR[:\s]*([\d]{1,3}(?:\.\d{3})*,\d{2})/i,
    /TOTAL\s+A\s+PAGAR[:\s]*R\$\s*([\d]{1,3}(?:\.\d{3})*,\d{2})/i,
    // Buscar por "TOTAL" ou "VALOR TOTAL" seguido de valor
    /(?:TOTAL|VALOR\s+TOTAL|VALOR\s+A\s+PAGAR)[:\s]*R\$\s*([\d]{1,3}(?:\.\d{3})*,\d{2})/i,
    /(?:TOTAL|VALOR\s+TOTAL|VALOR\s+A\s+PAGAR)[:\s]*([\d]{1,3}(?:\.\d{3})*,\d{2})/i,
    // Buscar valores com formato brasileiro (ex: 240,55 ou 1.240,55)
    /([\d]{1,3}(?:\.\d{3})*,\d{2})(?:\s|$)/g,
    // Buscar R$ seguido de valor
    /R\$\s*([\d]{1,3}(?:\.\d{3})*,\d{2})/g,
  ];
  
  // Tentar padrões específicos primeiro
  for (let i = 0; i < patterns.length - 1; i++) {
    const pattern = patterns[i];
    const match = normalizedText.match(pattern);
    if (match) {
      const valueStr = match[1] || match[0]
        .replace(/R\$\s*/i, '')
        .replace(/TOTAL\s+A\s+PAGAR[:\s]*/i, '')
        .replace(/TOTAL[:\s]*/i, '')
        .replace(/VALOR\s+TOTAL[:\s]*/i, '')
        .replace(/VALOR\s+A\s+PAGAR[:\s]*/i, '')
        .trim();
      
      // Converter formato brasileiro (1.240,55) para formato numérico (1240.55)
      const normalizedValue = valueStr.replace(/\./g, '').replace(',', '.');
      const value = parseFloat(normalizedValue);
      
      if (!isNaN(value) && value > 0 && value < 1000000) {
        return value;
      }
    }
  }
  
  // Se não encontrou com padrões específicos, tentar buscar todos os valores e pegar o maior
  const allValues = normalizedText.match(/([\d]{1,3}(?:\.\d{3})*,\d{2})/g);
  if (allValues && allValues.length > 0) {
    // Converter e ordenar valores, pegar o maior (geralmente é o total)
    const values = allValues
      .map(v => parseFloat(v.replace(/\./g, '').replace(',', '.')))
      .filter(v => !isNaN(v) && v > 0 && v < 1000000)
      .sort((a, b) => b - a);
    
    if (values.length > 0) {
      return values[0];
    }
  }
  
  return undefined;
};

// Função para extrair data de vencimento
const extractDate = (text: string): Date | undefined => {
  // Manter texto original para busca contextual
  const originalText = text;
  const normalizedText = text.replace(/\s+/g, ' ').toUpperCase();
  const lines = text.split(/\n/).map(line => line.trim());
  const upperLines = lines.map(line => line.toUpperCase());
  
  // Palavras que indicam outras datas (não vencimento) - ignorar
  const ignoreKeywords = ['LEITURA', 'PREV', 'PREVISTA', 'EMISSÃO', 'EMISSAO', 'AUTORIZAÇÃO', 'AUTORIZACAO', 'PROTOCOLO'];
  
  // Padrão especial: buscar por estrutura de tabela comum em faturas
  // Formato: "REF MÊS/ANO VENCIMENTO VALOR" ou "MÊS/ANO VENCIMENTO VALOR"
  // Exemplo: "NOV/2025 03/12/2025 240,55"
  const tablePattern = /([A-Z]{3}\/\d{4})\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s+([\d.,]+)/i;
  const tableMatch = originalText.match(tablePattern);
  if (tableMatch && tableMatch[2]) {
    // Se encontrou padrão de tabela, a segunda captura é provavelmente o vencimento
    const dateStr = tableMatch[2].replace(/[^\d\/\-]/g, '');
    const parts = dateStr.split(/[\/\-]/);
    if (parts.length === 3) {
      let day = parseInt(parts[0]);
      let month = parseInt(parts[1]);
      let year = parseInt(parts[2]);
      if (year < 100) year += 2000;
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2020 && year <= 2100) {
        const date = new Date(year, month - 1, day);
        if (!isNaN(date.getTime())) {
          if (process.env.NODE_ENV === 'development') {
            console.log('Data encontrada no padrão de tabela:', dateStr, '→', date.toLocaleDateString('pt-BR'));
          }
          return date;
        }
      }
    }
  }
  
  // Padrões prioritários - buscar especificamente por "VENCIMENTO" seguido de data
  const vencimentoPatterns = [
    // Padrão: VENCIMENTO seguido imediatamente por data
    /VENCIMENTO[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /VENC\.?[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /DATA\s+DE\s+VENCIMENTO[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
  ];
  
  // Tentar padrões específicos primeiro (mais confiável)
  for (const pattern of vencimentoPatterns) {
    const match = normalizedText.match(pattern);
    if (match && match[1]) {
      const dateStr = match[1].replace(/[^\d\/\-]/g, '');
      const parts = dateStr.split(/[\/\-]/);
      
      if (parts.length === 3) {
        let day = parseInt(parts[0]);
        let month = parseInt(parts[1]);
        let year = parseInt(parts[2]);
        
        if (year < 100) year += 2000;
        
        if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2020 && year <= 2100) {
          const date = new Date(year, month - 1, day);
          if (!isNaN(date.getTime())) {
            if (process.env.NODE_ENV === 'development') {
              console.log('Data encontrada com padrão VENCIMENTO:', dateStr, '→', date.toLocaleDateString('pt-BR'));
            }
            return date;
          }
        }
      }
    }
  }
  
  // Buscar por linha que contém "VENCIMENTO" e pegar data próxima
  for (let i = 0; i < upperLines.length; i++) {
    const line = upperLines[i];
    const originalLine = lines[i];
    
    if (line.includes('VENCIMENTO') || line.includes('VENC.')) {
      // Verificar se a linha não contém palavras de ignorar
      const shouldIgnore = ignoreKeywords.some(keyword => line.includes(keyword));
      if (shouldIgnore) continue;
      
      // Buscar data na mesma linha (prioridade) - aceitar anos de 2 ou 4 dígitos
      const dateMatch = originalLine.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
      if (dateMatch) {
        const dateStr = dateMatch[1];
        const parts = dateStr.split(/[\/\-]/);
        if (parts.length === 3) {
          let day = parseInt(parts[0]);
          let month = parseInt(parts[1]);
          let year = parseInt(parts[2]);
          if (year < 100) year += 2000;
          if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2020 && year <= 2100) {
            const date = new Date(year, month - 1, day);
            if (!isNaN(date.getTime())) {
              if (process.env.NODE_ENV === 'development') {
                console.log('Data encontrada na linha com VENCIMENTO:', dateStr, '→', date.toLocaleDateString('pt-BR'));
              }
              return date;
            }
          }
        }
      }
      
      // Se não encontrou na mesma linha, buscar nas próximas 3 linhas
      for (let j = i + 1; j <= i + 3 && j < lines.length; j++) {
        const nextLine = lines[j];
        const nextUpperLine = upperLines[j];
        
        // Ignorar se a próxima linha contém palavras de ignorar
        const shouldIgnoreNext = ignoreKeywords.some(keyword => nextUpperLine.includes(keyword));
        if (shouldIgnoreNext) continue; // Continue em vez de break para não parar a busca
        
        const dateMatch = nextLine.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
        if (dateMatch) {
          const dateStr = dateMatch[1];
          const parts = dateStr.split(/[\/\-]/);
          if (parts.length === 3) {
            let day = parseInt(parts[0]);
            let month = parseInt(parts[1]);
            let year = parseInt(parts[2]);
            if (year < 100) year += 2000;
            if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2020 && year <= 2100) {
              const date = new Date(year, month - 1, day);
              if (!isNaN(date.getTime())) {
                if (process.env.NODE_ENV === 'development') {
                  console.log('Data encontrada próxima a VENCIMENTO:', dateStr, '→', date.toLocaleDateString('pt-BR'));
                }
                return date;
              }
            }
          }
        }
      }
    }
  }
  
  // Buscar por linha que contém valor monetário e pegar data próxima (estrutura de tabela)
  // Se encontrou o valor, a data de vencimento geralmente está na mesma linha ou próxima
  const valorEncontrado = extractValue(text);
  if (valorEncontrado) {
    // Buscar linha que contém o valor (formato brasileiro: 240,55)
    const valorStr = valorEncontrado.toFixed(2).replace('.', ',');
    const valorInt = Math.round(valorEncontrado);
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const upperLine = line.toUpperCase();
      
      // Verificar se a linha contém o valor (pode estar como 240,55 ou 240.55)
      const hasValue = line.includes(valorStr) || 
                       line.includes(valorEncontrado.toString()) ||
                       line.includes(valorInt.toString() + ',') ||
                       line.includes(valorInt.toString() + '.');
      
      if (hasValue) {
        // Ignorar se a linha contém palavras de leitura
        if (upperLine.includes('LEITURA') || upperLine.includes('PREV') || upperLine.includes('PREVISTA')) {
          continue;
        }
        
        // Buscar TODAS as datas na linha (formato DD/MM/YYYY ou DD/MM/YY)
        const dateMatches = line.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/g);
        if (dateMatches && dateMatches.length > 0) {
          // Filtrar apenas datas válidas (DD/MM/YYYY onde DD <= 31)
          const validDates: Array<{dateStr: string, date: Date, index: number}> = [];
          
          for (let idx = 0; idx < dateMatches.length; idx++) {
            const dateStr = dateMatches[idx];
            const parts = dateStr.split(/[\/\-]/);
            if (parts.length === 3) {
              let day = parseInt(parts[0]);
              let month = parseInt(parts[1]);
              let year = parseInt(parts[2]);
              
              // Ignorar se não parece uma data de vencimento (ex: NOV/2025 tem day=0 ou muito grande)
              if (day < 1 || day > 31) continue;
              
              if (year < 100) year += 2000;
              if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2020 && year <= 2100) {
                const date = new Date(year, month - 1, day);
                if (!isNaN(date.getTime())) {
                  validDates.push({ dateStr, date, index: idx });
                }
              }
            }
          }
          
          if (validDates.length > 0) {
            // Se há múltiplas datas válidas, pegar a que está mais próxima do valor
            // Geralmente a estrutura é: REF MÊS/ANO | VENCIMENTO | VALOR
            // Então a data de vencimento é geralmente a última data válida antes do valor
            const selectedDate = validDates[validDates.length - 1];
            
            if (process.env.NODE_ENV === 'development') {
              console.log('Datas válidas encontradas na linha:', validDates.map(d => d.dateStr));
              console.log('Data selecionada (vencimento):', selectedDate.dateStr, '→', selectedDate.date.toLocaleDateString('pt-BR'));
            }
            
            return selectedDate.date;
          }
        }
      }
    }
  }
  
  // Última tentativa: buscar todas as datas e filtrar as que estão próximas de "VENCIMENTO"
  const vencimentoIndex = normalizedText.indexOf('VENCIMENTO');
  if (vencimentoIndex !== -1) {
    // Pegar contexto de 300 caracteres após "VENCIMENTO" (aumentado para pegar mais contexto)
    const context = normalizedText.substring(vencimentoIndex, vencimentoIndex + 300);
    const contextDates = context.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/g);
    
    if (contextDates && contextDates.length > 0) {
      // Filtrar datas que não estão em contexto de palavras a ignorar
      for (const dateStr of contextDates) {
        // Verificar se a data não está próxima de palavras a ignorar
        const dateIndex = context.indexOf(dateStr);
        const beforeDate = context.substring(Math.max(0, dateIndex - 30), dateIndex).toUpperCase();
        const afterDate = context.substring(dateIndex + dateStr.length, dateIndex + dateStr.length + 30).toUpperCase();
        const dateContext = beforeDate + ' ' + afterDate;
        
        const shouldIgnore = ignoreKeywords.some(keyword => dateContext.includes(keyword));
        if (shouldIgnore) continue;
        
        const parts = dateStr.split(/[\/\-]/);
        if (parts.length === 3) {
          let day = parseInt(parts[0]);
          let month = parseInt(parts[1]);
          let year = parseInt(parts[2]);
          if (year < 100) year += 2000;
          if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2020 && year <= 2100) {
            const date = new Date(year, month - 1, day);
            if (!isNaN(date.getTime())) {
              if (process.env.NODE_ENV === 'development') {
                console.log('Data encontrada no contexto de VENCIMENTO:', dateStr, '→', date.toLocaleDateString('pt-BR'));
              }
              return date;
            }
          }
        }
      }
    }
  }
  
  return undefined;
};

// Função para identificar tipo de fatura
const identifyType = (text: string): FaturaTipo | undefined => {
  const upperText = text.toUpperCase();
  
  if (upperText.includes('EDP') || upperText.includes('ENERGIA') || upperText.includes('ELÉTRICA')) {
    return 'EDP';
  }
  
  if (upperText.includes('SABESP') || upperText.includes('ÁGUA') || upperText.includes('SANEPAR')) {
    return 'SABESP';
  }
  
  if (
    upperText.includes('TELEFONE') ||
    upperText.includes('TELEFONIA') ||
    upperText.includes('VIVO') ||
    upperText.includes('TIM') ||
    upperText.includes('CLARO') ||
    upperText.includes('OI')
  ) {
    return 'TELEFONIA';
  }
  
  return undefined;
};

// Função principal de extração
export const extractFaturaData = async (
  imageFile: File | Blob | string
): Promise<ExtractedData> => {
  try {
    const text = await processImage(imageFile);
    
    // Log do texto extraído para debug (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      console.log('Texto extraído pelo OCR (primeiros 1000 caracteres):', text.substring(0, 1000));
      // Buscar especificamente por VENCIMENTO no texto
      const vencimentoIndex = text.toUpperCase().indexOf('VENCIMENTO');
      if (vencimentoIndex !== -1) {
        const context = text.substring(Math.max(0, vencimentoIndex - 50), vencimentoIndex + 200);
        console.log('Contexto ao redor de VENCIMENTO:', context);
      }
    }
    
    const tipo = identifyType(text);
    const valorTotal = extractValue(text);
    const vencimento = extractDate(text);
    
    // Log dos dados extraídos para debug
    if (process.env.NODE_ENV === 'development') {
      console.log('Dados extraídos:', { 
        tipo, 
        valorTotal, 
        vencimento: vencimento ? vencimento.toLocaleDateString('pt-BR') : null 
      });
    }
    
    // Calcular confiabilidade baseado em quantos dados foram extraídos
    let confiabilidade = 0;
    if (tipo) confiabilidade += 0.3;
    if (valorTotal) confiabilidade += 0.4;
    if (vencimento) confiabilidade += 0.3;
    
    return {
      tipo,
      valorTotal,
      vencimento,
      confiabilidade,
    };
  } catch (error) {
    console.error('Erro ao extrair dados da fatura:', error);
    return {
      confiabilidade: 0,
    };
  }
};

// Função de conversão de PDF movida para lib/ocr/pdfConverter.ts

