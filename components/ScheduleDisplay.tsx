
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
        {aula.subSessions.map((sessao, idx) => (
            <div 
                key={`${sessao.grupo}-${idx}`} 
                className="bg-slate-900/50 border border-slate-700 rounded-md p-3 aula-inner-card"
            >
                <div className="flex flex-wrap justify-between items-center gap-2 mb-2 border-b border-slate-700/50 pb-2">
                     <span className="font-bold text-afya-blue bg-blue-900/20 px-2 py-0.5 rounded text-xs border border-blue-900/30">
                        Grupo: {sessao.grupo.replace(/^(GRUPO|Grupo)\s*-\s*|^(GRUPO|Grupo)\s+/i, '')}
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
        ))}
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

// --- Helper function to summarize groups for PDF title ---
const getGroupRangeSummary = (schedule: Schedule): string => {
    const allGroups = new Set<string>();
    
    schedule.forEach(day => {
        day.aulas.forEach(aula => {
            if (aula.isFreeSlot) return;
            // Ignore Electives for the main group summary usually, or include them if desired.
            // The user prompt asks to summarize groups like "Groups A to E".
            // Usually "Eletiva" is a generic group name, so we might filter it out if it's exactly "Eletiva".
            
            aula.subSessions.forEach(sub => {
                const cleanName = sub.grupo.replace(/^(GRUPO|Grupo)\s*-\s*|^(GRUPO|Grupo)\s+/i, '').trim();
                if (cleanName && cleanName.toLowerCase() !== 'eletiva' && cleanName.toLowerCase() !== 'geral') {
                    allGroups.add(cleanName);
                }
            });
        });
    });

    const groupsArray = Array.from(allGroups);
    
    if (groupsArray.length === 0) return "";

    // Sort logic similar to service
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

    // Check if sequential numeric
    const isAllNumeric = groupsArray.every(g => !isNaN(Number(g)));
    if (isAllNumeric) {
        return `Grupos de ${groupsArray[0]} a ${groupsArray[groupsArray.length - 1]}`;
    }

    // Check if sequential single letters (A, B, C...)
    const isAllSingleLetters = groupsArray.every(g => g.length === 1 && g.match(/[a-zA-Z]/));
    if (isAllSingleLetters) {
         return `Grupos de ${groupsArray[0]} a ${groupsArray[groupsArray.length - 1]}`;
    }

    // Fallback for mixed or non-sequential: just list them or say "Grupos Selecionados" if too many
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
    if (!scheduleContent) {
      console.error('Elemento do cronograma não encontrado para gerar o PDF.');
      return;
    }
  
    setIsGeneratingPdf(true);
  
    // 1. Cria um contêiner invisível para o conteúdo do PDF.
    const pdfContainer = document.createElement('div');
    pdfContainer.className = 'pdf-export-container';
    
    // Adiciona a marca d'água
    const watermark = document.createElement('img');
    watermark.src = 'https://cdn.prod.website-files.com/65e07e5b264deb36f6e003d9/6883f05c26e613e478e32cd9_A.png';
    watermark.alt = "Marca d'água Afya";
    watermark.className = 'pdf-watermark';
    pdfContainer.appendChild(watermark);

    // 2. Cria e adiciona o cabeçalho do PDF.
    const header = document.createElement('div');
    header.className = 'pdf-header';

    // Container Esquerdo (Logo)
    const leftContainer = document.createElement('div');
    leftContainer.className = 'pdf-header-left';
    
    const logo = document.createElement('img');
    logo.src = 'https://cdn.cookielaw.org/logos/309bef31-1bad-4222-a8de-b66feda5e113/e1bda879-fe71-4686-b676-cc9fbc711aee/fcb85851-ec61-4efb-bae5-e72fdeacac0e/AFYA-FACULDADEMEDICAS-logo.png';
    logo.alt = 'Logo Afya Ciências Médicas';
    logo.className = 'pdf-logo';
    
    leftContainer.appendChild(logo);

    // Container Direito (Coordenação)
    const rightContainer = document.createElement('div');
    rightContainer.className = 'pdf-header-right';

    const coordTitle = document.createElement('div');
    coordTitle.className = 'pdf-coord-title';
    coordTitle.textContent = 'COORDENAÇÃO DO CURSO DE MEDICINA';

    const coordNames = document.createElement('div');
    coordNames.className = 'pdf-coord-names';
    coordNames.innerHTML = 'Coordenador do Curso Prof. Kristhea Karyne <span style="color:#CE0058; margin:0 5px">|</span> Coordenadora Adjunta Prof. Roberya Viana';

    rightContainer.appendChild(coordTitle);
    rightContainer.appendChild(coordNames);

    header.appendChild(leftContainer);
    header.appendChild(rightContainer);
    pdfContainer.appendChild(header);
    
    // 3. Adiciona o título contextual com o período E O RESUMO DOS GRUPOS
    const groupSummary = schedule ? getGroupRangeSummary(schedule) : "";
    const fullTitle = groupSummary 
        ? `Grade Curricular - ${periodo} - ${groupSummary}`
        : `Grade Curricular - ${periodo}`;

    const scheduleTitle = document.createElement('h2');
    scheduleTitle.className = 'pdf-title';
    scheduleTitle.textContent = fullTitle;
    pdfContainer.appendChild(scheduleTitle);


    // 4. Clona o conteúdo do cronograma e o prepara para exportação.
    const contentClone = scheduleContent.cloneNode(true) as HTMLElement;
    contentClone.removeAttribute('id'); // Remove o ID para evitar duplicatas
    const grid = contentClone.querySelector('.grid');
    if (grid) {
      grid.className = 'pdf-export-grid';
    }
    pdfContainer.appendChild(contentClone);

    // 5. Anexa o contêiner preparado ao corpo do documento.
    document.body.appendChild(pdfContainer);

    // 6. Aguarda o próximo frame para garantir que o navegador renderizou o conteúdo clonado.
    requestAnimationFrame(async () => {
      try {
        const { jsPDF } = window.jspdf;
        // Renderiza o contêiner invisível em uma imagem canvas.
        const canvas = await html2canvas(pdfContainer, {
          scale: 2, // Aumenta a resolução para melhor qualidade de impressão
          useCORS: true,
          backgroundColor: '#ffffff'
        });
        const imgData = canvas.toDataURL('image/png');

        // Cria o PDF. A3 (420x297mm) em paisagem.
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a3',
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        const imgProps = pdf.getImageProperties(imgData);
        const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
          heightLeft -= pdfHeight;
        }

        // Abre o PDF em uma nova aba ao invés de baixar.
        const pdfUrl = pdf.output('bloburl');
        window.open(pdfUrl, '_blank');

      } catch (e) {
        console.error('Erro ao gerar o PDF:', e);
        alert('Ocorreu um erro ao gerar o PDF. Tente novamente.');
      } finally {
        // 7. Remove o contêiner temporário do corpo do documento.
        document.body.removeChild(pdfContainer);
        setIsGeneratingPdf(false);
      }
    });
  };
  
  // Verifica se há aulas em algum dia
  // Agora exibimos o cronograma mesmo se não houver aulas, pois queremos mostrar "Horário Livre"
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
