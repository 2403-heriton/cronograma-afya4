
import React, { useState } from 'react';
import type { Schedule, DiaDeAula, Aula } from '../types';
import ClockIcon from './icons/ClockIcon';
import LocationIcon from './icons/LocationIcon';
import NotFoundIcon from './icons/NotFoundIcon';
import UserIcon from './icons/UserIcon';
import InfoIcon from './icons/InfoIcon';
import ExternalLinkIcon from './icons/ExternalLinkIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import CoffeeIcon from './icons/CoffeeIcon';
import { stringToColor } from '../services/colorService';
import { afyaLogoDataUrl } from './icons/AfyaLogo';

// Helper para exibir a observação em destaque
const ObservacaoDisplay: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;
  return (
    <div className="mt-2 pt-2 border-t border-slate-700/50">
      <div className="flex items-start gap-2 text-xs text-amber-300 bg-amber-900/20 p-2 rounded-md">
        <InfoIcon className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
        <p>{text}</p>
      </div>
    </div>
  );
};

// Card para horários livres / intervalos
const FreeSlotCard: React.FC<{ aula?: Aula; isFullDay?: boolean }> = ({ aula, isFullDay }) => (
  <div className={`bg-green-50/5 border border-green-200/20 rounded-lg flex flex-col items-center justify-center text-green-200/80 shadow-sm free-slot-card ${isFullDay ? 'p-6 h-40 gap-2' : 'p-3 gap-2'}`}>
     <div className="flex items-center gap-2 opacity-80">
         <CoffeeIcon className={`${isFullDay ? 'w-8 h-8' : 'w-5 h-5'}`} />
         <span className={`font-medium tracking-wide ${isFullDay ? 'text-lg' : 'text-sm'}`}>Horário Livre</span>
     </div>
     
     {isFullDay ? (
        <span className="text-xs opacity-60 mt-1">Dia sem atividades agendadas</span>
     ) : (
        aula && (
         <div className="flex flex-col items-center w-full">
             <span className="text-xs opacity-90 font-semibold mb-1">{aula.horario}</span>
             {aula.observacao && (
                 <div className="mt-1 w-full border-t border-green-200/20 pt-1 text-center">
                     <span className="text-[10px] uppercase tracking-wider font-bold opacity-70 block text-xs">
                        PARA:
                     </span>
                     <span className="text-xs font-bold text-green-100 group-target">
                         {aula.observacao}
                     </span>
                 </div>
             )}
         </div>
        )
     )}
  </div>
);

// Card de aula
const AulaCard: React.FC<{ aula: Aula }> = ({ aula }) => {
  const color = stringToColor(aula.disciplina);
  
  return (
    <div 
      className="bg-slate-800 rounded-lg shadow-md border border-slate-700 border-l-4 overflow-hidden aula-card flex flex-col"
      style={{ 
        borderLeftColor: color,
        '--card-color': color
      } as React.CSSProperties}
    >
      {/* Header da Disciplina */}
      <div className="p-3 bg-slate-800/50 border-b border-slate-700 discipline-header">
        <div className="flex justify-between items-start gap-2">
           <h4 className="font-bold text-gray-100 text-base leading-tight">
            {aula.disciplina}
          </h4>
          {aula.modulo === 'Eletiva' && (
            <span className="bg-purple-900/50 text-purple-300 text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 uppercase tracking-wider">
              ELETIVA
            </span>
          )}
        </div>
      </div>

      {/* Lista de Grupos - Renderizados como mini-cards internos */}
      <div className="flex-grow p-3 space-y-3">
        {aula.subSessions.map((sessao, idx) => {
            const isMultiGroup = sessao.grupo.includes(',');
            return (
            <div 
                key={`${sessao.grupo}-${idx}`} 
                className="bg-slate-900/50 border border-slate-700 rounded-md p-3 aula-inner-card"
            >
                <div className="flex flex-wrap justify-between items-center gap-2 mb-2 border-b border-slate-700/50 pb-2">
                     <span className="font-bold text-afya-blue bg-blue-900/20 px-2 py-0.5 rounded text-xs border border-blue-900/30">
                        {isMultiGroup ? 'Grupos:' : 'Grupo:'} {sessao.grupo}
                     </span>
                     <span className="text-gray-300 flex items-center gap-1 text-xs font-medium">
                        <ClockIcon className="w-3 h-3 text-gray-500" /> {sessao.horario}
                     </span>
                </div>
                
                <div className="space-y-1 text-gray-400 text-xs">
                     <div className="flex items-start gap-2">
                        <LocationIcon className="w-3 h-3 text-afya-pink shrink-0 mt-0.5" />
                        <span className="" title={sessao.sala}>Sala: <span className="text-gray-300 font-medium">{sessao.sala}</span></span>
                     </div>
                     <div className="flex items-start gap-2">
                        <UserIcon className="w-3 h-3 text-afya-pink shrink-0 mt-0.5" />
                         <span className="" title={sessao.professor}>Prof: <span className="text-gray-300 font-medium">{sessao.professor}</span></span>
                     </div>
                </div>
                
                {sessao.observacao && <ObservacaoDisplay text={sessao.observacao} />}
            </div>
            );
        })}
      </div>

      {/* Observação Geral da Disciplina (se houver e não estiver coberta por grupos) */}
      {aula.observacao && (
        <div className="p-3 bg-slate-900/30 border-t border-slate-700 text-xs">
             <ObservacaoDisplay text={aula.observacao} />
        </div>
      )}
    </div>
  );
};

// Card do dia
const DiaCard: React.FC<{ diaDeAula: DiaDeAula }> = ({ diaDeAula }) => {
  return (
    <div className="bg-slate-800 rounded-xl shadow-lg flex flex-col h-full overflow-hidden border border-slate-700 dia-card">
      <h3 className="bg-afya-pink text-white font-bold p-3 text-center tracking-wide flex-shrink-0 text-lg sticky top-0 z-10">
        {diaDeAula.dia}
      </h3>
      <div className="p-4 space-y-4 flex-grow flex flex-col bg-slate-800">
        {diaDeAula.aulas.length === 0 ? (
            <FreeSlotCard isFullDay={true} />
        ) : (
            diaDeAula.aulas.map((aula, index) => (
                aula.isFreeSlot ? (
                    <FreeSlotCard key={`free-${index}`} aula={aula} />
                ) : (
                    <AulaCard key={`${aula.disciplina}-${index}`} aula={aula} />
                )
            ))
        )}
      </div>
    </div>
  );
};

const getGroupRangeSummary = (schedule: Schedule): string => {
    const allGroups = new Set<string>();
    
    schedule.forEach(day => {
        day.aulas.forEach(aula => {
            if (aula.isFreeSlot) return;
            
            aula.subSessions.forEach(sub => {
                const subs = sub.grupo.split(',').map(s => s.trim());
                subs.forEach(cleanName => {
                    if (cleanName && cleanName.toLowerCase() !== 'eletiva' && cleanName.toLowerCase() !== 'geral') {
                        allGroups.add(cleanName);
                    }
                });
            });
        });
    });

    const groupsArray = Array.from(allGroups);
    if (groupsArray.length === 0) return "";

    groupsArray.sort((a, b) => {
        const isNumA = !isNaN(Number(a));
        const isNumB = !isNaN(Number(b));
        if (isNumA && isNumB) return Number(a) - Number(b);
        if (!isNumA && !isNumB) return a.localeCompare(b);
        return isNumA ? 1 : -1;
    });

    if (groupsArray.length === 1) {
        return `Grupo ${groupsArray[0]}`;
    }

    const isAllNumeric = groupsArray.every(g => !isNaN(Number(g)));
    if (isAllNumeric) {
        return `Grupos de ${groupsArray[0]} a ${groupsArray[groupsArray.length - 1]}`;
    }

    const isAllSingleLetters = groupsArray.every(g => g.length === 1 && g.match(/[a-zA-Z]/));
    if (isAllSingleLetters) {
         return `Grupos de ${groupsArray[0]} a ${groupsArray[groupsArray.length - 1]}`;
    }

    if (groupsArray.length <= 5) {
        return `Grupos: ${groupsArray.join(', ')}`;
    }

    return `Grupos de ${groupsArray[0]} a ${groupsArray[groupsArray.length - 1]}`;
};


interface ScheduleDisplayProps {
  schedule: Schedule | null;
  periodo: string;
}

const ScheduleDisplay: React.FC<ScheduleDisplayProps> = ({ schedule, periodo }) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleViewPdf = async () => {
    const scheduleContent = document.getElementById('schedule-pdf-content');
    if (!scheduleContent) return;
  
    setIsGeneratingPdf(true);
  
    // --- 1. Prepare Temporary Containers ---
    const tempContainer = document.createElement('div');
    tempContainer.className = 'pdf-export-container';
    
    // 1a. Create Header Element
    const headerWrapper = document.createElement('div');
    headerWrapper.style.backgroundColor = '#ffffff';
    headerWrapper.style.padding = '20px 40px 0 40px';
    headerWrapper.style.width = '1600px';

    const logoSrc = "https://cdn.cookielaw.org/logos/309bef31-1bad-4222-a8de-b66feda5e113/e1bda879-fe71-4686-b676-cc9fbc711aee/fcb85851-ec61-4efb-bae5-e72fdeacac0e/AFYA-FACULDADEMEDICAS-logo.png";

    headerWrapper.innerHTML = `
        <div class="pdf-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #CE0058; padding-bottom: 15px; margin-bottom: 10px;">
            <div style="flex-shrink: 0;">
                 <img src="${logoSrc}" style="height: 55px; width: auto; object-fit: contain;" alt="Afya Logo" crossorigin="anonymous" />
            </div>
            <div style="text-align: right; font-family: sans-serif;">
                <h2 style="color: #CE0058; font-weight: 800; font-size: 16px; margin: 0 0 5px 0; text-transform: uppercase; letter-spacing: 0.5px;">COORDENAÇÃO DO CURSO DE MEDICINA</h2>
                <div style="color: #4b5563; font-size: 11px; line-height: 1.4;">
                    <span style="font-weight: 600; color: #1f2937;">Coordenador do Curso:</span> Prof. Kristhea Karyne <span style="color:#CE0058; margin:0 6px;">|</span> 
                    <span style="font-weight: 600; color: #1f2937;">Coordenadora Adjunta:</span> Prof. Roberya Viana
                </div>
            </div>
        </div>
    `;
    
    // 1b. Create Title for Grid
    const groupSummary = schedule ? getGroupRangeSummary(schedule) : "";
    const fullTitle = groupSummary 
        ? `Grade Curricular - ${periodo} - ${groupSummary}`
        : `Grade Curricular - ${periodo}`;
    
    const gridTitleContainer = document.createElement('div');
    gridTitleContainer.innerHTML = `<h2 class="pdf-title" style="text-align: center; font-size: 24px; font-weight: bold; color: #374151; margin: 20px 0;">${fullTitle}</h2>`;
    
    // 1c. Clone Grid Content
    const contentClone = scheduleContent.cloneNode(true) as HTMLElement;
    contentClone.removeAttribute('id');
    const grid = contentClone.querySelector('.grid');
    if (grid) grid.className = 'pdf-export-grid';
    
    // Assemble Body Capture Container (Title + Grid)
    const bodyWrapper = document.createElement('div');
    bodyWrapper.id = 'pdf-body-wrapper'; // ID for DOM query during safe slicing
    bodyWrapper.style.backgroundColor = '#ffffff';
    bodyWrapper.style.padding = '10px 40px 40px 40px';
    bodyWrapper.style.width = '1600px';
    bodyWrapper.appendChild(gridTitleContainer);
    bodyWrapper.appendChild(contentClone);
    
    tempContainer.appendChild(headerWrapper);
    tempContainer.appendChild(bodyWrapper);
    document.body.appendChild(tempContainer);

    // --- 2. Generate PDF with Safe Slicing ---
    requestAnimationFrame(async () => {
      try {
        const { jsPDF } = window.jspdf;
        
        // Capture Header
        const headerCanvas = await html2canvas(headerWrapper, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false
        });
        const headerImgData = headerCanvas.toDataURL('image/png');
        const headerImgProps = new jsPDF().getImageProperties(headerImgData);

        // Capture Body
        // Note: We capture the entire long body once.
        const bodyCanvas = await html2canvas(bodyWrapper, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false
        });
        const bodyImgData = bodyCanvas.toDataURL('image/png');
        const bodyImgProps = new jsPDF().getImageProperties(bodyImgData);
        
        // PDF Setup (A3 Landscape)
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a3',
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const ratio = pdfWidth / bodyImgProps.width; // Scale ratio from canvas pixels to PDF mm
        
        // Dimensions in PDF units (mm)
        const headerPdfHeight = (headerImgProps.height * pdfWidth) / headerImgProps.width;
        const bodyTotalPdfHeight = (bodyImgProps.height * pdfWidth) / bodyImgProps.width;
        
        // Dimensions in Canvas units (pixels) - used for collision detection
        const scaleFactor = 2; // HTML2Canvas scale
        const domToCanvasRatio = scaleFactor; 
        
        // Scan the DOM to find all potential cut-points (cards)
        // We need their positions relative to the bodyWrapper top
        const cards = Array.from(bodyWrapper.querySelectorAll('.aula-card, .free-slot-card'));
        const cardPositions = cards.map(card => {
            const rect = card.getBoundingClientRect();
            const wrapperRect = bodyWrapper.getBoundingClientRect();
            return {
                top: rect.top - wrapperRect.top,
                bottom: rect.bottom - wrapperRect.top,
                height: rect.height
            };
        });

        let currentSourcePdfY = 0; // Current Y position in the source image (in PDF mm equivalents)

        // --- Page 1 ---
        // Draw Header
        pdf.addImage(headerImgData, 'PNG', 0, 0, pdfWidth, headerPdfHeight);
        
        const page1MarginTop = headerPdfHeight + 5;
        const page1AvailableHeight = pdfHeight - page1MarginTop - 10; // 10mm bottom margin

        // Calculate Safe Cut for Page 1
        let cutHeight = page1AvailableHeight;
        const proposedCutY_mm = currentSourcePdfY + cutHeight;
        
        // Convert mm to pixels to check against DOM positions
        // Since ratio = pdfWidth(mm) / canvasWidth(px)
        // px = mm / ratio
        const proposedCutY_px = proposedCutY_mm / ratio;

        // Find collision
        const collision = cardPositions.find(pos => 
            pos.top < proposedCutY_px && pos.bottom > proposedCutY_px
        );

        if (collision) {
            // If cutting through a card, stop just before it (with a 5mm buffer approx 15px)
            const safeCutY_px = Math.max(0, collision.top - 10); 
            const safeCutY_mm = safeCutY_px * ratio;
            cutHeight = safeCutY_mm - currentSourcePdfY;
        }

        // Draw Body Slice for Page 1
        // sourceY, sourceH, destX, destY, destW, destH
        // addImage(data, fmt, x, y, w, h, alias, compression, rotation)
        // But standard addImage doesn't crop. We must use a method to simulating cropping by shifting y.
        // Actually, jsPDF simply pastes the whole image. We simulate "crop" by pasting the image shifted UP
        // and masking the rest with a clipping rect (or simpler: let it overflow off-page if we weren't caring, but we care).
        // Better approach for html2canvas+jspdf multipage without splitting image manually:
        // Since we can't easily "crop" inside addImage without complexity, we stick to the "Shift Y" method.
        // The "Shift Y" method works by placing the top of the *source image* at a calculated negative Y.
        // e.g. to show the slice starting at 500px, we place the image at y = -500px (relative to the content area).

        // Actually, simpler logic for standard usage:
        // We know exactly how tall the content we WANT to show is (`cutHeight`).
        // We place the image at (0, page1MarginTop - currentSourcePdfY).
        // And we rely on the page break to hide the rest? No, content would overlap footer/margins.
        // Ideally we use a clipping rect or multiple canvases. 
        // Given the constraint, the "Shift Y" strategy is the most robust if we assume standard white bg covers previous pages.
        // BUT, to be clean:
        
        // PAGE 1 DRAW
        pdf.addImage(bodyImgData, 'PNG', 0, page1MarginTop - currentSourcePdfY, pdfWidth, bodyTotalPdfHeight);
        
        // We must cover the area *below* the cut with a white box to "hide" the next page's content
        // that might have spilled over into the margin area.
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, page1MarginTop + cutHeight, pdfWidth, pdfHeight - (page1MarginTop + cutHeight), 'F');

        currentSourcePdfY += cutHeight;

        // --- Subsequent Pages ---
        while (currentSourcePdfY < bodyTotalPdfHeight - 1) { // tolerance
             pdf.addPage();
             
             const pageTop = 10; 
             const pageAvailableHeight = pdfHeight - pageTop - 10;
             
             // Calculate Safe Cut
             let nextCutHeight = pageAvailableHeight;
             const nextProposedCutY_mm = currentSourcePdfY + nextCutHeight;
             const nextProposedCutY_px = nextProposedCutY_mm / ratio;
             
             const nextCollision = cardPositions.find(pos => 
                pos.top < nextProposedCutY_px && pos.bottom > nextProposedCutY_px
             );
             
             if (nextCollision) {
                 const safeCutY_px = Math.max(0, nextCollision.top - 10);
                 const safeCutY_mm = safeCutY_px * ratio;
                 nextCutHeight = safeCutY_mm - currentSourcePdfY;
             }

             // Draw content shifted up
             // Image starts at 'pageTop' visually, so we subtract currentSourcePdfY
             pdf.addImage(bodyImgData, 'PNG', 0, pageTop - currentSourcePdfY, pdfWidth, bodyTotalPdfHeight);
             
             // White-out the bottom margin area to hide spillover
             if (pageTop + nextCutHeight < pdfHeight) {
                 pdf.setFillColor(255, 255, 255);
                 pdf.rect(0, pageTop + nextCutHeight, pdfWidth, pdfHeight - (pageTop + nextCutHeight), 'F');
             }
             
             // White-out the top margin area (to hide previous content that was shifted up)
             pdf.setFillColor(255, 255, 255);
             pdf.rect(0, 0, pdfWidth, pageTop, 'F');

             currentSourcePdfY += nextCutHeight;
             
             // Break loop if we are stuck (no progress)
             if (nextCutHeight <= 0) break;
        }

        window.open(pdf.output('bloburl'), '_blank');

      } catch (e) {
        console.error('Erro ao gerar o PDF:', e);
        alert('Ocorreu um erro ao gerar o PDF. Tente novamente.');
      } finally {
        document.body.removeChild(tempContainer);
        setIsGeneratingPdf(false);
      }
    });
  };
  
  const hasClasses = schedule && schedule.length > 0;

  if (!hasClasses) {
    return (
      <div className="text-center p-8 bg-slate-800 rounded-lg shadow-lg border border-slate-700 animate-fade-in">
        <NotFoundIcon className="w-16 h-16 mx-auto text-gray-500 mb-4" />
        <p className="text-xl font-semibold text-gray-200">Nenhuma informação disponível</p>
        <p className="text-md mt-1 text-gray-400">
          Não foi possível carregar a estrutura da semana.
        </p>
      </div>
    );
  }

  return (
    <div>
       <div className="flex justify-end mb-6">
        <button
          onClick={handleViewPdf}
          disabled={isGeneratingPdf}
          className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-gray-300 font-semibold py-2 px-4 rounded-lg transition-colors duration-200 border border-slate-600 disabled:opacity-50 disabled:cursor-wait shadow-sm"
        >
          {isGeneratingPdf ? (
            <>
              <SpinnerIcon className="w-4 h-4" /> Gerando PDF...
            </>
          ) : (
            <>
              <ExternalLinkIcon className="w-4 h-4" /> Visualizar PDF
            </>
          )}
        </button>
      </div>
      <div id="schedule-pdf-content">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {schedule.map((dia, index) => (
            <div key={dia.dia} className="animate-fade-in h-full" style={{ animationDelay: `${index * 50}ms` }}>
              <DiaCard diaDeAula={dia} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScheduleDisplay;
