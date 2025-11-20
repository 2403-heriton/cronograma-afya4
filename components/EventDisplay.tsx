
import React, { useState, useMemo } from 'react';
import type { Event } from '../types';
import { stringToColor } from '../services/colorService';
import { parseBrDate } from '../services/scheduleService';
import NotFoundIcon from './icons/NotFoundIcon';
import CalendarIcon from './icons/CalendarIcon';
import ClockIcon from './icons/ClockIcon';
import LocationIcon from './icons/LocationIcon';
import ClipboardListIcon from './icons/ClipboardListIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import ExternalLinkIcon from './icons/ExternalLinkIcon';
import SearchIcon from './icons/SearchIcon';

// FIX: Removed redeclared global types for jspdf and html2canvas. These are now defined in types.ts.

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

  return (
    <div 
      className="bg-slate-800 p-4 rounded-lg border-l-4 border border-slate-700 shadow-md flex flex-col h-full event-card-pdf"
      style={{ 
        borderLeftColor: color,
        '--event-color': color
      } as React.CSSProperties}
    >
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

    // 1. Filtro por Tipo
    if (selectedType !== 'Todos') {
      result = result.filter(event => event.tipo === selectedType);
    }

    // 2. Filtro por Texto (Busca)
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
  }, [events, selectedType, searchTerm]);
  
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
    tempContainer.className = 'pdf-export-container'; // Will apply 1280px width from index.html
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
        const bodyImgProps = new jsPDF().getImageProperties(bodyImgData);

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
        // We don't want to cut an event card or a Month Title in half.
        const elementsToAvoidCutting = Array.from(bodyWrapper.querySelectorAll('.event-card-pdf, .event-month-group-pdf h3'));
        const elementPositions = elementsToAvoidCutting.map(el => {
            const rect = el.getBoundingClientRect();
            const wrapperRect = bodyWrapper.getBoundingClientRect();
            return {
                top: rect.top - wrapperRect.top,
                bottom: rect.bottom - wrapperRect.top,
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
        
        // Collision Detection P1
        const collisionP1 = elementPositions.find(pos => 
            pos.top < proposedCutPx && pos.bottom > proposedCutPx
        );
        
        if (collisionP1) {
             // Move cut up to the top of the element, ensuring we don't cut it
             // Add small buffer (-15px)
             proposedCutPx = Math.max(currentSourcePx, collisionP1.top - 15);
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
             
             // Collision Detection Sub
             const nextCollision = elementPositions.find(pos => 
                pos.top < nextProposedCutPx && pos.bottom > nextProposedCutPx
             );
             
             if (nextCollision) {
                  nextProposedCutPx = Math.max(currentSubSourcePx, nextCollision.top - 15);
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
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
            
            {/* Filtros */}
            <div className="w-full lg:flex-1 flex flex-col sm:flex-row gap-4">
                {/* Input de Busca */}
                <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 p-2.5 bg-slate-700 border border-slate-600 rounded-lg text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-afya-pink focus:border-afya-pink"
                        placeholder="Buscar eventos (disciplina, local, grupo...)"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Dropdown de Tipo */}
                <div className="sm:w-64">
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
            <div className="w-full lg:w-auto flex-shrink-0">
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
