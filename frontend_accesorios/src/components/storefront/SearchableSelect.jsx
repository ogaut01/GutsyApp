import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, X, Search } from 'lucide-react';

// Función para remover acentos y comparar texto sin importar tildes o mayúsculas
const normalizeText = (text = '') =>
  text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export default function SearchableSelect({
  id,
  name,
  value = '',
  onChange,
  options = [],
  placeholder = 'Seleccionar...',
  disabled = false,
  disabledPlaceholder = 'No disponible',
  error = null,
  allowCustom = true,
  autoComplete = 'off',
  ariaLabel
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Sincronizar query cuando el valor externo cambia o al cerrar
  useEffect(() => {
    if (!isOpen) {
      setQuery(value || '');
    }
  }, [value, isOpen]);

  // Cerrar al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        // Si el usuario escribió algo y cerró sin elegir, pero allowCustom está activo, guardar lo escrito
        if (query && query !== value && allowCustom) {
          onChange(query.trim());
        } else {
          setQuery(value || '');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, query, value, allowCustom, onChange]);

  // Filtrado sin importar tildes ni mayúsculas
  const filteredOptions = useMemo(() => {
    if (!query.trim()) return options;
    const cleanQuery = normalizeText(query);
    return options.filter(opt => normalizeText(opt).includes(cleanQuery));
  }, [options, query]);

  const handleSelectOption = (opt) => {
    onChange(opt);
    setQuery(opt);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setQuery('');
    setIsOpen(false);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (!isOpen) setIsOpen(true);
    if (allowCustom) {
      onChange(val);
    }
  };

  const hasExactMatch = options.some(opt => normalizeText(opt) === normalizeText(query));

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="text"
          autoComplete={autoComplete}
          disabled={disabled}
          value={isOpen ? query : (value || '')}
          onChange={handleInputChange}
          onFocus={() => {
            if (!disabled) {
              setIsOpen(true);
              setQuery(value || '');
            }
          }}
          placeholder={disabled ? disabledPlaceholder : placeholder}
          aria-label={ariaLabel || placeholder}
          className={`w-full p-2.5 pr-14 rounded-xl bg-zinc-100 dark:bg-zinc-900 border text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none transition ${
            disabled
              ? 'opacity-60 cursor-not-allowed bg-zinc-100/50 dark:bg-zinc-900/50 border-zinc-200/60 dark:border-zinc-800/60'
              : error
              ? 'border-rose-500 ring-1 ring-rose-500/50 bg-rose-50/10'
              : 'border-zinc-200 dark:border-zinc-800 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400/50'
          }`}
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-zinc-400">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-md transition"
              title="Borrar selección"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              if (!disabled) {
                setIsOpen(!isOpen);
                if (!isOpen && inputRef.current) inputRef.current.focus();
              }
            }}
            className="p-1 hover:text-zinc-600 dark:hover:text-zinc-200 transition"
            tabIndex={-1}
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <span className="text-[10px] text-rose-500 font-medium block mt-0.5">{error}</span>
      )}

      {/* Desplegable con opciones */}
      {isOpen && !disabled && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 max-h-52 overflow-y-auto rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl py-1 text-xs divide-y divide-zinc-100 dark:divide-zinc-800/50 animate-in fade-in zoom-in-95 duration-100">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => {
              const isSelected = normalizeText(opt) === normalizeText(value);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleSelectOption(opt)}
                  className={`w-full px-3 py-2 text-left flex items-center justify-between transition ${
                    isSelected
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <span className="truncate">{opt}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 ml-2" />}
                </button>
              );
            })
          ) : (
            <div className="p-3 text-center text-zinc-400 space-y-1">
              <p className="text-[11px]">No se encontraron coincidencias.</p>
              {allowCustom && query.trim() && (
                <button
                  type="button"
                  onClick={() => handleSelectOption(query.trim())}
                  className="mt-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 underline hover:opacity-80 block mx-auto"
                >
                  Usar &quot;{query.trim()}&quot;
                </button>
              )}
            </div>
          )}

          {/* Opción para escribir localidad propia si no coincide exactamente */}
          {allowCustom && query.trim() && !hasExactMatch && filteredOptions.length > 0 && (
            <div className="p-1.5 bg-zinc-50 dark:bg-zinc-950/40">
              <button
                type="button"
                onClick={() => handleSelectOption(query.trim())}
                className="w-full text-left px-2.5 py-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium hover:underline flex items-center gap-1.5"
              >
                <span>Usar texto ingresado: &quot;{query.trim()}&quot;</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
