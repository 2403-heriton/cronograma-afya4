
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
        <div className="flex justify-between items-start gap-2 w-full">
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
                     <div className="flex items-start gap-2 items-start">
                        <LocationIcon className="w-3 h-3 text-afya-pink shrink-0 mt-0.5" />
                        <span className="" title={sessao.sala}>Sala: <span className="text-gray-300 font-medium">{sessao.sala}</span></span>
                     </div>
                     <div className="flex items-start gap-2 items-start">
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
    
    // 1. Extrair todos os grupos únicos do cronograma visível
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

    // 2. Separar em Numéricos e Alfabéticos
    const numericGroups = groupsArray.filter(g => !isNaN(Number(g)));
    const alphaGroups = groupsArray.filter(g => isNaN(Number(g)));

    // 3. Ordenar cada lista
    numericGroups.sort((a, b) => Number(a) - Number(b));
    alphaGroups.sort((a, b) => a.localeCompare(b));

    // 4. Função auxiliar para formatar o intervalo
    const formatRange = (list: string[]) => {
        if (list.length === 0) return "";
        if (list.length === 1) return `Grupo ${list[0]}`;
        if (list.length <= 3) return `Grupos ${list.join(', ')}`; // Lista curta
        return `Grupos de ${list[0]} a ${list[list.length - 1]}`; // Intervalo
    };

    const numericSummary = formatRange(numericGroups);
    const alphaSummary = formatRange(alphaGroups);

    // 5. Combinar os resultados
    if (numericSummary && alphaSummary) {
        return `${alphaSummary} e ${numericSummary}`;
    }

    return numericSummary || alphaSummary;
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
    // Force the browser to render it now by adding a 'capturing' class
    tempContainer.classList.add('capturing');
    
    // Configuração de largura A4 Paisagem otimizada
    const CAPTURE_WIDTH = 1280;

    // 1a. Create Header Element
    const headerWrapper = document.createElement('div');
    headerWrapper.style.backgroundColor = '#ffffff';
    headerWrapper.style.padding = '20px 40px 0 40px';
    headerWrapper.style.width = `${CAPTURE_WIDTH}px`;

    // Use a direct URL for the logo to ensure it loads in the canvas
    const logoSrc = "https://cdn.cookielaw.org/logos/309bef31-1bad-4222-a8de-b66feda5e113/e1bda879-fe71-4686-b676-cc9fbc711aee/fcb85851-ec61-4efb-bae5-e72fdeacac0e/AFYA-FACULDADEMEDICAS-logo.png";

    headerWrapper.innerHTML = `
        <div class="pdf-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #CE0058; padding-bottom: 15px; margin-bottom: 10px;">
            <div style="flex-shrink: 0;">
                 <img src="${logoSrc}" style="height: 55px; width: auto; object-fit: contain; display: block;" alt="Afya Logo" crossorigin="anonymous" />
            </div>
            <div style="text-align: right; font-family: sans-serif;">
                <h2 style="color: #0057B8; font-weight: 800; font-size: 16px; margin: 0 0 5px 0; text-transform: uppercase; letter-spacing: 0.5px;">COORDENAÇÃO DO CURSO DE MEDICINA</h2>
                <div style="color: #CE0058; font-size: 11px; line-height: 1.4; font-weight: 600;">
                    Coordenador do Curso: Prof. Kristhea Karyne <span style="margin:0 6px;">|</span> 
                    Coordenadora Adjunta: Prof. Roberya Viana
                </div>
            </div>
        </div>
    `;
    
    // 1b. Create Title for Grid
    const groupSummary = schedule ? getGroupRangeSummary(schedule) : "";
    const fullTitle = groupSummary 
        ? `Semana Padrão 2026.1 - ${periodo} - ${groupSummary}`
        : `Semana Padrão 2026.1 - ${periodo}`;
    
    const gridTitleContainer = document.createElement('div');
    gridTitleContainer.innerHTML = `<h2 class="pdf-title" style="text-align: center; font-size: 20px; font-weight: bold; color: #374151; margin: 15px 0;">${fullTitle}</h2>`;
    
    // 1c. Clone Grid Content
    const contentClone = scheduleContent.cloneNode(true) as HTMLElement;
    contentClone.removeAttribute('id');
    const grid = contentClone.querySelector('.grid');
    if (grid) grid.className = 'pdf-export-grid';
    
    // Assemble Body Capture Container (Title + Grid)
    const bodyWrapper = document.createElement('div');
    bodyWrapper.id = 'pdf-body-wrapper';
    bodyWrapper.style.backgroundColor = '#ffffff';
    bodyWrapper.style.padding = '10px 40px 40px 40px';
    bodyWrapper.style.width = `${CAPTURE_WIDTH}px`;
    bodyWrapper.appendChild(gridTitleContainer);
    bodyWrapper.appendChild(contentClone);
    
    tempContainer.appendChild(headerWrapper);
    tempContainer.appendChild(bodyWrapper);
    document.body.appendChild(tempContainer);

    // Use setTimeout to allow the browser to perform the layout paint before capturing
    // increased to 2000ms to ensure fonts and styles are ready
    await document.fonts.ready;
    
    setTimeout(async () => {
      try {
        const { jsPDF } = window.jspdf;
        
        const canvasOptions = {
          scale: 2,
          useCORS: true,
          allowTaint: true, // Permite imagens de origens diferentes
          backgroundColor: '#ffffff',
          logging: false,
          windowWidth: 1600 // Força renderização como desktop para evitar layout mobile
        };

        // Capture Header
        const headerCanvas = await html2canvas(headerWrapper, canvasOptions);
        const headerImgData = headerCanvas.toDataURL('image/png');
        const headerImgProps = new jsPDF().getImageProperties(headerImgData);

        // Capture Body
        const bodyCanvas = await html2canvas(bodyWrapper, canvasOptions);
        const bodyImgData = bodyCanvas.toDataURL('image/png');
        const bodyImgProps = new jsPDF().getImageProperties(bodyImgData);
        
        // PDF Setup (A4 Landscape)
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4',
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const ratio = pdfWidth / bodyImgProps.width; // Scale ratio from canvas pixels to PDF mm
        
        // Dimensions in PDF units (mm)
        const headerPdfHeight = (headerImgProps.height * pdfWidth) / headerImgProps.width;
        const bodyTotalPdfHeight = (bodyImgProps.height * pdfWidth) / bodyImgProps.width;
        
        // Dimensions in Canvas units (pixels) - used for collision detection
        const cards = Array.from(bodyWrapper.querySelectorAll('.aula-card, .free-slot-card'));
        const cardPositions = cards.map(card => {
            const rect = card.getBoundingClientRect();
            const wrapperRect = bodyWrapper.getBoundingClientRect();
            return {
                top: rect.top - wrapperRect.top,
                bottom: rect.bottom - wrapperRect.top,
                left: rect.left - wrapperRect.left,
                height: rect.height
            };
        });

        let currentSourcePdfY = 0; // Current Y position in the source image (in PDF mm equivalents)

        // --- PAGE 1 ---
        
        // Draw Header
        pdf.addImage(headerImgData, 'PNG', 0, 0, pdfWidth, headerPdfHeight);
        
        const page1MarginTop = headerPdfHeight + 5;
        const page1AvailableHeight = pdfHeight - page1MarginTop - 10; // 10mm bottom margin

        // 1. Calculate Safe Cut for Page 1 (Pixel Conversion)
        const currentSourcePx = currentSourcePdfY / ratio;
        const page1AvailableHeightPx = page1AvailableHeight / ratio;
        let proposedCutPx = currentSourcePx + page1AvailableHeightPx;
        
        // 2. Max 4 Cards per Column Constraint (PAGE 1)
        const visibleCardsP1 = cardPositions.filter(p => p.top >= currentSourcePx - 5);
        const columnsP1: Record<number, typeof cardPositions> = {};
        
        visibleCardsP1.forEach(p => {
             const colKey = Math.round(p.left / 50) * 50; 
             if (!columnsP1[colKey]) columnsP1[colKey] = [];
             columnsP1[colKey].push(p);
        });
        
        let countLimitPxP1 = Infinity;
        Object.values(columnsP1).forEach(colCards => {
            colCards.sort((a, b) => a.top - b.top);
            // SE TEM MAIS DE 4 CARDS, CORTAR APÓS O 4º
            if (colCards.length > 4) {
                const card4 = colCards[3]; // index 3 is the 4th card
                const card5 = colCards[4]; // index 4 is the 5th card
                // Calculate midpoint for cleaner cut between card 4 and 5
                const midpoint = (card4.bottom + card5.top) / 2;
                
                if (midpoint > currentSourcePx && midpoint < countLimitPxP1) {
                     countLimitPxP1 = midpoint;
                }
            }
        });
        
        if (countLimitPxP1 < proposedCutPx) {
            proposedCutPx = countLimitPxP1;
        }

        // 3. Collision Detection
        const collisionP1 = cardPositions.find(pos => 
            pos.top < proposedCutPx && pos.bottom > proposedCutPx
        );

        if (collisionP1) {
            // Aumentado o buffer de segurança para 60px para evitar cortes em bordas e sombras
            proposedCutPx = Math.max(currentSourcePx, collisionP1.top - 60);
        }
        
        // Convert back to mm for slicing
        const cutHeightMm = (proposedCutPx * ratio) - currentSourcePdfY;

        // PAGE 1 DRAW
        pdf.addImage(bodyImgData, 'PNG', 0, page1MarginTop - currentSourcePdfY, pdfWidth, bodyTotalPdfHeight);
        
        // Mask Bottom
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, page1MarginTop + cutHeightMm, pdfWidth, pdfHeight - (page1MarginTop + cutHeightMm), 'F');

        currentSourcePdfY += cutHeightMm;

        // --- Subsequent Pages ---
        while (currentSourcePdfY < bodyTotalPdfHeight - 1) { // tolerance
             pdf.addPage();
             
             const pageTop = 10; 
             const pageAvailableHeight = pdfHeight - pageTop - 10;
             
             // 1. Standard Cut
             const currentSubSourcePx = currentSourcePdfY / ratio;
             const pageAvailableHeightPx = pageAvailableHeight / ratio;
             let nextProposedCutPx = currentSubSourcePx + pageAvailableHeightPx;

             // 2. Max 4 Cards Constraint (SUBSEQUENT PAGES)
             const visibleCardsSub = cardPositions.filter(p => p.top >= currentSubSourcePx - 5);
             const columnsSub: Record<number, typeof cardPositions> = {};
             
             visibleCardsSub.forEach(p => {
                  const colKey = Math.round(p.left / 50) * 50;
                  if (!columnsSub[colKey]) columnsSub[colKey] = [];
                  columnsSub[colKey].push(p);
             });
             
             let countLimitPxSub = Infinity;
             Object.values(columnsSub).forEach(colCards => {
                colCards.sort((a, b) => a.top - b.top);
                // SE TEM MAIS DE 4 CARDS NESTA PÁGINA, CORTAR APÓS O 4º
                if (colCards.length > 4) {
                    const card4 = colCards[3];
                    const card5 = colCards[4];
                    const midpoint = (card4.bottom + card5.top) / 2;
                    
                    if (midpoint > currentSubSourcePx && midpoint < countLimitPxSub) {
                        countLimitPxSub = midpoint;
                    }
                }
             });
             
             if (countLimitPxSub < nextProposedCutPx) {
                 nextProposedCutPx = countLimitPxSub;
             }
             
             // 3. Collision Detection
             const nextCollision = cardPositions.find(pos => 
                pos.top < nextProposedCutPx && pos.bottom > nextProposedCutPx
             );
             
             if (nextCollision) {
                 // Aumentado o buffer de segurança para 60px
                 nextProposedCutPx = Math.max(currentSubSourcePx, nextCollision.top - 60);
             }

             const nextCutHeightMm = (nextProposedCutPx * ratio) - currentSourcePdfY;

             // Draw content shifted up
             pdf.addImage(bodyImgData, 'PNG', 0, pageTop - currentSourcePdfY, pdfWidth, bodyTotalPdfHeight);
             
             // Mask Bottom
             if (pageTop + nextCutHeightMm < pdfHeight) {
                 pdf.setFillColor(255, 255, 255);
                 pdf.rect(0, pageTop + nextCutHeightMm, pdfWidth, pdfHeight - (pageTop + nextCutHeightMm), 'F');
             }
             
             // Mask Top (hide previous content)
             pdf.setFillColor(255, 255, 255);
             pdf.rect(0, 0, pdfWidth, pageTop, 'F');

             currentSourcePdfY += nextCutHeightMm;
             
             // Break if stuck
             if (nextCutHeightMm <= 0.1) break;
        }

        // TENTAR VISUALIZAR (FALLBACK PARA DOWNLOAD SE BLOQUEADO)
        const pdfBlobUrl = pdf.output('bloburl');
        const newWindow = window.open(pdfBlobUrl, '_blank');
        
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
            // Se o popup foi bloqueado, faz o download e avisa
            console.warn("Popup bloqueado. Iniciando download automático.");
            pdf.save(`Cronograma_${periodo}.pdf`);
            alert("O PDF foi baixado automaticamente porque a visualização em nova aba foi bloqueada pelo navegador.");
        }

      } catch (e) {
        console.error('Erro ao gerar o PDF:', e);
        alert('Ocorreu um erro ao gerar o PDF. Tente novamente.');
      } finally {
        document.body.removeChild(tempContainer);
        setIsGeneratingPdf(false);
      }
    }, 2000); // 2000ms delay ensures CSS is fully applied in production environment
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
