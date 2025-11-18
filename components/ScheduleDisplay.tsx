
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
  <div className={`bg-green-50/5 border border-green-200/20 rounded-lg flex items-center justify-center text-green-200/80 shadow-sm free-slot-card ${isFullDay ? 'flex-col p-6 h-40 gap-2' : 'p-3 gap-3'}`}>
     <CoffeeIcon className={`${isFullDay ? 'w-8 h-8' : 'w-5 h-5'} opacity-70`} />
     <div className="flex flex-col items-center">
        <span className={`font-medium tracking-wide ${isFullDay ? 'text-lg' : 'text-sm'}`}>Horário Livre</span>
        {isFullDay ? (
           <span className="text-xs opacity-60 mt-1">Dia sem atividades agendadas</span>
        ) : (
           aula && (
            <>
                <span className="text-xs opacity-70">({aula.horario})</span>
                {aula.observacao && (
                    <span className="text-[10px] uppercase tracking-wider font-semibold opacity-50 mt-1 text-green-200">
                        {aula.observacao}
                    </span>
                )}
            </>
           )
        )}
     </div>
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
    // Use innerHTML for complex layout to ensure styles are applied correctly for html2canvas
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
    bodyWrapper.style.backgroundColor = '#ffffff';
    bodyWrapper.style.padding = '10px 40px 40px 40px';
    bodyWrapper.style.width = '1600px';
    bodyWrapper.appendChild(gridTitleContainer);
    bodyWrapper.appendChild(contentClone);
    
    tempContainer.appendChild(headerWrapper);
    tempContainer.appendChild(bodyWrapper);
    document.body.appendChild(tempContainer);

    // --- 2. Generate PDF ---
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
        const bodyCanvas = await html2canvas(bodyWrapper, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false
        });
        const bodyImgData = bodyCanvas.toDataURL('image/png');
        
        // PDF Setup (A3 Landscape)
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a3',
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        // Calculate Dimensions
        const headerPdfHeight = (headerImgProps.height * pdfWidth) / headerImgProps.width;
        const bodyImgProps = pdf.getImageProperties(bodyImgData);
        const bodyPdfHeight = (bodyImgProps.height * pdfWidth) / bodyImgProps.width;
        
        const pageContentHeight = pdfHeight - headerPdfHeight - 10; // 10mm margin bottom

        let heightLeft = bodyPdfHeight;
        let position = 0; // Position within the source body image

        // --- Page Loop ---
        while (heightLeft > 0) {
             // Draw Fixed Header at Top
             pdf.addImage(headerImgData, 'PNG', 0, 0, pdfWidth, headerPdfHeight);
             
             const printY = headerPdfHeight - position;
             
             // Add Body Image (allowing overlap/crop logic handled by PDF viewer mostly, or simple placement)
             pdf.addImage(bodyImgData, 'PNG', 0, printY, pdfWidth, bodyPdfHeight);
             
             // Mask the top area (where the body image might bleed up into the header on subsequent pages)
             // Re-drawing the header cleanly over it ensures no visual glitches.
             pdf.setFillColor(255, 255, 255);
             // Create a white box exactly where the header is to clear any underlying body bits
             pdf.rect(0, 0, pdfWidth, headerPdfHeight, 'F'); 
             // Redraw header
             pdf.addImage(headerImgData, 'PNG', 0, 0, pdfWidth, headerPdfHeight);
             
             heightLeft -= pageContentHeight;
             position += pageContentHeight;
             
             if (heightLeft > 0) {
                 pdf.addPage();
             }
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
