
import type { Schedule, ModuleSelection, Aula, Event, AulaEntry, EletivaEntry, AulaGroupDetail } from "../types";
import { defaultAulas, defaultEvents, defaultEletivas } from "./initialData";

// Permite o uso da biblioteca XLSX carregada via tag de script
declare var XLSX: any;

const AULAS_KEY = 'afya-schedule-aulas';
const EVENTS_KEY = 'afya-schedule-events';
const ELETIVAS_KEY = 'afya-schedule-eletivas';

// Helper to interpret dates in DD/MM/AAAA format safely
export const parseBrDate = (dateString: string): Date => {
  if (!dateString || typeof dateString !== 'string') {
    return new Date(0);
  }
  const parts = dateString.split('/');
  if (parts.length !== 3) {
    return new Date(0);
  }
  const [day, month, year] = parts.map(Number);
  if (isNaN(day) || isNaN(month) || isNaN(year) || year < 1970 || month < 1 || month > 12 || day < 1 || day > 31) {
    return new Date(0);
  }
  const date = new Date(year, month - 1, day);
  if (isNaN(date.getTime())) {
    return new Date(0);
  }
  return date;
};

const formatExcelTime = (value: any): string => {
    if (value instanceof Date) {
        const hours = String(value.getHours()).padStart(2, '0');
        const minutes = String(value.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }
    if (typeof value === 'number') {
        return XLSX.SSF.format('hh:mm', value);
    }
    return String(value ?? '').trim();
};

const formatExcelDate = (value: any): string => {
    if (!value) return '';
    if (value instanceof Date) {
        const day = String(value.getUTCDate()).padStart(2, '0');
        const month = String(value.getUTCMonth() + 1).padStart(2, '0');
        const year = value.getUTCFullYear();
        return `${day}/${month}/${year}`;
    }
    if (typeof value === 'number') {
        return XLSX.SSF.format('dd/mm/yyyy', value);
    }
    return String(value ?? '').trim();
};

const normalizeDayOfWeek = (day: string): string => {
    if (!day) return '';
    const d = day.toLowerCase().replace(/[- ]/g, '').trim();
    if (d.startsWith('segunda')) return 'Segunda-feira';
    if (d.startsWith('terca') || d.startsWith('terça')) return 'Terça-feira';
    if (d.startsWith('quarta')) return 'Quarta-feira';
    if (d.startsWith('quinta')) return 'Quinta-feira';
    if (d.startsWith('sexta')) return 'Sexta-feira';
    if (d.startsWith('sabado') || d.startsWith('sábado')) return 'Sábado';
    if (d.startsWith('domingo')) return 'Domingo';
    return day;
};

const normalizePeriodo = (periodo: string): string => {
    if (!periodo) return '';
    const match = String(periodo).match(/\d+/);
    if (match) {
        return match[0];
    }
    return String(periodo).trim().toLowerCase();
}

export const initializeAndLoadData = async (): Promise<{ aulas: AulaEntry[], events: Event[], eletivas: EletivaEntry[] }> => {
    let finalAulas: any[];
    let finalEvents: any[];
    let finalEletivas: any[];

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

        if (aulasRes.ok) {
            const data = await aulasRes.json();
            if (Array.isArray(data) && data.length > 0) {
                networkAulas = data;
            }
        }
        
        const combinedEvents: any[] = [];
        if (eventosRes.ok) {
            const data = await eventosRes.json();
            if (Array.isArray(data)) combinedEvents.push(...data);
        }
        if (avaliacoesRes.ok) {
            const data = await avaliacoesRes.json();
            if (Array.isArray(data)) combinedEvents.push(...data);
        }
        if (combinedEvents.length > 0) {
            networkEvents = combinedEvents;
        }

        if (eletivasRes.ok) {
            const data = await eletivasRes.json();
            if (Array.isArray(data) && data.length > 0) {
                 networkEletivas = data;
            }
        }

    } catch (error) {
        console.warn("Falha na busca de dados da rede. Tentando fallback para o cache local.", error);
    }

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
            localStorage.removeItem(AULAS_KEY);
            finalAulas = defaultAulas;
        }
    }

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

const isNumericGroup = (groupName: string): boolean => {
    return /\d/.test(groupName);
};

const getCleanGroupName = (g: string) => g.replace(/^(GRUPO|Grupo)\s*-\s*|^(GRUPO|Grupo)\s+|^(TURMA|Turma)\s+/i, '').trim();

const groupAulasIntoSchedule = (aulas: AulaEntry[]): Schedule => {
    const weekOrder = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira'];
    
    const DAY_START_MIN = 8 * 60;
    const DAY_END_MIN = 22 * 60;

    const parseMinutes = (timeStr: string): number => {
        if (!timeStr || !timeStr.includes(':')) return 0;
        const [hours, minutes] = timeStr.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) return 0;
        return hours * 60 + minutes;
    };

    const calculateGaps = (intervals: {start: number, end: number}[], dayStart: number, dayEnd: number): {start: number, end: number}[] => {
        const minGap = 30;
        if (intervals.length === 0) return [{start: dayStart, end: dayEnd}];
        
        intervals.sort((a, b) => a.start - b.start);
        const mergedOccupied: {start: number, end: number}[] = [];
        let current = intervals[0];
        for(let i=1; i < intervals.length; i++) {
            if (intervals[i].start < current.end) {
                current.end = Math.max(current.end, intervals[i].end);
            } else {
                mergedOccupied.push(current);
                current = intervals[i];
            }
        }
        mergedOccupied.push(current);

        const gaps: {start: number, end: number}[] = [];

        if (mergedOccupied[0].start - dayStart > minGap) {
            gaps.push({start: dayStart, end: mergedOccupied[0].start});
        }

        for(let i=0; i < mergedOccupied.length - 1; i++) {
            const gapStart = mergedOccupied[i].end;
            const gapEnd = mergedOccupied[i+1].start;
            if (gapEnd - gapStart > minGap) {
                gaps.push({start: gapStart, end: gapEnd});
            }
        }

        if (dayEnd - mergedOccupied[mergedOccupied.length -1].end > minGap) {
            gaps.push({start: mergedOccupied[mergedOccupied.length -1].end, end: dayEnd});
        }
        
        return gaps;
    };

    const formatTime = (totalMinutes: number): string => {
        const h = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
        const m = (totalMinutes % 60).toString().padStart(2, '0');
        return `${h}:${m}`;
    };

    const finalSchedule: Schedule = weekOrder.map(dayName => {
        const dayEntries = aulas.filter(a => a.dia_semana === dayName);
        
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
            
            const initialSubSessions: AulaGroupDetail[] = groupEntries.map(entry => {
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

            // === GROUP MERGING LOGIC ===
            initialSubSessions.sort((a, b) => a.startMinutes - b.startMinutes);
            
            const mergedSubSessions: AulaGroupDetail[] = [];
            const mergeMap = new Map<string, number>();

            initialSubSessions.forEach(session => {
                const key = `${session.startMinutes}-${session.endMinutes}-${session.sala.trim().toLowerCase()}`;
                const cleanGroup = getCleanGroupName(session.grupo);
                
                if (mergeMap.has(key)) {
                    const idx = mergeMap.get(key)!;
                    const existing = mergedSubSessions[idx];
                    
                    const currentGroups = existing.grupo.split(', ');
                    if (!currentGroups.includes(cleanGroup)) {
                        currentGroups.push(cleanGroup);
                        currentGroups.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
                        existing.grupo = currentGroups.join(', ');
                    }
                    if (session.professor && session.professor !== 'A definir' && !existing.professor.includes(session.professor)) {
                        existing.professor += ` / ${session.professor}`;
                    }
                } else {
                    const newSession = { ...session, grupo: cleanGroup };
                    const idx = mergedSubSessions.push(newSession) - 1;
                    mergeMap.set(key, idx);
                }
            });
            
            mergedSubSessions.sort((a, b) => a.startMinutes - b.startMinutes);

            const earliestStart = mergedSubSessions.length > 0 ? mergedSubSessions[0].horario.split(' às ')[0] : '';
            const latestEnd = mergedSubSessions.length > 0 ? mergedSubSessions[mergedSubSessions.length - 1].horario.split(' às ')[1] : '';
            const modulo = groupEntries[0].modulo;

            return {
                disciplina: disciplineKey,
                modulo: modulo,
                horario: `${earliestStart} - ${latestEnd}`,
                subSessions: mergedSubSessions,
                observacao: ''
            };
        });

        dayAulas.sort((a, b) => {
            const startA = a.subSessions[0]?.startMinutes || 0;
            const startB = b.subSessions[0]?.startMinutes || 0;
            return startA - startB;
        });

        const numericEntries = dayEntries.filter(e => isNumericGroup(e.grupo));
        const alphaEntries = dayEntries.filter(e => !isNumericGroup(e.grupo));
        
        const hasNumeric = numericEntries.length > 0;
        const hasAlpha = alphaEntries.length > 0;
        const hasBoth = hasNumeric && hasAlpha;

        const numericIntervals = numericEntries.map(e => ({ start: parseMinutes(e.horario_inicio), end: parseMinutes(e.horario_fim) }));
        const alphaIntervals = alphaEntries.map(e => ({ start: parseMinutes(e.horario_inicio), end: parseMinutes(e.horario_fim) }));

        const numericGaps = hasNumeric ? calculateGaps(numericIntervals, DAY_START_MIN, DAY_END_MIN) : [];
        const alphaGaps = hasAlpha ? calculateGaps(alphaIntervals, DAY_START_MIN, DAY_END_MIN) : [];

        const freeSlots: Aula[] = [];

        const createFreeSlot = (start: number, end: number, typeLabel: string): Aula => ({
            isFreeSlot: true,
            disciplina: 'Horário Livre',
            modulo: '',
            horario: `${formatTime(start)} - ${formatTime(end)}`,
            subSessions: [],
            observacao: typeLabel
        });

        if (hasBoth) {
            const processedNumericIndices = new Set<number>();
            const processedAlphaIndices = new Set<number>();

            numericGaps.forEach((nGap, nIdx) => {
                alphaGaps.forEach((aGap, aIdx) => {
                    if (nGap.start === aGap.start && nGap.end === aGap.end) {
                        freeSlots.push(createFreeSlot(nGap.start, nGap.end, ''));
                        processedNumericIndices.add(nIdx);
                        processedAlphaIndices.add(aIdx);
                    }
                });
            });

            numericGaps.forEach((gap, idx) => {
                if (!processedNumericIndices.has(idx)) {
                    freeSlots.push(createFreeSlot(gap.start, gap.end, 'Grupos Numéricos'));
                }
            });

            alphaGaps.forEach((gap, idx) => {
                if (!processedAlphaIndices.has(idx)) {
                    freeSlots.push(createFreeSlot(gap.start, gap.end, 'Grupos Alfabéticos'));
                }
            });

        } else {
            const activeGaps = hasNumeric ? numericGaps : (hasAlpha ? alphaGaps : []);
            activeGaps.forEach(gap => {
                freeSlots.push(createFreeSlot(gap.start, gap.end, ''));
            });
        }
        
        dayAulas = [...dayAulas, ...freeSlots].sort((a, b) => {
             const getStartFromStr = (str: string) => {
                const parts = str.split(' - ')[0].split(':');
                if (parts.length === 2) return parseInt(parts[0])*60 + parseInt(parts[1]);
                return 0;
            };
            
            const startA = a.isFreeSlot ? getStartFromStr(a.horario) : (a.subSessions[0]?.startMinutes || 0);
            const startB = b.isFreeSlot ? getStartFromStr(b.horario) : (b.subSessions[0]?.startMinutes || 0);
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
    selections: Omit<ModuleSelection, 'id'>[], 
    selectedGroups: string[], 
    selectedEletivas: string[],
    allAulas: AulaEntry[],
    allEletivas: EletivaEntry[]
): Schedule | null => {
    let matchingAulas = allAulas.filter(aula => 
        String(aula.periodo) === String(periodo)
    );

    if (selectedGroups.length > 0) {
        matchingAulas = matchingAulas.filter(aula => selectedGroups.includes(aula.grupo));
    }

    const matchingEletivasAsAulaEntries: AulaEntry[] = allEletivas
        .filter(eletiva => selectedEletivas.includes(eletiva.disciplina))
        .map((eletiva): AulaEntry => ({
            periodo: periodo,
            modulo: 'Eletiva',
            grupo: 'Eletiva',
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
        const isGeneralEvent = normalizedEventPeriodo === 'geral';
        const isPeriodMatch = normalizedEventPeriodo === normalizedSelectedPeriodo;
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

export const getUniqueGroupsForPeriod = (periodo: string, allAulas: AulaEntry[]): string[] => {
    const groups = allAulas
        .filter(entry => String(entry.periodo) === String(periodo))
        .map(entry => entry.grupo);
    
    const uniqueGroups = [...new Set(groups)];
    
    uniqueGroups.sort((a, b) => {
        const extractPart = (s: string) => s.split('-').pop()?.trim() || s;
        const partA = extractPart(a);
        const partB = extractPart(b);
        const isNumA = !isNaN(Number(partA));
        const isNumB = !isNaN(Number(partB));
        if (isNumA && isNumB) return Number(partA) - Number(partB);
        if (!isNumA && !isNumB) return partA.localeCompare(partB);
        if (isNumA) return 1;
        if (isNumB) return -1;
        return a.localeCompare(b);
    });

    return uniqueGroups;
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
        if (isNumA && isNumB) return Number(partA) - Number(partB);
        if (!isNumA && !isNumB) return partA.localeCompare(partB);
        if (isNumA) return 1;
        if (isNumB) return -1;
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
                const eventosSheetName = workbook.SheetNames.find((name: string) => {
                    const lowerCaseName = name.toLowerCase().trim();
                    return lowerCaseName === 'eventos' || lowerCaseName === 'avaliações';
                });
                const eventosSheet = eventosSheetName ? workbook.Sheets[eventosSheetName] : undefined;

                if (!aulasSheet) {
                  return reject(new Error("Aba 'Aulas' não encontrada na planilha."));
                }
                
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
