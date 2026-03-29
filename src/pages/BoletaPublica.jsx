import { useState } from 'react';
import { FiFileText, FiSearch, FiDownload, FiAlertCircle, FiUser, FiCalendar, FiShield } from 'react-icons/fi';
import BoletaPago from '../components/BoletaPago';
import { obtenerBoletaPublica } from '../services/catalogoService';
import { toast } from 'react-toastify';
import { useThemeColors } from '../utils/darkColors';

const MESES = [
  { v: 1, l: 'Enero' }, { v: 2, l: 'Febrero' }, { v: 3, l: 'Marzo' },
  { v: 4, l: 'Abril' }, { v: 5, l: 'Mayo' }, { v: 6, l: 'Junio' },
  { v: 7, l: 'Julio' }, { v: 8, l: 'Agosto' }, { v: 9, l: 'Septiembre' },
  { v: 10, l: 'Octubre' }, { v: 11, l: 'Noviembre' }, { v: 12, l: 'Diciembre' },
];

const ANIOS = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

function BoletaPublica() {
  const { isDark, c } = useThemeColors();
  const hoy = new Date();
  const [codigo, setCodigo]   = useState('');
  const [dni, setDni]         = useState('');
  const [mes, setMes]         = useState(hoy.getMonth() + 1);
  const [anio, setAnio]       = useState(hoy.getFullYear());
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [boletaData, setBoletaData] = useState(null);
  const [mostrarBoleta, setMostrarBoleta] = useState(false);

  const handleConsultar = async (e) => {
    e.preventDefault();
    setError('');

    if (!codigo.trim() || !dni.trim()) {
      setError('Por favor ingresa tu código de trabajador y DNI.');
      return;
    }
    if (dni.trim().length !== 8) {
      setError('El DNI debe tener 8 dígitos.');
      return;
    }

    setLoading(true);
    try {
      const data = await obtenerBoletaPublica(codigo.trim().toUpperCase(), dni.trim(), mes, anio);
      setBoletaData(data);
      setMostrarBoleta(true);
    } catch (err) {
      const msg = err?.response?.data?.message || 'No se encontró boleta para los datos ingresados.';
      setError(msg);
      setBoletaData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: '40px 16px',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      {/* Logo y cabecera */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{
          width: 72, height: 72, background: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px', boxShadow: '0 8px 32px rgba(37, 99, 235, 0.4)',
        }}>
          <FiFileText size={34} color="#fff" />
        </div>
        <h1 style={{ color: '#f1f5f9', fontSize: '1.7rem', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
          Consulta de Boleta de Pago
        </h1>
        <p style={{ color: '#94a3b8', marginTop: 6, fontSize: '0.9rem' }}>
          EMPRESA COMUNAL DE SERVICIOS MULTIPLES YAULI
        </p>
      </div>

      {/* Formulario */}
      <div style={{
        background: isDark ? 'transparent' : '#fff',
        borderRadius: 16,
        boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
        padding: '36px 40px',
        width: '100%',
        maxWidth: 460,
      }}>
        <h2 style={{ margin: '0 0 6px', color: isDark ? c.textPrimary : '#1e293b', fontSize: '1.15rem', fontWeight: 700 }}>
          Ingresa tus datos
        </h2>
        <p style={{ margin: '0 0 24px', color: c.textSecondary, fontSize: '0.85rem' }}>
          Usa tu código de trabajador y DNI para acceder a tu boleta.
        </p>

        <form onSubmit={handleConsultar} autoComplete="off">
          {/* Código */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.85rem', color: isDark ? c.textSecondary : '#374151' }}>
              <FiUser size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />
              Código de Trabajador
            </label>
            <input
              type="text"
              value={codigo}
              onChange={e => setCodigo(e.target.value.toUpperCase())}
              placeholder="Ej: ECO00117"
              maxLength={20}
              style={{
                width: '100%', padding: '10px 14px', fontSize: '1rem',
                border: '1.5px solid #d1d5db', borderRadius: 8,
                outline: 'none', transition: 'border 0.2s',
                fontFamily: 'monospace', letterSpacing: 1, boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = '#2563eb'}
              onBlur={e => e.target.style.borderColor = '#d1d5db'}
              autoFocus
            />
          </div>

          {/* DNI */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.85rem', color: isDark ? c.textSecondary : '#374151' }}>
              <FiShield size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />
              DNI
            </label>
            <input
              type="text"
              value={dni}
              onChange={e => setDni(e.target.value.replace(/\D/, '').slice(0, 8))}
              placeholder="12345678"
              maxLength={8}
              style={{
                width: '100%', padding: '10px 14px', fontSize: '1rem',
                border: '1.5px solid #d1d5db', borderRadius: 8,
                outline: 'none', transition: 'border 0.2s',
                fontFamily: 'monospace', letterSpacing: 2, boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = '#2563eb'}
              onBlur={e => e.target.style.borderColor = '#d1d5db'}
            />
          </div>

          {/* Período */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.85rem', color: isDark ? c.textSecondary : '#374151' }}>
              <FiCalendar size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />
              Período
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <select
                value={mes}
                onChange={e => setMes(+e.target.value)}
                style={{
                  flex: 3, padding: '10px 12px', fontSize: '0.9rem',
                  border: '1.5px solid #d1d5db', borderRadius: 8,
                  background: isDark ? 'transparent' : '#fff', cursor: 'pointer', boxSizing: 'border-box',
                }}
              >
                {MESES.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
              </select>
              <select
                value={anio}
                onChange={e => setAnio(+e.target.value)}
                style={{
                  flex: 2, padding: '10px 12px', fontSize: '0.9rem',
                  border: '1.5px solid #d1d5db', borderRadius: 8,
                  background: isDark ? 'transparent' : '#fff', cursor: 'pointer', boxSizing: 'border-box',
                }}
              >
                {ANIOS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: 8, padding: '10px 14px', marginBottom: 16,
              display: 'flex', alignItems: 'flex-start', gap: 8,
            }}>
              <FiAlertCircle size={16} color="#dc2626" style={{ marginTop: 1, flexShrink: 0 }} />
              <span style={{ color: '#dc2626', fontSize: '0.85rem' }}>{error}</span>
            </div>
          )}

          {/* Botón */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '12px',
              background: loading ? '#93c5fd' : 'linear-gradient(135deg, #2563eb, #0ea5e9)',
              color: '#fff', border: 'none', borderRadius: 8,
              fontSize: '1rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.2s',
            }}
          >
            {loading ? (
              <>
                <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Consultando...
              </>
            ) : (
              <>
                <FiSearch size={17} />
                Consultar Boleta
              </>
            )}
          </button>
        </form>

        {/* Info de privacidad */}
        <div style={{
          marginTop: 20, padding: '10px 14px', background: isDark ? 'rgba(148,163,184,.04)' : '#f8fafc',
          borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <FiShield size={14} color={c.textSecondary} style={{ flexShrink: 0 }} />
          <span style={{ color: c.textSecondary, fontSize: '0.78rem' }}>
            Tus datos son verificados de forma segura. Solo tú puedes acceder a tu boleta con tu código y DNI.
          </span>
        </div>
      </div>

      {/* Enlace al sistema */}
      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <a
          href="/login"
          style={{ color: '#64748b', fontSize: '0.82rem', textDecoration: 'none' }}
          onMouseEnter={e => e.target.style.color = '#94a3b8'}
          onMouseLeave={e => e.target.style.color = '#64748b'}
        >
          ¿Eres administrador? Inicia sesión →
        </a>
      </div>

      {/* Spinner CSS */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Modal Boleta */}
      {mostrarBoleta && boletaData && (
        <BoletaPago
          data={boletaData}
          onClose={() => { setMostrarBoleta(false); }}
        />
      )}
    </div>
  );
}

export default BoletaPublica;
