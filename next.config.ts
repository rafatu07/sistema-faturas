import type { NextConfig } from "next";
import { copyFileSync, existsSync } from "fs";
import { join } from "path";

// Copiar worker do PDF.js para public na build
const copyPdfWorker = () => {
  const workerSrc = join(process.cwd(), "node_modules", "pdfjs-dist", "build", "pdf.worker.min.mjs");
  const workerDest = join(process.cwd(), "public", "pdf.worker.min.mjs");
  
  if (existsSync(workerSrc) && !existsSync(workerDest)) {
    try {
      copyFileSync(workerSrc, workerDest);
      console.log("PDF.js worker copiado para public/");
    } catch (error) {
      console.warn("Não foi possível copiar PDF.js worker:", error);
    }
  }
};

// Copiar na inicialização
copyPdfWorker();

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
