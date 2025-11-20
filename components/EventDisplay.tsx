
import React, { useState, useMemo } from 'react';
import type { Event } from '../types';
import { stringToColor } from '../services/colorService';
import { parseBrDate, normalizePeriodo } from '../services/scheduleService';
import NotFoundIcon from './icons/NotFoundIcon';
import CalendarIcon from './icons/CalendarIcon';
import ClockIcon from './icons/ClockIcon';
import LocationIcon from './icons/LocationIcon';
import ClipboardListIcon from './icons/ClipboardListIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import ExternalLinkIcon from './icons/ExternalLinkIcon';
import SearchIcon from './icons/SearchIcon';

const EventInfo: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-start gap-2 text-sm text-gray-400">
    <span className="text-afya-pink flex-shrink-0 w-3 h-3 mt-0.5">{icon}</span>
    <span><strong className="font-medium text-gray-200">{label}:</strong> {value}</span>
  </div>
);

const EventCard: React.FC<{ event: Event }> = ({ event }) => {
  const color = stringToColor(event.disciplina);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString || typeof dateString !== 'string' || dateString.trim() === '') return null;
    const parts = dateString.split('/');
    if (parts.length !== 3) return dateString;
    const [day, month, year] = parts.map(Number);
    if (isNaN(day) || isNaN(month) || isNaN(year) || year < 1970) {
        return dateString;
    }
    const date = new Date(year, month - 1, day);
    if (isNaN(date.getTime())) {
        return dateString;
    }
    return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' }).format(date);
  };

  const formattedStartDate = formatDate(event.data);
  const formattedEndDate = formatDate(event.data_fim);

  let dateDisplay = formattedStartDate;
  if (formattedEndDate && formattedEndDate !== formattedStartDate) {
      dateDisplay = `de ${formattedStartDate} à ${formattedEndDate}`;
  }

  const isGeneralEvent = normalizePeriodo(event.periodo) === 'geral';

  return (
    <div 
      className="bg-slate-800 p-4 rounded-lg border-l-4 border border-slate-700 shadow-md flex flex-col h-full event-card-pdf relative overflow-hidden"
      style={{ 
        borderLeftColor: color,
        '--event-color': color
      } as React.CSSProperties}
    >
      <div className="flex justify-between items-start mb-2">
          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${isGeneralEvent ? 'bg-gray-700 text-gray-300' : 'bg-blue-900/50 text-blue-200'}`}>
              {isGeneralEvent ? 'Geral' : event.periodo}
          </span>
      </div>

      <p className="font-bold text-gray-100 mb-2">{event.disciplina}</p>
      <div className="space-y-1">
        {dateDisplay && <EventInfo icon={<CalendarIcon />} label="Período" value={dateDisplay} />}
        <EventInfo icon={<ClipboardListIcon />} label="Tipo" value={event.tipo} />
        <EventInfo icon={<ClockIcon />} label="Horário" value={event.horario} />
        <EventInfo icon={<LocationIcon />} label="Local" value={event.local} />
        {event.grupo && event.grupo !== 'Geral' && <EventInfo icon={<SearchIcon />} label="Grupo" value={event.grupo} />}
      </div>
    </div>
  );
};

interface EventDisplayProps {
  events: Event[] | null;
  periodo: string;
}

const EventDisplay: React.FC<EventDisplayProps> = ({ events, periodo }) => {
  const [selectedType, setSelectedType] = useState<string>('Todos');
  const [selectedScope, setSelectedScope] = useState<'all' | 'specific' | 'general'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const eventTypes = useMemo(() => {
    if (!events) return [];
    const types = new Set(events.map(event => event.tipo));
    return ['Todos', ...Array.from(types).sort()];
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (!events) return null;
    
    let result = events;

    // 1. Filtro por Escopo (Período vs Geral)
    if (selectedScope === 'specific') {
        result = result.filter(event => normalizePeriodo(event.periodo) !== 'geral');
    } else if (selectedScope === 'general') {
        result = result.filter(event => normalizePeriodo(event.periodo) === 'geral');
    }

    // 2. Filtro por Tipo
    if (selectedType !== 'Todos') {
      result = result.filter(event => event.tipo === selectedType);
    }

    // 3. Filtro por Texto (Busca)
    if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        result = result.filter(event => 
            event.disciplina.toLowerCase().includes(term) ||
            event.local.toLowerCase().includes(term) ||
            event.modulo.toLowerCase().includes(term) ||
            event.grupo.toLowerCase().includes(term) ||
            event.tipo.toLowerCase().includes(term)
        );
    }

    return result;
  }, [events, selectedType, selectedScope, searchTerm]);
  
  const groupedByMonth = useMemo(() => {
    if (!filteredEvents) return {};

    return filteredEvents.reduce<Record<string, Event[]>>((acc, event) => {
        const date = parseBrDate(event.data);
        if (isNaN(date.getTime()) || date.getFullYear() < 1971) return acc;
        
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!acc[monthKey]) {
            acc[monthKey] = [];
        }
        acc[monthKey].push(event);
        return acc;
    }, {});
  }, [filteredEvents]);
  
  const sortedMonthKeys = useMemo(() => Object.keys(groupedByMonth).sort(), [groupedByMonth]);

  const handleViewPdf = async () => {
    const eventsContent = document.getElementById('events-pdf-content');
    if (!eventsContent) {
      console.error('Elemento de eventos não encontrado para gerar o PDF.');
      return;
    }
  
    setIsGeneratingPdf(true);
  
    // --- 1. Prepare Temporary Container ---
    const tempContainer = document.createElement('div');
    tempContainer.className = 'pdf-export-container'; // Default width is 1280px (landscape)
    tempContainer.classList.add('capturing');
    const CAPTURE_WIDTH = 1280; 
    
    // 1a. Create Header Element (Identical to Schedule Display)
    const headerWrapper = document.createElement('div');
    headerWrapper.style.backgroundColor = '#ffffff';
    headerWrapper.style.padding = '20px 40px 0 40px';
    headerWrapper.style.width = `${CAPTURE_WIDTH}px`;

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

    // 1b. Create Title
    const gridTitleContainer = document.createElement('div');
    gridTitleContainer.innerHTML = `<h2 class="pdf-title" style="text-align: center; font-size: 20px; font-weight: bold; color: #374151; margin: 15px 0;">Calendário de Eventos - ${periodo}</h2>`;

    // 1c. Clone Body Content
    const contentClone = eventsContent.cloneNode(true) as HTMLElement;
    contentClone.removeAttribute('id');
    const monthGroups = contentClone.querySelectorAll('.event-month-group-pdf');
    monthGroups.forEach(group => {
        const grid = group.querySelector('.grid');
        if (grid) {
            grid.className = 'pdf-export-event-grid';
        }
    });
    
    // Body Wrapper
    const bodyWrapper = document.createElement('div');
    bodyWrapper.id = 'pdf-events-body-wrapper';
    bodyWrapper.style.backgroundColor = '#ffffff';
    bodyWrapper.style.padding = '10px 40px 40px 40px';
    bodyWrapper.style.width = `${CAPTURE_WIDTH}px`;
    bodyWrapper.appendChild(gridTitleContainer);
    bodyWrapper.appendChild(contentClone);
    
    tempContainer.appendChild(headerWrapper);
    tempContainer.appendChild(bodyWrapper);
    document.body.appendChild(tempContainer);

    await document.fonts.ready;
    
    setTimeout(async () => {
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
        const bodyImgProps = new jsPDF().getImageProperties(bodyImgData);

        // A4 Landscape
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4',
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const ratio = pdfWidth / bodyImgProps.width;
        
        const headerPdfHeight = (headerImgProps.height * pdfWidth) / headerImgProps.width;
        const bodyTotalPdfHeight = (bodyImgProps.height * pdfWidth) / bodyImgProps.width;

        // Scan DOM for Safe Slicing (Cards AND Month Headers)
        const elementsToScan = Array.from(bodyWrapper.querySelectorAll('.event-card-pdf, .event-month-group-pdf h3'));
        
        const elementPositions = elementsToScan.map(el => {
            const rect = el.getBoundingClientRect();
            const wrapperRect = bodyWrapper.getBoundingClientRect();
            const isCard = el.classList.contains('event-card-pdf');
            return {
                top: rect.top - wrapperRect.top,
                bottom: rect.bottom - wrapperRect.top,
                left: rect.left - wrapperRect.left,
                isCard: isCard
            };
        });

        let currentSourcePdfY = 0;

        // --- PAGE 1 ---
        pdf.addImage(headerImgData, 'PNG', 0, 0, pdfWidth, headerPdfHeight);
        
        const page1MarginTop = headerPdfHeight + 5;
        const page1AvailableHeight = pdfHeight - page1MarginTop - 10; // 10mm bottom margin
        
        const currentSourcePx = currentSourcePdfY / ratio;
        const page1AvailableHeightPx = page1AvailableHeight / ratio;
        let proposedCutPx = currentSourcePx + page1AvailableHeightPx;
        
        // --- LOGIC: MAX 3 CARDS PER COLUMN PER PAGE (Landscape) ---
        const visibleElementsP1 = elementPositions.filter(p => p.top >= currentSourcePx - 5);
        
        // Group only cards by column
        const cardsP1 = visibleElementsP1.filter(p => p.isCard);
        const columnsP1: Record<number, typeof elementPositions> = {};
        
        cardsP1.forEach(p => {
             // Approximate column grouping (3 columns in 1280px ~ 426px width)
             const colKey = Math.round(p.left / 420) * 420; 
             if (!columnsP1[colKey]) columnsP1[colKey] = [];
             columnsP1[colKey].push(p);
        });
        
        let countLimitPxP1 = Infinity;
        
        Object.values(columnsP1).forEach(colCards => {
            colCards.sort((a, b) => a.top - b.top);
            // Max 3 Cards vertically for Landscape (less vertical space)
            if (colCards.length > 3) {
                const card3 = colCards[2]; // index 2 is 3rd card
                const card4 = colCards[3]; // index 3 is 4th card
                const midpoint = (card3.bottom + card4.top) / 2;
                
                if (midpoint > currentSourcePx && midpoint < countLimitPxP1) {
                    countLimitPxP1 = midpoint;
                }
            }
        });
        
        if (countLimitPxP1 < proposedCutPx) {
            proposedCutPx = countLimitPxP1;
        }

        // --- COLLISION DETECTION P1 ---
        const collisionP1 = elementPositions.find(pos => 
            pos.top < proposedCutPx && pos.bottom > proposedCutPx
        );
        
        if (collisionP1) {
             proposedCutPx = Math.max(currentSourcePx, collisionP1.top - 60); // increased safety
        }
        
        const cutHeightMm = (proposedCutPx * ratio) - currentSourcePdfY;

        pdf.addImage(bodyImgData, 'PNG', 0, page1MarginTop - currentSourcePdfY, pdfWidth, bodyTotalPdfHeight);
        
        // Mask Bottom
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, page1MarginTop + cutHeightMm, pdfWidth, pdfHeight - (page1MarginTop + cutHeightMm), 'F');
        
        currentSourcePdfY += cutHeightMm;

        // --- SUBSEQUENT PAGES ---
        while (currentSourcePdfY < bodyTotalPdfHeight - 1) {
             pdf.addPage();
             
             const pageTop = 10;
             const pageAvailableHeight = pdfHeight - pageTop - 10;
             
             const currentSubSourcePx = currentSourcePdfY / ratio;
             const pageAvailableHeightPx = pageAvailableHeight / ratio;
             let nextProposedCutPx = currentSubSourcePx + pageAvailableHeightPx;
             
             // --- LOGIC: MAX 3 CARDS PER COLUMN PER PAGE (SUBSEQUENT) ---
             const visibleElementsSub = elementPositions.filter(p => p.top >= currentSubSourcePx - 5);
             const cardsSub = visibleElementsSub.filter(p => p.isCard);
             const columnsSub: Record<number, typeof elementPositions> = {};
             
             cardsSub.forEach(p => {
                 const colKey = Math.round(p.left / 420) * 420;
                 if (!columnsSub[colKey]) columnsSub[colKey] = [];
                 columnsSub[colKey].push(p);
             });
             
             let countLimitPxSub = Infinity;
             
             Object.values(columnsSub).forEach(colCards => {
                 colCards.sort((a, b) => a.top - b.top);
                 if (colCards.length > 3) {
                     const card3 = colCards[2];
                     const card4 = colCards[3];
                     const midpoint = (card3.bottom + card4.top) / 2;
                     
                     if (midpoint > currentSubSourcePx && midpoint < countLimitPxSub) {
                         countLimitPxSub = midpoint;
                     }
                 }
             });
             
             if (countLimitPxSub < nextProposedCutPx) {
                 nextProposedCutPx = countLimitPxSub;
             }

             // --- COLLISION DETECTION SUB ---
             const nextCollision = elementPositions.find(pos => 
                pos.top < nextProposedCutPx && pos.bottom > nextProposedCutPx
             );
             
             if (nextCollision) {
                  nextProposedCutPx = Math.max(currentSubSourcePx, nextCollision.top - 60);
             }
             
             const nextCutHeightMm = (nextProposedCutPx * ratio) - currentSourcePdfY;
             
             pdf.addImage(bodyImgData, 'PNG', 0, pageTop - currentSourcePdfY, pdfWidth, bodyTotalPdfHeight);
             
             // Mask Bottom
             if (pageTop + nextCutHeightMm < pdfHeight) {
                  pdf.setFillColor(255, 255, 255);
                  pdf.rect(0, pageTop + nextCutHeightMm, pdfWidth, pdfHeight - (pageTop + nextCutHeightMm), 'F');
             }
             
             // Mask Top
             pdf.setFillColor(255, 255, 255);
             pdf.rect(0, 0, pdfWidth, pageTop, 'F');
             
             currentSourcePdfY += nextCutHeightMm;
             
             if (nextCutHeightMm <= 0.1) break;
        }

        // OPEN PDF IN NEW TAB (VISUALIZAR)
        window.open(pdf.output('bloburl'), '_blank');

      } catch (e) {
        console.error('Erro ao gerar o PDF:', e);
        alert('Ocorreu um erro ao gerar o PDF. Tente novamente.');
      } finally {
        document.body.removeChild(tempContainer);
        setIsGeneratingPdf(false);
      }
    }, 2000); // 2000ms Delay
  };

  if (!events || events.length === 0) {
    return (
      <div className="text-center p-8 bg-slate-800 rounded-lg shadow-lg border border-slate-700">
        <NotFoundIcon className="w-16 h-16 mx-auto text-gray-500 mb-4" />
        <p className="text-xl font-semibold text-gray-200">Nenhum evento encontrado.</p>
        <p className="text-md mt-1 text-gray-400">
           Não há eventos correspondentes aos filtros selecionados.
        </p>
      </div>
    );
  }
  
  return (
    <div>
      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 mb-8">
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
            
            {/* Filtros Container */}
            <div className="w-full xl:flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Input de Busca */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 p-2.5 bg-slate-700 border border-slate-600 rounded-lg text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-afya-pink focus:border-afya-pink"
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Filtro de Escopo (Período) */}
                 <div>
                    <select
                        id="event-scope-filter"
                        value={selectedScope}
                        onChange={(e) => setSelectedScope(e.target.value as any)}
                        className="w-full p-2.5 bg-slate-700 text-gray-200 border border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-afya-pink focus:border-afya-pink transition duration-150 ease-in-out appearance-none"
                    >
                        <option value="all">Mostrar Todos</option>
                        <option value="specific">Apenas {periodo}</option>
                        <option value="general">Apenas Eventos Gerais</option>
                    </select>
                </div>

                {/* Filtro de Tipo */}
                <div>
                    <select
                        id="event-type-filter"
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="w-full p-2.5 bg-slate-700 text-gray-200 border border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-afya-pink focus:border-afya-pink transition duration-150 ease-in-out appearance-none"
                    >
                        {eventTypes.map(type => (
                            <option key={type} value={type}>{type === 'Todos' ? 'Todos os tipos' : type}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Botão PDF */}
            <div className="w-full xl:w-auto flex-shrink-0 mt-2 xl:mt-0">
               <button
                onClick={handleViewPdf}
                disabled={isGeneratingPdf}
                className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-gray-300 font-semibold py-2.5 px-4 rounded-lg transition-colors duration-200 border border-slate-600 disabled:opacity-50 disabled:cursor-wait shadow-sm"
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
          </div>
      </div>
      
      <div id="events-pdf-content">
        {(!filteredEvents || filteredEvents.length === 0) ? (
          <div className="text-center text-gray-400 p-12 bg-slate-800/50 rounded-lg border border-slate-700/50 border-dashed">
              <SearchIcon className="w-12 h-12 mx-auto text-gray-600 mb-3" />
              <p className="text-lg text-gray-200 font-semibold">Nenhum evento encontrado.</p>
              <p className="text-sm mt-1">Tente ajustar os termos da busca ou os filtros.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {sortedMonthKeys.map((monthKey, index) => {
              const eventsInMonth = groupedByMonth[monthKey];
              const [year, month] = monthKey.split('-').map(Number);
              const monthDate = new Date(year, month - 1, 1);
              
              const monthName = new Intl.DateTimeFormat('pt-BR', {
                  month: 'long',
                  year: 'numeric',
                  timeZone: 'America/Sao_Paulo'
              }).format(monthDate);

              return (
                <div key={monthKey} className="animate-fade-in event-month-group-pdf" style={{ animationDelay: `${index * 150}ms` }}>
                    <h3 className="text-2xl font-bold text-afya-pink mb-4 capitalize pl-2 border-l-4 border-afya-pink">
                      {monthName}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {eventsInMonth.map((event, eventIndex) => (
                            <div key={`${event.disciplina}-${event.data}-${eventIndex}`} className="transition-transform duration-300 hover:scale-[1.02]">
                                <EventCard event={event} />
                            </div>
                        ))}
                    </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventDisplay;
