
import React, { useMemo } from 'react';

interface ScheduleFormProps {
  periodo: string;
  setPeriodo: (value: string) => void;
  availablePeriods: string[];
  onSearch: () => void;
  isLoading: boolean;
  
  // Eletivas Props
  availableEletivas: string[];
  selectedEletivas: string[];
  addEletiva: () => void;
  removeEletiva: (disciplina: string) => void;
  eletivaToAdd: string;
  setEletivaToAdd: (value: string) => void;

  // Groups Props
  availableGroups: string[];
  selectedGroups: string[];
  addGroup: () => void;
  removeGroup: (group: string) => void;
  groupToAdd: string;
  setGroupToAdd: (value: string) => void;
}

const SelectInput: React.FC<{
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: (string | { value: string; label: string; disabled?: boolean })[];
  id: string;
  disabled?: boolean;
}> = ({ label, value, onChange, options, id, disabled = false }) => (
  <div className="flex flex-col">
    <label htmlFor={id} className="mb-2 text-sm font-medium text-gray-400">{label}</label>
    <select
      id={id}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="w-full p-3 bg-slate-700 text-gray-200 border border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-afya-blue focus:border-afya-blue focus:bg-slate-600 transition duration-150 ease-in-out appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {options.length === 0 && <option>Nenhuma opção</option>}
      {options.map(option => {
        if (typeof option === 'string') {
          return <option key={option} value={option}>{option}</option>
        }
        return <option key={option.value} value={option.value} disabled={option.disabled} className="disabled:text-gray-500">{option.label}</option>
      })}
    </select>
  </div>
);

const ScheduleForm: React.FC<ScheduleFormProps> = ({
  periodo,
  setPeriodo,
  availablePeriods,
  onSearch,
  isLoading,
  availableEletivas,
  selectedEletivas,
  addEletiva,
  removeEletiva,
  eletivaToAdd,
  setEletivaToAdd,
  availableGroups,
  selectedGroups,
  addGroup,
  removeGroup,
  groupToAdd,
  setGroupToAdd,
}) => {

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  const eletivaOptions = useMemo(() => {
    const available = availableEletivas
        .filter(e => !selectedEletivas.includes(e))
        .sort();
    return [
      { value: '', label: 'Selecione a disciplina', disabled: true },
      ...available.map(e => ({ value: e, label: e }))
    ];
  }, [availableEletivas, selectedEletivas]);

  const groupOptions = useMemo(() => {
      const available = availableGroups
        .filter(g => !selectedGroups.includes(g));
        // Note: availableGroups is already sorted by the service
      return [
          { value: '', label: 'Selecione o grupo', disabled: true },
          ...available.map(g => ({ value: g, label: g }))
      ];
  }, [availableGroups, selectedGroups]);


  return (
    <div className="bg-slate-800 p-6 md:p-8 rounded-lg shadow-lg border border-slate-700">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-200 mb-4">Selecione o Período</h3>
          <SelectInput
              id="periodo"
              label=""
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              options={availablePeriods}
              disabled={availablePeriods.length === 0}
            />
        </div>

        {/* Seção de Filtro de Grupos */}
        {availableGroups.length > 0 && (
             <div>
                <h3 className="text-lg font-semibold text-gray-200 mb-4">Filtrar Grupos (Opcional)</h3>
                <div className="flex items-end gap-4 p-4 bg-gray-900 rounded-lg border border-slate-700">
                    <div className="flex-grow">
                        <SelectInput
                            id="group-select"
                            label="Selecione o grupo para adicionar"
                            value={groupToAdd}
                            onChange={(e) => setGroupToAdd(e.target.value)}
                            options={groupOptions}
                            disabled={groupOptions.length <= 1}
                        />
                    </div>
                    <div>
                        <button
                            type="button"
                            onClick={addGroup}
                            disabled={!groupToAdd}
                            className="w-full bg-slate-700 text-gray-300 font-semibold py-3 px-4 rounded-lg hover:bg-slate-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-slate-500"
                            aria-label="Adicionar grupo"
                        >
                            Adicionar
                        </button>
                    </div>
                </div>
                
                <div className="mt-4 p-4 bg-gray-900 rounded-lg border border-slate-700 min-h-[4rem]">
                    {selectedGroups.length > 0 ? (
                         <>
                             <h4 className="text-sm font-medium text-gray-400 mb-3">Grupos selecionados:</h4>
                             <div className="flex flex-wrap gap-2">
                                 {selectedGroups.map(group => (
                                     <div key={group} className="flex items-center gap-2 bg-blue-900/30 text-blue-300 border border-blue-700/50 text-sm font-medium pl-3 pr-2 py-1 rounded-full animate-fade-in">
                                         <span>{group}</span>
                                         <button
                                             type="button"
                                             onClick={() => removeGroup(group)}
                                             className="text-blue-400 hover:text-white hover:bg-white/10 rounded-full p-0.5 transition-colors"
                                             aria-label={`Remover ${group}`}
                                         >
                                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                 <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                             </svg>
                                         </button>
                                     </div>
                                 ))}
                             </div>
                         </>
                    ) : (
                        <p className="text-sm text-gray-500 italic">Todos os grupos serão exibidos.</p>
                    )}
                </div>
             </div>
        )}

        {availableEletivas.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-200 mb-4">Disciplinas Eletivas (Opcional)</h3>

            <div className="flex items-end gap-4 p-4 bg-gray-900 rounded-lg border border-slate-700">
                <div className="flex-grow">
                    <SelectInput
                        id="eletiva-select"
                        label="Selecione a disciplina"
                        value={eletivaToAdd}
                        onChange={(e) => setEletivaToAdd(e.target.value)}
                        options={eletivaOptions}
                        disabled={eletivaOptions.length <= 1}
                    />
                </div>
                <div>
                    <button
                        type="button"
                        onClick={addEletiva}
                        disabled={!eletivaToAdd}
                        className="w-full bg-slate-700 text-gray-300 font-semibold py-3 px-4 rounded-lg hover:bg-slate-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-slate-500"
                        aria-label="Adicionar disciplina eletiva"
                    >
                        Adicionar
                    </button>
                </div>
            </div>

            {selectedEletivas.length > 0 && (
                <div className="mt-4 p-4 bg-gray-900 rounded-lg border border-slate-700">
                    <h4 className="text-sm font-medium text-gray-400 mb-3">Eletivas selecionadas:</h4>
                    <div className="flex flex-wrap gap-2">
                    {selectedEletivas.map(eletiva => (
                        <div key={eletiva} className="flex items-center gap-2 bg-slate-700 text-gray-300 text-sm font-medium pl-3 pr-2 py-1 rounded-full animate-fade-in" style={{ animationDuration: '0.3s' }}>
                        <span>{eletiva}</span>
                        <button
                            type="button"
                            onClick={() => removeEletiva(eletiva)}
                            className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full p-0.5 transition-colors"
                            aria-label={`Remover ${eletiva}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        </div>
                    ))}
                    </div>
                </div>
            )}
          </div>
        )}
        
        <div className="mt-2">
            <button
              type="submit"
              disabled={isLoading || !periodo}
              className="w-full flex justify-center items-center bg-afya-blue text-white font-bold py-3 px-4 rounded-lg hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-afya-blue transition-all duration-200 ease-in-out disabled:bg-slate-600 disabled:text-gray-400 disabled:cursor-not-allowed shadow-lg"
            >
              {isLoading ? 'Buscando...' : 'Buscar Cronograma'}
            </button>
        </div>
      </form>
    </div>
  );
};

export default ScheduleForm;
