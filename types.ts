
export interface AulaGroupDetail {
  grupo: string;
  sala: string;
  horario: string;
  professor: string;
  tipo?: string;
  observacao?: string;
  startMinutes: number; // Used for sorting inside the card
  endMinutes: number;
}

export interface Aula {
  isFreeSlot?: boolean;
  horario: string; // Represents the full range (e.g., Earliest Start - Latest End)
  disciplina: string;
  modulo: string;
  subSessions: AulaGroupDetail[]; // Array of specific group details
  observacao?: string; // General observation
}

// Representa uma entrada de aula individual como está no aulas.json
export interface AulaEntry {
  periodo: string;
  modulo: string;
  grupo: string;
  dia_semana: string;
  horario_inicio: string;
  horario_fim: string;
  disciplina: string;
  sala: string;
  tipo?: string;
  professor?: string;
  observacao?: string;
}

// Representa uma entrada de disciplina eletiva
export interface EletivaEntry {
  disciplina: string; // Mapeado da coluna 'modulo' na planilha de eletivas
  dia_semana: string;
  horario_inicio: string;
  horario_fim: string;
  professor?: string;
  sala: string;
  tipo?: string;
}

export interface DiaDeAula {
  dia: string;
  aulas: Aula[];
}

export type Schedule = DiaDeAula[];

export interface ModuleSelection {
  id: number;
  modulo: string;
  grupo: string;
}

export interface Event {
  periodo: string;
  data: string;
  data_fim?: string; // Adicionado para a data de término do evento
  horario: string;
  disciplina: string;
  tipo: string;
  local: string;
  modulo: string;
  grupo: string;
}
