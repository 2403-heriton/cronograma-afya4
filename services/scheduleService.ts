
import type { Schedule, DiaDeAula, ModuleSelection, Aula, Event, AulaEntry, EletivaEntry, AulaGroupDetail } from "../types";
import { defaultAulas, defaultEvents, defaultEletivas } from "./initialData";

// Permite o uso da biblioteca XLSX carregada via tag de script
declare var XLSX: any;

const AULAS_KEY = 'afya-schedule-aulas';
const EVENTS_KEY = 'afya-schedule-events';
const ELETIVAS_KEY = 'afya-schedule-eletivas';

// Helper to interpret dates in DD/MM/AAAA format safely
export const parseBrDate = (dateString: string): Date => {
  // Return a very early date if the string is invalid, so it doesn't crash and sorts predictably.
  if (!dateString || typeof dateString !== 'string') {
    return new Date(0);
  }
  const parts = dateString.split('/');
  if (parts.length !== 3) {
    return new Date(0);
  }
  const [day, month, year] = parts.map(Number);
  // Basic validation
  if (isNaN(day) || isNaN(month) || isNaN(year) || year < 1970 || month < 1 || month > 12 || day < 1 || day > 31) {
    return new Date(0);
  }
  // The month is 0-indexed in the JS Date constructor
  const date = new Date(year, month - 1, day);
  // Check for invalid date creations (e.g., new Date('2024', 1, 30) for Feb 30)
  if (isNaN(date.getTime())) {
    return new Date(0);
  }
  return date;
};

// Helper to format Excel time values (serial numbers, Date objects, or strings) into HH:mm format.
const formatExcelTime = (value: any): string => {
    if (value instanceof Date) {
        // Usa getHours() e getMinutes() para evitar problemas de fuso horário,
        // garantindo que a hora seja lida como está na planilha.
        const hours = String(value.getHours()).padStart(2, '0');
        const minutes = String(value.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }
    if (typeof value === 'number') {
        // Fallback for when the value is a number but not parsed as a date.
        return XLSX.SSF.format('hh:mm', value);
    }
    // Fallback for values that are already strings or other types.
    return String(value ?? '').trim();
};

// Helper to format Excel date values (serial numbers, Date objects, or strings) into DD/MM/YYYY format.
const formatExcelDate = (value: any): string => {
    if (!value) return ''; // Retorna string vazia para valores nulos ou indefinidos
    if (value instanceof Date) {
        const day = String(value.getUTCDate()).padStart(2, '0');
        const month = String(value.getUTCMonth() + 1).padStart(2, '0'); // getUTCMonth is 0-indexed
        const year = value.getUTCFullYear();
        return `${day}/${month}/${year}`;
    }
    if (typeof value === 'number') {
        // Fallback for when the value is a number but not parsed as a date.
        return XLSX.SSF.format('dd/mm/yyyy', value);
    }
    // Fallback for values that are already strings or other types.
    return String(value ?? '').trim();
};


// Normaliza o dia da semana para um formato padrão, tornando o sistema robusto a variações de entrada.
const normalizeDayOfWeek = (day: string): string => {
    if (!day) return '';
    const d = day.toLowerCase().replace(/[- ]/g, '').trim(); // Ex: "terça-feira" -> "terçafeira"
    if (d.startsWith('segunda')) return 'Segunda-feira';
    if (d.startsWith('terca') || d.startsWith('terça')) return 'Terça-feira';
    if (d.startsWith('quarta')) return 'Quarta-feira';
    if (d.startsWith('quinta')) return 'Quinta-feira';
    if (d.startsWith('sexta')) return 'Sexta-feira';
    if (d.startsWith('sabado') || d.startsWith('sábado')) return 'Sábado';
    if (d.startsWith('domingo')) return 'Domingo';
    return day; // Retorna o original se não houver correspondência
};

// Normaliza a string do período para apenas o número, tornando a correspondência robusta.
const normalizePeriodo = (periodo: string): string => {
    if (!periodo) return '';
    const match = String(periodo).match(/\d+/);
    if (match) {
        return match[0];
    }
    // Retorna a string em minúsculas se for algo como "Geral"
    return String(periodo).trim().toLowerCase();
}


export const initializeAndLoadData = async (): Promise<{ aulas: AulaEntry[], events: Event[], eletivas: EletivaEntry[] }> => {
    let finalAulas: any[];
    let finalEvents: any[];
    let finalEletivas: any[];

    // --- Lógica de Carregamento em Cascata ---

    // 1. Tenta buscar da rede
    let networkAulas: any[] | null = null;
    let networkEvents: any[] | null = null;
    let networkEletivas: any[] | null = null;

    try {
        const cacheBuster = `?t=${Date.now()}`;
        const [aulasRes, eventosRes, avaliacoesRes, eletivasRes] = await Promise.all([
            fetch(`/aulas.json${cacheBuster}`),
            fetch(`/eventos.json${cacheBuster}`),
            fetch(`/avaliacoes.json${cacheBuster}`),
            fetch(`/eletivas.json${cacheBuster}`),
        ]);

        // Processa Aulas: só considera válido se a requisição for bem-sucedida E o array não for vazio.
        if (aulasRes.ok) {
            const data = await aulasRes.json();
            if (Array.isArray(data) && data.length > 0) {
                networkAulas = data;
            }
        }
        
        // Processa Eventos e Avaliações
        const combinedEvents: any[] = [];
        if (eventosRes.ok) {
            const data = await eventosRes.json();
            if (Array.isArray(data)) combinedEvents.push(...data);
        }
        if (avaliacoesRes.ok) {
            const data = await avaliacoesRes.json();
            if (Array.isArray(data)) combinedEvents.push(...data);
        }
        // Apenas considera os dados da rede válidos se eles não estiverem vazios.
        if (combinedEvents.length > 0) {
            networkEvents = combinedEvents;
        }

        // Processa Eletivas
        if (eletivasRes.ok) {
            const data = await eletivasRes.json();
            // Apenas considera os dados da rede válidos se eles não estiverem vazios.
            if (Array.isArray(data) && data.length > 0) {
                 networkEletivas = data;
            }
        }

    } catch (error) {
        console.warn("Falha na busca de dados da rede. Tentando fallback para o cache local.", error);
    }

    // 2. Decide a fonte de dados final para AULAS (fonte principal)
    if (networkAulas) {
        finalAulas = networkAulas;
        localStorage.setItem(AULAS_KEY, JSON.stringify(finalAulas));
    } else {
        try {
            const localData = localStorage.getItem(AULAS_KEY);
            const parsed = localData ? JSON.parse(localData) : null;
            if (Array.isArray(parsed) && parsed.length > 0) {
                finalAulas = parsed;
            } else {
                finalAulas = defaultAulas;
            }
        } catch (e) {
            localStorage.removeItem(AULAS_KEY); // Limpa cache corrompido
            finalAulas = defaultAulas;
        }
    }

    // 3. Decide a fonte final para EVENTOS
    if (networkEvents) {
        finalEvents = networkEvents;
        localStorage.setItem(EVENTS_KEY, JSON.stringify(finalEvents));
    } else {
        try {
            const localData = localStorage.getItem(EVENTS_KEY);
            const parsed = localData ? JSON.parse(localData) : null;
            if (Array.isArray(parsed) && parsed.length > 0) {
                finalEvents = parsed;
            } else {
                finalEvents = defaultEvents;
            }
        } catch (e) {
            localStorage.removeItem(EVENTS_KEY);
            finalEvents = defaultEvents;
        }
    }
    
    // 4. Decide a fonte final para ELETIVAS
     if (networkEletivas) {
        finalEletivas = networkEletivas;
        localStorage.setItem(ELETIVAS_KEY, JSON.stringify(finalEletivas));
    } else {
        try {
            const localData = localStorage.getItem(ELETIVAS_KEY);
            const parsed = localData ? JSON.parse(localData) : null;
            if (Array.isArray(parsed) && parsed.length > 0) {
                finalEletivas = parsed;
            } else {
                finalEletivas = defaultEletivas;
            }
        } catch (e) {
            localStorage.removeItem(ELETIVAS_KEY);
            finalEletivas = defaultEletivas;
        }
    }

    // --- Higienização dos Dados ---
    const aulas: AulaEntry[] = finalAulas.map((row: any) => {
        const obsKey = Object.keys(row).find(k => {
            const lowerK = k.toLowerCase().trim();
            return lowerK === 'observação' || lowerK === 'observacao' || lowerK === 'observações';
        });
        const observacaoValue = obsKey ? row[obsKey] : '';

        return {
            periodo: String(row.periodo ?? '').trim(),
            modulo: String(row.modulo ?? '').trim(),
            grupo: String(row.grupo ?? '').trim(),
            dia_semana: normalizeDayOfWeek(String(row.dia_semana ?? '').trim()),
            disciplina: String(row.disciplina ?? '').trim(),
            sala: String(row.sala ?? '').trim(),
            horario_inicio: String(row.horario_inicio ?? '').trim(),
            horario_fim: String(row.horario_fim ?? '').trim(),
            tipo: String(row.tipo ?? '').trim(),
            professor: String(row.professor ?? '').trim(),
            observacao: String(observacaoValue ?? '').trim(),
        };
    });
    
    const events: Event[] = finalEvents.map((row: any): Event => ({
        periodo: String(row.periodo ?? '').trim(),
        data: String(row.data ?? '').trim(),
        data_fim: String(row.data_fim ?? '').trim(),
        horario: String(row.horario ?? '').trim(),
        disciplina: String(row.disciplina ?? '').trim(),
        tipo: String(row.tipo ?? '').trim(),
        local: String(row.local ?? '').trim(),
        modulo: String(row.modulo ?? '').trim(),
        grupo: String(row.grupo ?? '').trim(),
    }));

    const eletivas: EletivaEntry[] = finalEletivas.map((row: any): EletivaEntry => ({
        disciplina: String(row.modulo ?? row.disciplina ?? '').trim(),
        dia_semana: normalizeDayOfWeek(String(row.dia_semana ?? '').trim()),
        horario_inicio: String(row.horario_inicio ?? '').trim(),
        horario_fim: String(row.horario_fim ?? '').trim(),
        professor: String(row.professor ?? '').trim(),
        sala: String(row.sala ?? '').trim(),
        tipo: String(row.tipo ?? '').trim(),
    }));

    return { aulas, events, eletivas };
}


const groupAulasIntoSchedule = (aulas: AulaEntry[]): Schedule => {
    const weekOrder = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira'];
    
    // Limites do dia letivo (08:00 - 22:00)
    const DAY_START_MIN = 8 * 60;
    const DAY_END_MIN = 22 * 60;

    const parseMinutes = (timeStr: string): number => {
        if (!timeStr || !timeStr.includes(':')) return 0;
        const [hours, minutes] = timeStr.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) return 0;
        return hours * 60 + minutes;
    };

    const finalSchedule: Schedule = weekOrder.map(dayName => {
        const dayEntries = aulas.filter(a => a.dia_semana === dayName);
        
        // Agrupamento por Disciplina
        const disciplineGroups: { [key: string]: AulaEntry[] } = {};
        dayEntries.forEach(entry => {
            const key = entry.disciplina; 
            if (!disciplineGroups[key]) {
                disciplineGroups[key] = [];
            }
            disciplineGroups[key].push(entry);
        });

        let dayAulas: Aula[] = Object.keys(disciplineGroups).map(disciplineKey => {
            const groupEntries = disciplineGroups[disciplineKey];
            
            // Mapeia cada entrada para uma sub-sessão (mini-card)
            const subSessions: AulaGroupDetail[] = groupEntries.map(entry => {
                 const startMin = parseMinutes(entry.horario_inicio);
                 const endMin = parseMinutes(entry.horario_fim);
                 return {
                    grupo: entry.grupo,
                    sala: entry.sala,
                    horario: `${entry.horario_inicio} às ${entry.horario_fim}`,
                    professor: entry.professor || 'A definir',
                    tipo: entry.tipo,
                    observacao: entry.observacao,
                    startMinutes: startMin,
                    endMinutes: endMin
                };
            });

            // Ordena as sub-sessões cronologicamente
            subSessions.sort((a, b) => a.startMinutes - b.startMinutes);

            // Determina horários gerais para ordenação do card principal
            const earliestStart = subSessions.length > 0 ? subSessions[0].horario.split(' às ')[0] : '';
            const latestEnd = subSessions.length > 0 ? subSessions[subSessions.length - 1].horario.split(' às ')[1] : '';
            
            // Usa o módulo da primeira entrada
            const modulo = groupEntries[0].modulo;

            return {
                disciplina: disciplineKey,
                modulo: modulo,
                horario: `${earliestStart} - ${latestEnd}`, // Apenas para referência ou ordenação
                subSessions: subSessions,
                observacao: '' // Mantemos vazio para usar as observações individuais das sub-sessões
            };
        });

        // Ordena os cards do dia pelo horário de início da primeira sub-sessão
        dayAulas.sort((a, b) => {
            const startA = a.subSessions[0]?.startMinutes || 0;
            const startB = b.subSessions[0]?.startMinutes || 0;
            return startA - startB;
        });

        // --- Lógica para identificar Intervalos (Horários Livres) ---
        // Calcula a união de TODOS os horários ocupados neste dia (olhando para todas as sub-sessões)
        const allIntervals: {start: number, end: number}[] = [];
        dayAulas.forEach(aula => {
            aula.subSessions.forEach(s => {
                allIntervals.push({ start: s.startMinutes, end: s.endMinutes });
            });
        });

        // Mescla intervalos sobrepostos para encontrar os blocos globais ocupados
        const occupiedBlocks: {start: number, end: number}[] = [];
        if (allIntervals.length > 0) {
             allIntervals.sort((a, b) => a.start - b.start);
             let current = allIntervals[0];
             for(let i = 1; i < allIntervals.length; i++) {
                 if (allIntervals[i].start < current.end) { // Sobreposição ou adjacência
                     current.end = Math.max(current.end, allIntervals[i].end);
                 } else {
                     occupiedBlocks.push(current);
                     current = allIntervals[i];
                 }
             }
             occupiedBlocks.push(current);
        }

        const freeSlots: Aula[] = [];
        const minGap = 30; // Considerar horário livre se o gap for maior que 30 minutos

        if (occupiedBlocks.length > 0) {
            // 1. Verificar buraco no início do dia (08:00 até a primeira atividade)
            if ((occupiedBlocks[0].start - DAY_START_MIN) > minGap) {
                 const h1 = Math.floor(DAY_START_MIN / 60).toString().padStart(2, '0');
                 const m1 = (DAY_START_MIN % 60).toString().padStart(2, '0');
                 const h2 = Math.floor(occupiedBlocks[0].start / 60).toString().padStart(2, '0');
                 const m2 = (occupiedBlocks[0].start % 60).toString().padStart(2, '0');
                 
                 freeSlots.push({
                    isFreeSlot: true,
                    disciplina: 'Horário Livre',
                    modulo: '',
                    horario: `${h1}:${m1} - ${h2}:${m2}`,
                    subSessions: [],
                    observacao: ''
                 });
            }

            // 2. Verificar buracos entre blocos ocupados
            for(let i = 0; i < occupiedBlocks.length - 1; i++) {
                const gapStart = occupiedBlocks[i].end;
                const gapEnd = occupiedBlocks[i+1].start;
                
                if ((gapEnd - gapStart) > minGap) {
                    const h1 = Math.floor(gapStart / 60).toString().padStart(2, '0');
                    const m1 = (gapStart % 60).toString().padStart(2, '0');
                    const h2 = Math.floor(gapEnd / 60).toString().padStart(2, '0');
                    const m2 = (gapEnd % 60).toString().padStart(2, '0');

                    freeSlots.push({
                        isFreeSlot: true,
                        disciplina: 'Horário Livre',
                        modulo: '',
                        horario: `${h1}:${m1} - ${h2}:${m2}`,
                        subSessions: [],
                        observacao: ''
                    });
                }
            }

            // 3. Verificar buraco no fim do dia (última atividade até 22:00)
            const lastBlockEnd = occupiedBlocks[occupiedBlocks.length - 1].end;
            if ((DAY_END_MIN - lastBlockEnd) > minGap) {
                 const h1 = Math.floor(lastBlockEnd / 60).toString().padStart(2, '0');
                 const m1 = (lastBlockEnd % 60).toString().padStart(2, '0');
                 const h2 = Math.floor(DAY_END_MIN / 60).toString().padStart(2, '0');
                 const m2 = (DAY_END_MIN % 60).toString().padStart(2, '0');

                 freeSlots.push({
                    isFreeSlot: true,
                    disciplina: 'Horário Livre',
                    modulo: '',
                    horario: `${h1}:${m1} - ${h2}:${m2}`,
                    subSessions: [],
                    observacao: ''
                 });
            }
        } else {
            // Se não houver nenhuma aula no dia, é um dia totalmente livre (tratado no render)
        }

        // Adiciona os slots livres e reordena tudo
        dayAulas = [...dayAulas, ...freeSlots].sort((a, b) => {
             if (a.isFreeSlot || b.isFreeSlot) {
                // Helper simples para extrair inicio em minutos da string de horário "HH:MM - ..."
                const getStartFromStr = (str: string) => {
                    const parts = str.split(' - ')[0].split(':');
                    if (parts.length === 2) return parseInt(parts[0])*60 + parseInt(parts[1]);
                    return 0;
                };
                const startA = a.isFreeSlot ? getStartFromStr(a.horario) : (a.subSessions[0]?.startMinutes || 0);
                const startB = b.isFreeSlot ? getStartFromStr(b.horario) : (b.subSessions[0]?.startMinutes || 0);
                return startA - startB;
             }
             
             // Comparação normal entre aulas
             const startA = a.subSessions[0]?.startMinutes || 0;
             const startB = b.subSessions[0]?.startMinutes || 0;
             return startA - startB;
        });

        return {
            dia: dayName,
            aulas: dayAulas
        };
    });

    return finalSchedule;
};


export const fetchSchedule = (
    periodo: string, 
    selections: Omit<ModuleSelection, 'id'>[], // Mantido para compatibilidade, mas não usado para filtro de aulas principais
    selectedEletivas: string[],
    allAulas: AulaEntry[],
    allEletivas: EletivaEntry[]
): Schedule | null => {
    // 1. Filtra Aulas Principais apenas pelo Período
    const matchingAulas = allAulas.filter(aula => 
        String(aula.periodo) === String(periodo)
    );

    // 2. Adiciona Eletivas Selecionadas (independentemente do período selecionado, pois eletivas são específicas)
    const matchingEletivasAsAulaEntries: AulaEntry[] = allEletivas
        .filter(eletiva => selectedEletivas.includes(eletiva.disciplina))
        .map((eletiva): AulaEntry => ({
            periodo: periodo,
            modulo: 'Eletiva',
            grupo: 'Eletiva', // Grupo genérico para eletivas
            dia_semana: eletiva.dia_semana,
            disciplina: eletiva.disciplina,
            sala: eletiva.sala,
            horario_inicio: eletiva.horario_inicio,
            horario_fim: eletiva.horario_fim,
            tipo: eletiva.tipo,
            professor: eletiva.professor,
            observacao: '',
        }));

    const combinedAulas = [...matchingAulas, ...matchingEletivasAsAulaEntries];

    return groupAulasIntoSchedule(combinedAulas);
};


export const getUniqueModulesForPeriod = (periodo: string, allAulas: AulaEntry[]): string[] => {
    const modulesForPeriod = allAulas
        .filter(entry => String(entry.periodo) === String(periodo))
        .map(entry => entry.modulo);
        
    const uniqueModules = [...new Set(modulesForPeriod)];
    uniqueModules.sort();
    return uniqueModules;
};

export const fetchEvents = (periodo: string, selections: Omit<ModuleSelection, 'id'>[], allEvents: Event[]): Event[] | null => {
    const normalizedSelectedPeriodo = normalizePeriodo(periodo);
    
    const matchingEvents = allEvents.filter(event => {
        const normalizedEventPeriodo = normalizePeriodo(event.periodo);
        
        // Evento é "Geral" se o período dele for 'geral'.
        const isGeneralEvent = normalizedEventPeriodo === 'geral';

        // Evento é específico do período se o período normalizado corresponder.
        const isPeriodMatch = normalizedEventPeriodo === normalizedSelectedPeriodo;

        // Como estamos mostrando TUDO do período, removemos a filtragem por grupo específico.
        // Se for do período, mostra.
        
        return isGeneralEvent || isPeriodMatch;
    });

    if (matchingEvents.length === 0) return null;
    
    const uniqueEvents = matchingEvents.filter((event, index, self) =>
        index === self.findIndex((e) => (
            e.data === event.data && e.disciplina === event.disciplina && e.tipo === event.tipo && e.modulo === event.modulo
        ))
    );

    uniqueEvents.sort((a, b) => parseBrDate(a.data).getTime() - parseBrDate(b.data).getTime());

    return uniqueEvents;
};

export const getUniquePeriods = (allAulas: AulaEntry[]): string[] => {
    const periods = allAulas.map(entry => String(entry.periodo));
    const uniquePeriods = [...new Set(periods)];
    
    uniquePeriods.sort((a, b) => {
        const numA = parseInt(a, 10);
        const numB = parseInt(b, 10);
        if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB;
        }
        return a.localeCompare(b);
    });
    
    return uniquePeriods;
};

export const getUniqueGroupsForModule = (periodo: string, modulo: string, allAulas: AulaEntry[]): string[] => {
    const groups = allAulas
        .filter(entry => String(entry.periodo) === String(periodo) && entry.modulo === modulo)
        .map(entry => entry.grupo);
    
    const uniqueGroups = [...new Set(groups)];
    
    uniqueGroups.sort((a, b) => {
        const extractPart = (s: string) => s.split('-').pop()?.trim() || s;
        
        const partA = extractPart(a);
        const partB = extractPart(b);
        
        const isNumA = !isNaN(Number(partA));
        const isNumB = !isNaN(Number(partB));
        
        // Se ambos são números, ordena do menor para o maior
        if (isNumA && isNumB) {
            return Number(partA) - Number(partB);
        }
        
        // Se ambos são strings (letras), ordena de A a Z
        if (!isNumA && !isNumB) {
            return partA.localeCompare(partB);
        }

        // Se misturado, coloca letras antes de números
        if (isNumA) return 1;
        if (isNumB) return -1;

        // Fallback para o caso de algo inesperado
        return a.localeCompare(b);
    });

    return uniqueGroups;
};

export const getUniqueEletivas = (allEletivas: EletivaEntry[]): string[] => {
    const eletivas = allEletivas.map(e => e.disciplina);
    const uniqueEletivas = [...new Set(eletivas)];
    uniqueEletivas.sort();
    return uniqueEletivas;
};


export const updateDataFromExcel = async (file: File): Promise<{ aulasData: AulaEntry[], eventsData: Event[], eletivasData: EletivaEntry[], eventsSheetName: string | undefined }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                
                const aulasSheet = workbook.Sheets['Aulas'];
                const eletivasSheet = workbook.Sheets['Eletivas'];
                const eventosSheetName = workbook.SheetNames.find(name => {
                    const lowerCaseName = name.toLowerCase().trim();
                    return lowerCaseName === 'eventos' || lowerCaseName === 'avaliações';
                });
                const eventosSheet = eventosSheetName ? workbook.Sheets[eventosSheetName] : undefined;

                if (!aulasSheet) {
                  return reject(new Error("Aba 'Aulas' não encontrada na planilha."));
                }
                
                // Processa as linhas com chaves case-insensitive
                const processRows = (sheet: any) => {
                    if (!sheet) return [];
                    const rawData = XLSX.utils.sheet_to_json(sheet);
                    return rawData.map((row: any) => {
                        const lowerCaseRow: { [key: string]: any } = {};
                        for (const key in row) {
                            lowerCaseRow[key.toLowerCase().trim()] = row[key];
                        }
                        return lowerCaseRow;
                    });
                };
                
                const processedAulasData = processRows(aulasSheet);
                
                const aulasData: AulaEntry[] = processedAulasData.map((row: any): AulaEntry => {
                    const observacaoValue = row['observação'] || row['observacao'] || row['observações'] || '';

                    return {
                        periodo: String(row['periodo'] ?? '').trim(),
                        modulo: String(row['modulo'] ?? '').trim(),
                        grupo: String(row['grupo'] ?? '').trim(),
                        dia_semana: normalizeDayOfWeek(String(row['dia_semana'] ?? '').trim()),
                        disciplina: String(row['disciplina'] ?? '').trim(),
                        sala: String(row['sala'] ?? '').trim(),
                        horario_inicio: formatExcelTime(row['horario_inicio']),
                        horario_fim: formatExcelTime(row['horario_fim']),
                        tipo: String(row['tipo'] ?? row['tipo de aula'] ?? '').trim(),
                        professor: String(row['professor'] ?? row['docente'] ?? '').trim(),
                        observacao: String(observacaoValue ?? '').trim(),
                    };
                });
                
                let eventsData: Event[] = [];
                if (eventosSheet) {
                    const processedEventsData = processRows(eventosSheet);
                    eventsData = processedEventsData.map((row: any): Event => ({
                        periodo: String(row['periodo'] ?? '').trim(),
                        data: formatExcelDate(row['data'] ?? row['data inicio']),
                        data_fim: formatExcelDate(row['data fim']),
                        horario: formatExcelTime(row['horario']),
                        disciplina: String(row['disciplina'] ?? '').trim(),
                        tipo: String(row['tipo'] ?? '').trim(),
                        local: String(row['local'] ?? '').trim(),
                        modulo: String(row['modulo'] ?? '').trim(),
                        grupo: String(row['grupo'] ?? '').trim(),
                    }));
                }
                
                let eletivasData: EletivaEntry[] = [];
                if (eletivasSheet) {
                    const processedEletivasData = processRows(eletivasSheet);
                    eletivasData = processedEletivasData.map((row: any): EletivaEntry => ({
                        disciplina: String(row['modulo'] ?? row['disciplina'] ?? '').trim(),
                        dia_semana: normalizeDayOfWeek(String(row['dia_semana'] ?? '').trim()),
                        sala: String(row['sala'] ?? '').trim(),
                        horario_inicio: formatExcelTime(row['horario_inicio']),
                        horario_fim: formatExcelTime(row['horario_fim']),
                        tipo: String(row['tipo'] ?? '').trim(),
                        professor: String(row['professor'] ?? row['docente'] ?? '').trim(),
                    }));
                }

                // Validação de cabeçalhos
                if (aulasData.length > 0 && (!aulasData[0].dia_semana || !aulasData[0].horario_inicio)) {
                    return reject(new Error("Formato incorreto na aba 'Aulas'. Verifique os cabeçalhos das colunas."));
                }
                if (eventosSheet && eventsData.length > 0 && (!eventsData[0].data || !eventsData[0].tipo)) {
                   return reject(new Error(`Formato incorreto na aba '${eventosSheetName}'. Verifique os cabeçalhos.`));
                }
                 if (eletivasSheet && eletivasData.length > 0 && (!eletivasData[0].disciplina || !eletivasData[0].dia_semana)) {
                   return reject(new Error("Formato incorreto na aba 'Eletivas'. Verifique os cabeçalhos."));
                }


                localStorage.setItem(AULAS_KEY, JSON.stringify(aulasData));
                if (eventsData.length > 0) {
                    localStorage.setItem(EVENTS_KEY, JSON.stringify(eventsData));
                }
                if (eletivasData.length > 0) {
                    localStorage.setItem(ELETIVAS_KEY, JSON.stringify(eletivasData));
                }

                resolve({ aulasData, eventsData, eletivasData, eventsSheetName: eventosSheetName });
            } catch (error) {
                console.error("Erro ao processar planilha:", error);
                reject(new Error('Falha ao ler o arquivo. Verifique se ele não está corrompido.'));
            }
        };
        reader.onerror = (error) => reject(new Error('Não foi possível ler o arquivo.'));
        reader.readAsArrayBuffer(file);
    });
};
