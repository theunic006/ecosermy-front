import { useState, useEffect, useRef, useCallback } from 'react';
import {
  FiUser, FiShield, FiSearch, FiDownload, FiAlertCircle,
  FiCheckCircle, FiXCircle, FiFileText, FiCalendar, FiArrowLeft,
  FiPackage, FiLock, FiClock, FiRefreshCw,
} from 'react-icons/fi';
import BoletaPago from '../components/BoletaPago';
import { visitanteMeses, obtenerBoletaPublica } from '../services/catalogoService';
import { toast } from 'react-toastify';

const MESES_NOMBRES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const MESES_CORTOS = [
  '', 'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN',
  'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC',
];

// Colores por mes para hacer la grid más visual
const MES_COLORS = [
  '', // 0 vacío
  { accent: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.25)' },   // ENE
  { accent: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.25)' },   // FEB
  { accent: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.25)' },   // MAR
  { accent: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)' },   // ABR
  { accent: '#ec4899', bg: 'rgba(236,72,153,0.08)', border: 'rgba(236,72,153,0.25)' },   // MAY
  { accent: '#06b6d4', bg: 'rgba(6,182,212,0.08)',  border: 'rgba(6,182,212,0.25)'  },   // JUN
  { accent: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.25)' },   // JUL
  { accent: '#14b8a6', bg: 'rgba(20,184,166,0.08)', border: 'rgba(20,184,166,0.25)' },   // AGO
  { accent: '#a855f7', bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.25)' },   // SEP
  { accent: '#ef4444', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.25)'  },   // OCT
  { accent: '#84cc16', bg: 'rgba(132,204,22,0.08)', border: 'rgba(132,204,22,0.25)' },   // NOV
  { accent: '#0ea5e9', bg: 'rgba(14,165,233,0.08)', border: 'rgba(14,165,233,0.25)' },   // DIC
];

// ── Opción 5: Generador de CAPTCHA matemático ──────────────────────────────
function generarCaptcha() {
  const ops = ['+', '-', '×'];
  const op  = ops[Math.floor(Math.random() * ops.length)];
  let a, b, res;
  if (op === '+') { a = Math.floor(Math.random() * 9) + 1; b = Math.floor(Math.random() * 9) + 1; res = a + b; }
  else if (op === '-') { a = Math.floor(Math.random() * 8) + 2; b = Math.floor(Math.random() * (a - 1)) + 1; res = a - b; }
  else { a = Math.floor(Math.random() * 5) + 2; b = Math.floor(Math.random() * 4) + 2; res = a * b; }
  return { pregunta: `${a} ${op} ${b}`, respuesta: res };
}

// ── Formato mm:ss para countdown ────────────────────────────────────────────
function formatCountdown(seg) {
  const m = Math.floor(seg / 60).toString().padStart(2, '0');
  const s = (seg % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function Visitante() {
  const [codigo, setCodigo]       = useState('');
  const [dni, setDni]             = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [empleadoData, setEmpleadoData] = useState(null);
  const [descargando, setDescargando]   = useState(null);
  const [boletaData, setBoletaData]     = useState(null);
  const [mostrarBoleta, setMostrarBoleta] = useState(false);

  // Opción 5 — CAPTCHA matemático
  const [captcha, setCaptcha]           = useState(() => generarCaptcha());
  const [respuestaCaptcha, setRespuestaCaptcha] = useState('');
  const [captchaError, setCaptchaError] = useState(false);

  // Opción 2 — Intentos y bloqueo con countdown
  const [intentosRestantes, setIntentosRestantes] = useState(null);
  const [bloqueado, setBloqueado]       = useState(false);
  const [countdown, setCountdown]       = useState(0);
  const countdownRef = useRef(null);

  // Opción 6 — Honeypot (ref al campo trampa oculto)
  const honeypotRef = useRef(null);

  // ── Iniciar countdown cuando se bloquea ─────────────────────────────────
  const iniciarCountdown = useCallback((segundos) => {
    setBloqueado(true);
    setCountdown(segundos);
    clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          setBloqueado(false);
          setIntentosRestantes(null);
          setError('');
          setCaptcha(generarCaptcha());
          setRespuestaCaptcha('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => () => clearInterval(countdownRef.current), []);

  // ── Step 1: Verificar identidad ─────────────────────────────────────────
  const handleVerificar = async (e) => {
    e.preventDefault();
    setError('');
    setCaptchaError(false);

    // Opción 6: comprobar honeypot en cliente también
    if (honeypotRef.current?.value) return;

    if (!codigo.trim() || !dni.trim()) {
      setError('Por favor ingresa tu código de trabajador y tu DNI.');
      return;
    }
    if (dni.trim().length !== 8) {
      setError('El DNI debe tener exactamente 8 dígitos.');
      return;
    }

    // Opción 5: validar CAPTCHA
    if (parseInt(respuestaCaptcha, 10) !== captcha.respuesta) {
      setCaptchaError(true);
      setCaptcha(generarCaptcha());
      setRespuestaCaptcha('');
      return;
    }

    setLoading(true);
    try {
      const data = await visitanteMeses(codigo.trim().toUpperCase(), dni.trim());
      setEmpleadoData(data);
      setIntentosRestantes(null);
    } catch (err) {
      const status  = err?.response?.status;
      const body    = err?.response?.data || {};

      // Opción 1: rate limit global del servidor
      if (status === 429 && body.bloqueado) {
        iniciarCountdown(body.segundos_restantes || 600);
        setError('');
      } else if (status === 429) {
        iniciarCountdown(300);
        setError('');
      } else {
        // Opción 2: mostrar intentos restantes
        const msg      = body.message || 'No se encontró ningún empleado con ese código y DNI.';
        const restantes = body.intentos_restantes ?? null;
        setError(msg);
        setIntentosRestantes(restantes);
        // Renovar CAPTCHA en cada intento fallido
        setCaptcha(generarCaptcha());
        setRespuestaCaptcha('');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Descargar boleta de un mes ──────────────────────────────────
  const handleDescargarMes = async (mes) => {
    setDescargando(mes);
    try {
      const data = await obtenerBoletaPublica(
        codigo.trim().toUpperCase(),
        dni.trim(),
        mes,
        empleadoData.anio,
      );
      setBoletaData(data);
      setMostrarBoleta(true);
    } catch {
      toast.error('No se pudo cargar la boleta de ese período.');
    } finally {
      setDescargando(null);
    }
  };

  const handleVolver = () => {
    setEmpleadoData(null);
    setError('');
    setIntentosRestantes(null);
    setCaptcha(generarCaptcha());
    setRespuestaCaptcha('');
  };

  /* ─────────── RENDER ─────────── */
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1a2744 50%, #0f172a 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '40px 16px 60px', fontFamily: 'Inter, system-ui, sans-serif',
    }}>

      {/* ── Cabecera ── */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{
          width: 76, height: 76,
          background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px', boxShadow: '0 8px 40px rgba(124,58,237,0.45)',
        }}>
          <FiFileText size={36} color="#fff" />
        </div>
        <h1 style={{ color: '#f1f5f9', fontSize: '1.8rem', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
          Portal del Visitante
        </h1>
        <p style={{ color: '#94a3b8', marginTop: 6, fontSize: '0.92rem', fontWeight: 500 }}>
          EMPRESA COMUNAL DE SERVICIOS MULTIPLES YAULI
        </p>
        <p style={{ color: '#475569', marginTop: 3, fontSize: '0.81rem' }}>
          Consulta y descarga tus boletas de pago del año en curso
        </p>
      </div>

      {/* ════════════ STEP 1 — FORMULARIO ════════════ */}
      {!empleadoData && (
        <div style={{
          background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.09)', borderRadius: 18,
          boxShadow: '0 28px 72px rgba(0,0,0,0.4)', padding: '38px 42px',
          width: '100%', maxWidth: 460,
        }}>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ margin: '0 0 4px', color: '#f1f5f9', fontSize: '1.15rem', fontWeight: 700 }}>
              Identifícate
            </h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.84rem' }}>
              Ingresa tu código de trabajador y DNI para ver tus boletas disponibles.
            </p>
          </div>

          {/* ══ BLOQUEO — Countdown ══ */}
          {bloqueado ? (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1.5px solid rgba(239,68,68,0.3)',
              borderRadius: 12, padding: '28px 20px', textAlign: 'center',
            }}>
              <FiClock size={36} color="#f87171" style={{ marginBottom: 10 }} />
              <div style={{ color: '#f87171', fontWeight: 800, fontSize: '1rem', marginBottom: 6 }}>
                Acceso bloqueado temporalmente
              </div>
              <div style={{ color: '#fca5a5', fontSize: '0.84rem', marginBottom: 18 }}>
                Demasiados intentos fallidos. Podrás intentarlo de nuevo en:
              </div>
              <div style={{
                color: '#fff', fontWeight: 900, fontSize: '2.4rem', letterSpacing: 3,
                fontFamily: 'monospace', background: 'rgba(239,68,68,0.18)',
                borderRadius: 10, padding: '10px 24px', display: 'inline-block',
              }}>
                {formatCountdown(countdown)}
              </div>
              <div style={{ color: '#475569', fontSize: '0.76rem', marginTop: 12 }}>
                El acceso se restaurará automáticamente
              </div>
            </div>
          ) : (
            <form onSubmit={handleVerificar} autoComplete="off">

              {/* Opción 6 — Campo trampa honeypot (invisible para humanos) */}
              <input
                ref={honeypotRef}
                type="text"
                name="website"
                tabIndex={-1}
                style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0 }}
                aria-hidden="true"
              />

              {/* Código */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.84rem', color: '#94a3b8' }}>
                  <FiUser size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />
                  Código de Trabajador
                </label>
                <input
                  type="text"
                  value={codigo}
                  onChange={e => setCodigo(e.target.value.toUpperCase())}
                  placeholder="Ej: ECO00117"
                  maxLength={20}
                  autoFocus
                  style={{
                    width: '100%', padding: '11px 14px', fontSize: '1rem',
                    background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)',
                    borderRadius: 9, outline: 'none', color: '#f1f5f9',
                    fontFamily: 'monospace', letterSpacing: 1, boxSizing: 'border-box', transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#7c3aed'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
                />
              </div>

              {/* DNI */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.84rem', color: '#94a3b8' }}>
                  <FiShield size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />
                  DNI
                </label>
                <input
                  type="text"
                  value={dni}
                  onChange={e => setDni(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="12345678"
                  maxLength={8}
                  style={{
                    width: '100%', padding: '11px 14px', fontSize: '1rem',
                    background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)',
                    borderRadius: 9, outline: 'none', color: '#f1f5f9',
                    fontFamily: 'monospace', letterSpacing: 2, boxSizing: 'border-box', transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#7c3aed'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
                />
              </div>

              {/* Opción 5 — CAPTCHA matemático */}
              <div style={{
                background: 'rgba(124,58,237,0.08)', border: `1.5px solid ${captchaError ? 'rgba(239,68,68,0.5)' : 'rgba(124,58,237,0.2)'}`,
                borderRadius: 10, padding: '14px 16px', marginBottom: 20,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <label style={{ fontWeight: 700, fontSize: '0.82rem', color: '#a78bfa' }}>
                    🔐 Verificación de seguridad
                  </label>
                  <button
                    type="button"
                    onClick={() => { setCaptcha(generarCaptcha()); setRespuestaCaptcha(''); setCaptchaError(false); }}
                    title="Generar nueva pregunta"
                    style={{
                      background: 'transparent', border: 'none', color: '#6d28d9',
                      cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center',
                    }}
                  >
                    <FiRefreshCw size={14} />
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    background: 'rgba(124,58,237,0.15)', borderRadius: 8, padding: '8px 16px',
                    fontFamily: 'monospace', fontWeight: 900, fontSize: '1.2rem', color: '#c4b5fd',
                    letterSpacing: 2, flexShrink: 0, border: '1px solid rgba(124,58,237,0.25)',
                  }}>
                    {captcha.pregunta} = ?
                  </div>
                  <input
                    type="number"
                    value={respuestaCaptcha}
                    onChange={e => { setRespuestaCaptcha(e.target.value); setCaptchaError(false); }}
                    placeholder="Respuesta"
                    style={{
                      flex: 1, padding: '9px 12px', fontSize: '1rem',
                      background: 'rgba(255,255,255,0.06)',
                      border: `1.5px solid ${captchaError ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.12)'}`,
                      borderRadius: 8, outline: 'none',
                      color: captchaError ? '#fca5a5' : '#f1f5f9',
                      fontFamily: 'monospace', fontWeight: 700, textAlign: 'center',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={e => { if (!captchaError) e.target.style.borderColor = '#7c3aed'; }}
                    onBlur={e => { if (!captchaError) e.target.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                  />
                </div>
                {captchaError && (
                  <div style={{ color: '#f87171', fontSize: '0.78rem', marginTop: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <FiAlertCircle size={12} /> Respuesta incorrecta. Se generó una nueva pregunta.
                  </div>
                )}
              </div>

              {/* Opción 2 — Error + intentos restantes */}
              {error && (
                <div style={{
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 9, padding: '10px 14px', marginBottom: 16,
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <FiAlertCircle size={15} color="#f87171" style={{ marginTop: 1, flexShrink: 0 }} />
                    <span style={{ color: '#fca5a5', fontSize: '0.85rem' }}>{error}</span>
                  </div>
                  {intentosRestantes !== null && intentosRestantes > 0 && (
                    <div style={{
                      marginTop: 8, display: 'flex', gap: 4, justifyContent: 'center',
                    }}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} style={{
                          width: 22, height: 6, borderRadius: 3,
                          background: i < intentosRestantes
                            ? (intentosRestantes <= 2 ? '#ef4444' : intentosRestantes <= 3 ? '#f97316' : '#eab308')
                            : 'rgba(255,255,255,0.08)',
                          transition: 'background 0.3s',
                        }} />
                      ))}
                      <span style={{ color: '#94a3b8', fontSize: '0.74rem', marginLeft: 6 }}>
                        {intentosRestantes} intento{intentosRestantes !== 1 ? 's' : ''} restante{intentosRestantes !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Botón enviar */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '13px',
                  background: loading ? 'rgba(124,58,237,0.4)' : 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                  color: '#fff', border: 'none', borderRadius: 9,
                  fontSize: '1rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: loading ? 'none' : '0 4px 20px rgba(124,58,237,0.35)',
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.9'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
              >
                {loading ? (
                  <>
                    <span style={{
                      display: 'inline-block', width: 16, height: 16,
                      border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff',
                      borderRadius: '50%', animation: 'spin 0.8s linear infinite',
                    }} />
                    Verificando...
                  </>
                ) : (
                  <><FiSearch size={17} /> Consultar mis Boletas</>
                )}
              </button>
            </form>
          )}

          {/* Nota privacidad + badges seguridad */}
          <div style={{ marginTop: 20 }}>
            <div style={{
              padding: '10px 14px', background: 'rgba(148,163,184,0.04)', borderRadius: 8,
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
            }}>
              <FiLock size={13} color="#475569" style={{ flexShrink: 0 }} />
              <span style={{ color: '#475569', fontSize: '0.78rem' }}>
                Tus datos son verificados de forma segura. Solo tú puedes ver tus boletas.
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[
                { label: 'Rate Limiting', color: '#1d4ed8' },
                { label: 'Bloqueo por intentos', color: '#7c3aed' },
                { label: 'CAPTCHA', color: '#065f46' },
                { label: 'Honeypot', color: '#92400e' },
              ].map(b => (
                <span key={b.label} style={{
                  background: `${b.color}22`, border: `1px solid ${b.color}44`,
                  color: `${b.color}cc`, borderRadius: 20, padding: '2px 9px',
                  fontSize: '0.68rem', fontWeight: 700,
                }}>
                  🔒 {b.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ STEP 2 — MESES DISPONIBLES ════════════════ */}
      {empleadoData && (
        <div style={{ width: '100%', maxWidth: 820 }}>

          {/* Card empleado */}
          <div style={{
            background: 'rgba(124,58,237,0.12)',
            border: '1.5px solid rgba(124,58,237,0.28)',
            borderRadius: 16, padding: '20px 24px', marginBottom: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 16, flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 54, height: 54, borderRadius: '50%',
                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                boxShadow: '0 4px 16px rgba(124,58,237,0.35)',
              }}>
                <FiUser size={26} color="#fff" />
              </div>
              <div>
                <div style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '1.08rem' }}>
                  {empleadoData.empleado.apellidos}, {empleadoData.empleado.nombres}
                </div>
                <div style={{ color: '#a78bfa', fontSize: '0.82rem', marginTop: 3 }}>
                  Código: <strong>{empleadoData.empleado.codigo}</strong>
                  {empleadoData.empleado.cargo && <> · {empleadoData.empleado.cargo}</>}
                  {empleadoData.empleado.unidad && <> · {empleadoData.empleado.unidad}</>}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Contador */}
              <div style={{
                background: empleadoData.total_disponibles > 0
                  ? 'rgba(16,185,129,0.15)'
                  : 'rgba(71,85,105,0.2)',
                border: `1px solid ${empleadoData.total_disponibles > 0 ? 'rgba(16,185,129,0.3)' : 'rgba(71,85,105,0.3)'}`,
                borderRadius: 10, padding: '10px 18px', textAlign: 'center',
              }}>
                <div style={{
                  color: empleadoData.total_disponibles > 0 ? '#34d399' : '#64748b',
                  fontWeight: 800, fontSize: '1.6rem', lineHeight: 1,
                }}>
                  {empleadoData.total_disponibles}
                </div>
                <div style={{
                  color: empleadoData.total_disponibles > 0 ? '#6ee7b7' : '#475569',
                  fontSize: '0.7rem', marginTop: 2,
                }}>
                  boleta{empleadoData.total_disponibles !== 1 ? 's' : ''} disponible{empleadoData.total_disponibles !== 1 ? 's' : ''}
                </div>
              </div>
              {/* Botón volver */}
              <button
                onClick={handleVolver}
                style={{
                  background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
                  color: '#94a3b8', borderRadius: 8, padding: '9px 14px',
                  cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.color = '#cbd5e1'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#94a3b8'; }}
              >
                <FiArrowLeft size={14} /> Cambiar datos
              </button>
            </div>
          </div>

          {/* Instrucción */}
          <div style={{ color: '#64748b', fontSize: '0.84rem', marginBottom: 18, paddingLeft: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
            <FiCalendar size={14} color="#475569" />
            Boletas del año <strong style={{ color: '#94a3b8', marginLeft: 3 }}>{empleadoData.anio}</strong>
            <span style={{ marginLeft: 6 }}>— Haz clic en <strong style={{ color: '#7c3aed' }}>Descargar</strong> para abrir la boleta de cada mes</span>
          </div>

          {/* Grid de meses */}
          {empleadoData.meses.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))',
              gap: 14,
            }}>
              {empleadoData.meses.map(({ mes, disponible }) => {
                const color = MES_COLORS[mes] || MES_COLORS[1];
                return (
                  <div
                    key={mes}
                    style={{
                      background: disponible ? color.bg : 'rgba(255,255,255,0.02)',
                      border: `1.5px solid ${disponible ? color.border : 'rgba(255,255,255,0.06)'}`,
                      borderRadius: 13,
                      padding: '20px 16px 16px',
                      textAlign: 'center',
                      transition: 'transform 0.15s, box-shadow 0.15s',
                      cursor: disponible ? 'default' : 'not-allowed',
                    }}
                    onMouseEnter={e => {
                      if (disponible) {
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.boxShadow = `0 10px 28px ${color.border}`;
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Nombre mes */}
                    <div style={{
                      color: disponible ? color.accent : '#1e293b',
                      fontWeight: 900, fontSize: '1.35rem', letterSpacing: 1.5,
                      lineHeight: 1,
                    }}>
                      {MESES_CORTOS[mes]}
                    </div>
                    <div style={{
                      color: disponible ? `${color.accent}99` : '#1e3a5f',
                      fontSize: '0.72rem', marginBottom: 14, marginTop: 2,
                    }}>
                      {MESES_NOMBRES[mes]} {empleadoData.anio}
                    </div>

                    {/* Badge estado */}
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      background: disponible ? `${color.bg}` : 'rgba(30,41,59,0.5)',
                      border: `1px solid ${disponible ? color.border : 'rgba(30,41,59,0.3)'}`,
                      borderRadius: 20, padding: '3px 10px', marginBottom: 14,
                      fontSize: '0.71rem',
                      color: disponible ? color.accent : '#334155',
                      fontWeight: 700,
                    }}>
                      {disponible
                        ? <><FiCheckCircle size={11} /> Disponible</>
                        : <><FiXCircle size={11} /> Sin boleta</>
                      }
                    </div>

                    {/* Botón descargar */}
                    {disponible ? (
                      <button
                        onClick={() => handleDescargarMes(mes)}
                        disabled={descargando === mes}
                        style={{
                          width: '100%', padding: '8px 0',
                          background: descargando === mes
                            ? 'rgba(124,58,237,0.25)'
                            : `linear-gradient(135deg, ${color.accent}, ${color.accent}cc)`,
                          color: '#fff', border: 'none', borderRadius: 8,
                          fontSize: '0.8rem', fontWeight: 700,
                          cursor: descargando === mes ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          transition: 'opacity 0.2s',
                        }}
                        onMouseEnter={e => { if (descargando !== mes) e.currentTarget.style.opacity = '0.85'; }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                      >
                        {descargando === mes ? (
                          <>
                            <span style={{
                              display: 'inline-block', width: 12, height: 12,
                              border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
                              borderRadius: '50%', animation: 'spin 0.8s linear infinite',
                            }} />
                            Cargando...
                          </>
                        ) : (
                          <><FiDownload size={13} /> Descargar</>
                        )}
                      </button>
                    ) : (
                      <div style={{
                        width: '100%', padding: '8px 0',
                        background: 'rgba(30,41,59,0.4)', borderRadius: 8,
                        fontSize: '0.78rem', color: '#1e3a5f', fontWeight: 600,
                        userSelect: 'none',
                      }}>
                        No procesada
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : null}

          {/* Alerta sin boletas disponibles */}
          {empleadoData.total_disponibles === 0 && (
            <div style={{
              marginTop: 20, padding: '28px 24px',
              background: 'rgba(71,85,105,0.1)',
              border: '1px dashed rgba(71,85,105,0.3)',
              borderRadius: 14, textAlign: 'center', color: '#475569',
            }}>
              <FiPackage size={36} color="#334155" style={{ marginBottom: 10 }} />
              <div style={{ fontWeight: 700, color: '#64748b', fontSize: '0.95rem', marginBottom: 4 }}>
                Sin boletas disponibles
              </div>
              <div style={{ fontSize: '0.84rem' }}>
                Aún no hay boletas procesadas para el año {empleadoData.anio}.<br />
                Comunícate con el área de Recursos Humanos.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Link al sistema */}
      <div style={{ marginTop: 36, textAlign: 'center' }}>
        <a
          href="/login"
          style={{ color: '#334155', fontSize: '0.82rem', textDecoration: 'none', transition: 'color 0.15s' }}
          onMouseEnter={e => e.target.style.color = '#475569'}
          onMouseLeave={e => e.target.style.color = '#334155'}
        >
          ¿Eres administrador? Inicia sesión →
        </a>
      </div>

      {/* Spinner */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Modal Boleta */}
      {mostrarBoleta && boletaData && (
        <BoletaPago
          data={boletaData}
          onClose={() => setMostrarBoleta(false)}
        />
      )}
    </div>
  );
}

export default Visitante;
