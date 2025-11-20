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
import { afyaLogoDataUrl } from './icons/AfyaLogo';
import { generatePdfViaBackend } from './pdfUtils';

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
      className="bg-slate-800 p-4 rounded-lg border-l-4 border border-slate-700 shadow-md flex flex-col h-full event-card-pdf relative overflow-hidden break-inside-avoid"
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

    if (selectedScope === 'specific') {
        result = result.filter(event => normalizePeriodo(event.periodo) !== 'geral');
    } else if (selectedScope === 'general') {
        result = result.filter(event => normalizePeriodo(event.periodo) === 'geral');
    }

    if (selectedType !== 'Todos') {
      result = result.filter(event => event.tipo === selectedType);
    }

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
    setIsGeneratingPdf(true);
  
    try {
        const tempContainer = document.createElement('div');
        tempContainer.className = 'pdf-export-container'; 
        tempContainer.id = 'events-export-temp';
        
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

            <h2 class="pdf-title">Calendário de Eventos - ${periodo}</h2>
            
            <div class="pdf-export-event-grid">
                ${document.getElementById('events-grid-source')?.innerHTML || ''}
            </div>
        `;
        
        document.body.appendChild(tempContainer);

        await generatePdfViaBackend('events-export-temp', `Eventos_${periodo}.pdf`, 'landscape');
        
        document.body.removeChild(tempContainer);
    } catch (e) {
         console.error("Erro ao gerar PDF:", e);
         alert("Não foi possível gerar o PDF. Verifique se o backend está ativo.");
    } finally {
        setIsGeneratingPdf(false);
    }
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
            
            <div className="w-full xl:flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    <ExternalLinkIcon className="w-4 h-4" /> Baixar PDF (Alta Qualidade)
                  </>
                )}
              </button>
            </div>
          </div>
      </div>
      
      <div id="events-grid-source">
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
                <div key={monthKey} className="animate-fade-in event-month-group-pdf break-inside-avoid" style={{ animationDelay: `${index * 150}ms` }}>
                    <h3 className="text-2xl font-bold text-afya-pink mb-4 capitalize pl-2 border-l-4 border-afya-pink">
                      {monthName}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {eventsInMonth.map((event, eventIndex) => (
                            <div key={`${event.disciplina}-${event.data}-${eventIndex}`} className="transition-transform duration-300 hover:scale-[1.02] event-card-pdf break-inside-avoid">
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