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
// REMOVED: html2canvas, jsPDF imports
import { generatePdfViaBackend } from './pdfUtils';

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

const AulaCard: React.FC<{ aula: Aula }> = ({ aula }) => {
  const color = stringToColor(aula.disciplina);
  
  return (
    <div 
      className="bg-slate-800 rounded-lg shadow-md border border-slate-700 border-l-4 overflow-hidden aula-card flex flex-col break-inside-avoid"
      style={{ 
        borderLeftColor: color,
        '--card-color': color
      } as React.CSSProperties}
    >
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

      <div className="flex-grow p-3 space-y-3 sub-body">
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

      {aula.observacao && (
        <div className="p-3 bg-slate-900/30 border-t border-slate-700 text-xs">
             <ObservacaoDisplay text={aula.observacao} />
        </div>
      )}
    </div>
  );
};

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

    const numericGroups = groupsArray.filter(g => !isNaN(Number(g)));
    const alphaGroups = groupsArray.filter(g => isNaN(Number(g)));

    numericGroups.sort((a, b) => Number(a) - Number(b));
    alphaGroups.sort((a, b) => a.localeCompare(b));

    const formatRange = (list: string[]) => {
        if (list.length === 0) return "";
        if (list.length === 1) return `Grupo ${list[0]}`;
        if (list.length <= 3) return `Grupos ${list.join(', ')}`;
        return `Grupos de ${list[0]} a ${list[list.length - 1]}`;
    };

    const numericSummary = formatRange(numericGroups);
    const alphaSummary = formatRange(alphaGroups);

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
    if (!schedule) return;
    setIsGeneratingPdf(true);

    try {
        const groupSummary = getGroupRangeSummary(schedule);
        const fullTitle = groupSummary 
            ? `Semana Padrão 2026.1 - ${periodo} - ${groupSummary}`
            : `Semana Padrão 2026.1 - ${periodo}`;
        
        // Create the header/content structure directly in the DOM (hidden from user but captured by script)
        // Or rely on the existing hidden container logic, but populated with state
        
        const tempContainer = document.createElement('div');
        tempContainer.className = 'pdf-export-container'; 
        tempContainer.id = 'pdf-export-temp';
        
        // Using inline SVG base64 for logo to ensure it renders in Puppeteer
        const logoSrc = afyaLogoDataUrl; 

        tempContainer.innerHTML = `
            <div class="pdf-header">
                <div>
                    <img src="${logoSrc}" alt="Afya Logo" style="height: 55px; width: auto; object-fit: contain;" />
                </div>
                <div style="text-align: right;">
                    <h2 style="color: #0057B8 !important; font-weight: 800; font-size: 16px; margin: 0 0 5px 0; text-transform: uppercase;">COORDENAÇÃO DO CURSO DE MEDICINA</h2>
                    <div style="color: #CE0058 !important; font-size: 11px; font-weight: 600;">
                        Coordenador do Curso: Prof. Kristhea Karyne <span style="margin:0 6px;">|</span> 
                        Coordenadora Adjunta: Prof. Roberya Viana
                    </div>
                </div>
            </div>
            
            <h2 class="pdf-title">${fullTitle}</h2>
            
            <div class="pdf-export-grid">
                ${document.getElementById('schedule-grid-source')?.innerHTML || ''}
            </div>
        `;

        document.body.appendChild(tempContainer);

        await generatePdfViaBackend('pdf-export-temp', `Cronograma_${periodo}.pdf`, 'landscape');
        
        document.body.removeChild(tempContainer);

    } catch (e) {
        console.error("Erro ao gerar PDF:", e);
        alert("Não foi possível gerar o PDF. Verifique se o servidor backend está rodando.");
    } finally {
        setIsGeneratingPdf(false);
    }
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
              <ExternalLinkIcon className="w-4 h-4" /> Baixar PDF (Alta Qualidade)
            </>
          )}
        </button>
      </div>
      <div id="schedule-grid-source">
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