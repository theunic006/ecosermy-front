import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FiPlus, FiCheck, FiX, FiChevronDown } from 'react-icons/fi';
import { getConceptos, agregarConcepto } from '../../services/conceptosService';

/**
 * ConceptoSelect – Combobox buscable con opción de agregar nuevos conceptos.
 * Props:
 *   value       – valor actual (string)
 *   onChange    – fn(nuevoValor: string)
 *   placeholder – texto placeholder del input
 */
function ConceptoSelect({ value, onChange, placeholder = 'Buscar o escribir concepto...' }) {
  const [conceptos, setConceptos] = useState([]);
  const [inputVal, setInputVal]   = useState(value || '');
  const [open, setOpen]           = useState(false);
  const [guardado, setGuardado]   = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [dropPos, setDropPos]     = useState({ top: 0, left: 0, width: 200 });
  const containerRef              = useRef(null);
  const inputRef                  = useRef(null);

  useEffect(() => {
    getConceptos()
      .then(lista => setConceptos(lista))
      .catch(() => setConceptos([]));
  }, []);

  useEffect(() => {
    setInputVal(value || '');
  }, [value]);

  // Calcular posición del dropdown con getBoundingClientRect
  const recalcPos = useCallback(() => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    setDropPos({
      top:   rect.bottom + window.scrollY + 2,
      left:  rect.left   + window.scrollX,
      width: rect.width,
    });
  }, []);

  const handleOpen = () => {
    recalcPos();
    setOpen(true);
  };

  // Cerrar al click fuera
  useEffect(() => {
    const handler = (e) => {
      if (
        containerRef.current && !containerRef.current.contains(e.target) &&
        !document.getElementById('concepto-dropdown-portal')?.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Recalcular posición al hacer scroll o resize
  useEffect(() => {
    if (!open) return;
    const update = () => recalcPos();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open, recalcPos]);

  const filtered = inputVal.trim()
    ? conceptos.filter(c => c.toLowerCase().includes(inputVal.toLowerCase()))
    : conceptos;

  const yaExiste = conceptos.some(c => c.toLowerCase() === inputVal.trim().toLowerCase());

  const handleInput = (e) => {
    const val = e.target.value.slice(0, 200);
    setInputVal(val);
    onChange(val);
    recalcPos();
    setOpen(true);
  };

  const handleSelect = (concepto) => {
    setInputVal(concepto);
    onChange(concepto);
    setOpen(false);
  };

  const handleGuardar = async () => {
    const texto = inputVal.trim();
    if (!texto || yaExiste || guardando) return;
    setGuardando(true);
    try {
      const lista = await agregarConcepto(texto);
      setConceptos(lista);
      onChange(texto);
      setOpen(false);
      setGuardado(true);
      setTimeout(() => setGuardado(false), 1800);
    } catch {
      // silencioso — el concepto igual queda seleccionado
      onChange(texto);
    } finally {
      setGuardando(false);
    }
  };

  const handleClear = () => {
    setInputVal('');
    onChange('');
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered.length === 1) {
        handleSelect(filtered[0]);
      } else if (inputVal.trim() && !yaExiste) {
        handleGuardar();
      }
    }
    if (e.key === 'Escape') setOpen(false);
    if (e.key === 'ArrowDown') { e.preventDefault(); handleOpen(); }
  };

  // Portal del dropdown
  const dropdown = open ? createPortal(
    <div
      id="concepto-dropdown-portal"
      style={{
        position: 'absolute',
        top:    dropPos.top,
        left:   dropPos.left,
        width:  dropPos.width,
        background: 'var(--bg-primary, #fff)',
        border: '1px solid var(--border-color, #e2e8f0)',
        borderRadius: '8px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
        zIndex: 99999,
        maxHeight: '220px',
        overflowY: 'auto',
      }}
    >
      {filtered.length === 0 ? (
        <div style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
          Sin resultados — presiona "Guardar" para agregar
        </div>
      ) : (
        filtered.map((c) => (
          <div
            key={c}
            onMouseDown={(e) => { e.preventDefault(); handleSelect(c); }}
            style={{
              padding: '9px 14px', cursor: 'pointer', fontSize: '0.88rem',
              background: c === inputVal ? 'var(--primary-bg, #eff6ff)' : 'transparent',
              color: c === inputVal ? '#2563eb' : 'var(--text-primary)',
              fontWeight: c === inputVal ? 600 : 400,
              borderBottom: '1px solid var(--border-color, #f1f5f9)',
            }}
            onMouseEnter={e => { if (c !== inputVal) e.currentTarget.style.background = 'var(--bg-secondary, #f8fafc)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = c === inputVal ? 'var(--primary-bg, #eff6ff)' : 'transparent'; }}
          >
            {inputVal.trim() ? highlightMatch(c, inputVal) : c}
          </div>
        ))
      )}
    </div>,
    document.body
  ) : null;

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* ── Fila: input + botón guardar ── */}
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={handleInput}
            onFocus={handleOpen}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            maxLength={200}
            autoComplete="off"
            style={{ width: '100%', paddingRight: '52px', boxSizing: 'border-box' }}
          />
          <div style={{
            position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)',
            display: 'flex', alignItems: 'center', gap: '2px',
          }}>
            {inputVal && (
              <button
                type="button"
                onMouseDown={handleClear}
                title="Limpiar"
                style={{
                  border: 'none', background: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', padding: '2px', lineHeight: 1,
                  display: 'flex', alignItems: 'center',
                }}
              >
                <FiX size={13} />
              </button>
            )}
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); if (open) setOpen(false); else handleOpen(); }}
              tabIndex={-1}
              style={{
                border: 'none', background: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', padding: '2px', lineHeight: 1,
                display: 'flex', alignItems: 'center',
              }}
            >
              <FiChevronDown size={14} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '0.15s' }} />
            </button>
          </div>
        </div>

        {inputVal.trim() && !yaExiste && (
          <button
            type="button"
            onClick={handleGuardar}
            disabled={guardando}
            title="Guardar nuevo concepto en el servidor"
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '6px 13px', borderRadius: '6px', border: 'none',
              background: guardado ? '#059669' : guardando ? '#6b7280' : '#2563eb',
              color: '#fff', fontWeight: 600, fontSize: '0.82rem',
              cursor: guardando ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s', whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {guardado ? <FiCheck size={13} /> : <FiPlus size={13} />}
            {guardado ? 'Guardado' : guardando ? 'Guardando...' : 'Guardar'}
          </button>
        )}
      </div>

      {inputVal.length > 0 && (
        <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textAlign: 'right', display: 'block', marginTop: '2px' }}>
          {inputVal.length}/200
          {inputVal.trim() && !yaExiste && (
            <span style={{ marginLeft: 6, color: '#2563eb' }}>— Presiona Enter o "Guardar" para añadir a la lista</span>
          )}
        </small>
      )}

      {dropdown}
    </div>
  );
}

/** Resalta la parte del texto que coincide con el término buscado */
function highlightMatch(text, term) {
  const idx = text.toLowerCase().indexOf(term.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <strong style={{ color: '#2563eb' }}>{text.slice(idx, idx + term.length)}</strong>
      {text.slice(idx + term.length)}
    </>
  );
}

export default ConceptoSelect;
