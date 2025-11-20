
// URL do backend. Em produção, substitua pela URL do seu serviço no Render/Railway.
// Para desenvolvimento local, use http://localhost:3000
const BACKEND_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

export const generatePdfViaBackend = async (
  elementId: string, 
  fileName: string, 
  orientation: 'landscape' | 'portrait' = 'landscape'
) => {
  const contentElement = document.getElementById(elementId);
  if (!contentElement) throw new Error('Elemento não encontrado');

  // 1. Captura os estilos atuais (Tailwind + Custom CSS)
  const styles = Array.from(document.head.querySelectorAll('style, link[rel="stylesheet"]'))
    .map(node => node.outerHTML)
    .join('\n');

  // 2. Prepara o conteúdo HTML.
  // Removemos classes que ocultam o container para que o Puppeteer possa renderizá-lo.
  // Também injetamos estilos para forçar a visibilidade no PDF gerado.
  const contentHtml = contentElement.outerHTML;

  // 3. Constrói o documento completo
  const fullHtml = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        ${styles}
        <style>
           /* Força visibilidade para o Puppeteer */
           .pdf-export-container {
             position: relative !important;
             top: auto !important;
             left: auto !important;
             visibility: visible !important;
             opacity: 1 !important;
             z-index: 9999 !important;
             margin: 0 auto !important;
           }
           
           /* Garante que o fundo seja branco */
           body {
             background-color: white !important;
             -webkit-print-color-adjust: exact !important;
             print-color-adjust: exact !important;
           }

           /* Ajustes de quebra de página */
           .aula-card, .event-card-pdf, .free-slot-card {
             break-inside: avoid !important;
             page-break-inside: avoid !important;
           }
           
           /* Ajuste para telas grandes simuladas */
           .pdf-export-container {
              width: ${orientation === 'landscape' ? '1122px' : '793px'} !important; /* A4 pixels at 96dpi approx */
              max-width: none !important;
           }
        </style>
      </head>
      <body>
        ${contentHtml}
      </body>
    </html>
  `;

  // 4. Envia para o backend
  const response = await fetch(`${BACKEND_URL}/generate-pdf`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      html: fullHtml,
      orientation
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Falha ao gerar PDF: ${errorText}`);
  }

  // 5. Baixa o arquivo
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};