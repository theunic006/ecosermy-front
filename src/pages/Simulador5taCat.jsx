import { useState, useEffect } from 'react';
import { FiDollarSign, FiPercent, FiCalendar, FiActivity, FiSettings } from 'react-icons/fi';
import { formatMoney, getMesNombre } from '../utils/helpers';
import api from '../services/api';
import { toast } from 'react-toastify';
import { useThemeColors } from '../utils/darkColors';

function Simulador5taCat() {
  const { isDark, c } = useThemeColors();
  const hoy = new Date();
  const [form, setForm] = useState({
    sueldo_base: '',
    asig_familiar: '0',
    bono_regular: '0',
    mes: hoy.getMonth() + 1,
    anio: hoy.getFullYear(),
    meses_trabajados: hoy.getMonth() + 1,
    uit: '',
  });
  const [uitDefault, setUitDefault] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);

  // Cargar UIT al montar y cuando cambie el año
  useEffect(() => {
    const cargarUIT = async () => {
      try {
        const { data } = await api.get(`/quinta-categoria/${form.anio}`);
        const uitVal = parseFloat(data.uit);
        setUitDefault(uitVal);
        setForm(prev => ({ ...prev, uit: uitVal.toString() }));
      } catch {
        setUitDefault(null);
        setForm(prev => ({ ...prev, uit: '' }));
      }
    };
    cargarUIT();
  }, [form.anio]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSimular = async (e) => {
    e.preventDefault();
    if (!form.sueldo_base || parseFloat(form.sueldo_base) <= 0) {
      toast.error('Ingrese un sueldo base válido');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        sueldo_base: parseFloat(form.sueldo_base),
        asig_familiar: parseFloat(form.asig_familiar || 0),
        bono_regular: parseFloat(form.bono_regular || 0),
        mes: parseInt(form.mes),
        anio: parseInt(form.anio),
        meses_trabajados: parseInt(form.meses_trabajados),
      };
      // Solo enviar uit_custom si el usuario cambió el valor
      const uitIngresada = parseFloat(form.uit || 0);
      if (uitIngresada > 0 && uitIngresada !== uitDefault) {
        payload.uit_custom = uitIngresada;
      }
      const { data } = await api.post('/quinta-categoria/simular', payload);
      setResultado(data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al simular');
    } finally {
      setLoading(false);
    }
  };

  const handleLimpiar = () => {
    setForm({
      sueldo_base: '',
      asig_familiar: '0',
      bono_regular: '0',
      mes: hoy.getMonth() + 1,
      anio: hoy.getFullYear(),
      meses_trabajados: hoy.getMonth() + 1,
      uit: uitDefault ? uitDefault.toString() : '',
    });
    setResultado(null);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2><FiPercent style={{ marginRight: 8 }} /> Simulador de Renta de 5ta Categoría</h2>
        <p style={{ color: c.textSecondary, marginTop: 4 }}>
          Calcula la retención mensual del Impuesto a la Renta de 5ta Categoría según la legislación peruana vigente
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Panel de inputs */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiDollarSign /> Datos del Trabajador
          </h3>
          <form onSubmit={handleSimular}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label">Sueldo Base (S/.) *</label>
                <input
                  type="number"
                  name="sueldo_base"
                  className="form-control"
                  value={form.sueldo_base}
                  onChange={handleChange}
                  placeholder="Ej: 3500"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="form-label">Asignación Familiar (S/.)</label>
                <input
                  type="number"
                  name="asig_familiar"
                  className="form-control"
                  value={form.asig_familiar}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                />
              </div>
              <div>
                <label className="form-label">Bono Regular (S/.)</label>
                <input
                  type="number"
                  name="bono_regular"
                  className="form-control"
                  value={form.bono_regular}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Mes</label>
                  <select name="mes" className="form-control" value={form.mes} onChange={handleChange}>
                    {[...Array(12)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>{getMesNombre(i + 1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Año</label>
                  <input
                    type="number"
                    name="anio"
                    className="form-control"
                    value={form.anio}
                    onChange={handleChange}
                    min="2020"
                    max="2030"
                  />
                </div>
              </div>
              <div>
                <label className="form-label">Meses trabajados en el año</label>
                <input
                  type="number"
                  name="meses_trabajados"
                  className="form-control"
                  value={form.meses_trabajados}
                  onChange={handleChange}
                  min="1"
                  max="12"
                />
                <small style={{ color: c.textMuted, fontSize: '12px' }}>
                  Meses que lleva trabajando en el año actual
                </small>
              </div>
              <div>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FiSettings size={14} /> UIT {form.anio} (S/.)
                </label>
                <input
                  type="number"
                  name="uit"
                  className="form-control"
                  value={form.uit}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  placeholder={uitDefault ? `Por defecto: ${uitDefault}` : 'Sin configuración'}
                  style={{
                    borderColor: uitDefault && parseFloat(form.uit) !== uitDefault ? '#f59e0b' : undefined,
                    background: uitDefault && parseFloat(form.uit) !== uitDefault ? (isDark ? 'rgba(251,191,36,.1)' : '#fffbeb') : undefined,
                  }}
                />
                {uitDefault && parseFloat(form.uit) !== uitDefault && (
                  <small style={{ color: '#f59e0b', fontSize: '12px', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    ⚠️ Valor personalizado (BD: S/. {uitDefault.toFixed(2)})
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, uit: uitDefault.toString() }))}
                      style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline', padding: 0 }}
                    >
                      Restaurar
                    </button>
                  </small>
                )}
                {!uitDefault && (
                  <small style={{ color: '#ef4444', fontSize: '12px' }}>
                    No hay UIT configurada para {form.anio}
                  </small>
                )}
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={loading}>
                  {loading ? 'Calculando...' : '📊 Simular'}
                </button>
                <button type="button" className="btn-secondary" onClick={handleLimpiar}>
                  Limpiar
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Panel de resultados */}
        <div>
          {!resultado && !loading && (
            <div className="card" style={{ padding: '48px', textAlign: 'center', color: c.textMuted }}>
              <FiActivity size={48} style={{ margin: '0 auto 16px', display: 'block' }} />
              <h3>Ingrese los datos y presione "Simular"</h3>
              <p style={{ marginTop: 8 }}>
                Se calculará la retención mensual de 5ta categoría según el Art. 40° del Reglamento de la Ley del IR
              </p>
            </div>
          )}

          {resultado && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Resultado principal */}
              <div className="card" style={{
                padding: '24px',
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                color: 'white',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '14px', opacity: 0.9, marginBottom: 4 }}>RETENCIÓN MENSUAL DE 5TA CATEGORÍA</p>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '700', margin: '8px 0' }}>
                  S/. {resultado.resultado.retencion_mensual.toFixed(2)}
                </h1>
                <p style={{ fontSize: '13px', opacity: 0.85 }}>
                  {getMesNombre(resultado.datos_ingresados.mes)} {resultado.configuracion.anio} — Divisor: ÷{resultado.resultado.divisor_mes}
                </p>
              </div>

              {/* Datos de configuración */}
              <div className="card" style={{ padding: '20px' }}>
                <h4 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FiCalendar /> Parámetros del Cálculo
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div style={{ textAlign: 'center', padding: '12px', background: isDark ? 'rgba(148,163,184,.04)' : '#f0f9ff', borderRadius: '8px' }}>
                    <p style={{ color: c.textSecondary, fontSize: '12px' }}>UIT {resultado.configuracion.anio}</p>
                    <strong style={{ fontSize: '1.1rem' }}>S/. {resultado.configuracion.uit.toFixed(2)}</strong>
                  </div>
                  <div style={{ textAlign: 'center', padding: '12px', background: isDark ? 'rgba(148,163,184,.04)' : '#f0f9ff', borderRadius: '8px' }}>
                    <p style={{ color: c.textSecondary, fontSize: '12px' }}>Deducción 7 UIT</p>
                    <strong style={{ fontSize: '1.1rem' }}>S/. {resultado.configuracion.deduccion_7uit.toFixed(2)}</strong>
                  </div>
                  <div style={{ textAlign: 'center', padding: '12px', background: isDark ? 'rgba(148,163,184,.04)' : '#f0f9ff', borderRadius: '8px' }}>
                    <p style={{ color: c.textSecondary, fontSize: '12px' }}>Rem. Mensual</p>
                    <strong style={{ fontSize: '1.1rem' }}>S/. {resultado.datos_ingresados.rem_mensual.toFixed(2)}</strong>
                  </div>
                </div>
              </div>

              {/* Desglose del cálculo */}
              <div className="card" style={{ padding: '20px' }}>
                <h4 style={{ marginBottom: '16px' }}>📋 Desglose de la Renta Anual Proyectada</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr style={{ borderBottom: `1px solid ${c.borderSubtle}` }}>
                      <td style={{ padding: '10px 0', color: c.textSecondary }}>Rem. Bruta Acumulada ({resultado.datos_ingresados.meses_trabajados - 1} meses anteriores)</td>
                      <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: '500' }}>{formatMoney(resultado.calculo.rem_bruta_acumulada)}</td>
                    </tr>
                    <tr style={{ borderBottom: `1px solid ${c.borderSubtle}` }}>
                      <td style={{ padding: '10px 0', color: c.textSecondary }}>Proyección ({resultado.calculo.meses_restantes} meses restantes × S/.{resultado.calculo.rem_bruta_mes_actual.toFixed(2)})</td>
                      <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: '500' }}>{formatMoney(resultado.calculo.proyeccion_restante)}</td>
                    </tr>
                    <tr style={{ borderBottom: `1px solid ${c.borderSubtle}` }}>
                      <td style={{ padding: '10px 0', color: c.textSecondary }}>Gratificación Julio</td>
                      <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: '500' }}>{formatMoney(resultado.calculo.grat_julio)}</td>
                    </tr>
                    <tr style={{ borderBottom: `1px solid ${c.borderSubtle}` }}>
                      <td style={{ padding: '10px 0', color: c.textSecondary }}>Gratificación Diciembre</td>
                      <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: '500' }}>{formatMoney(resultado.calculo.grat_diciembre)}</td>
                    </tr>
                    <tr style={{ borderBottom: '2px solid #3b82f6', background: isDark ? 'rgba(99,102,241,.08)' : '#f0f9ff' }}>
                      <td style={{ padding: '10px 0', fontWeight: '700', color: '#1e40af' }}>= Renta Anual Proyectada</td>
                      <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: '700', color: '#1e40af' }}>{formatMoney(resultado.calculo.renta_anual_proyectada)}</td>
                    </tr>
                    <tr style={{ borderBottom: `1px solid ${c.borderSubtle}` }}>
                      <td style={{ padding: '10px 0', color: '#dc2626' }}>( − ) Deducción 7 UIT</td>
                      <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: '500', color: '#dc2626' }}>- {formatMoney(resultado.calculo.deduccion_7uit)}</td>
                    </tr>
                    <tr style={{ background: resultado.calculo.renta_neta > 0 ? (isDark ? 'rgba(248,113,113,.1)' : '#fef2f2') : (isDark ? 'rgba(52,211,153,.1)' : '#f0fdf4'), borderBottom: '2px solid' }}>
                      <td style={{ padding: '12px 0', fontWeight: '700', fontSize: '1.05rem' }}>= Renta Neta Anual</td>
                      <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: '700', fontSize: '1.05rem', color: resultado.calculo.renta_neta > 0 ? '#dc2626' : '#059669' }}>
                        {formatMoney(resultado.calculo.renta_neta)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {resultado.calculo.renta_neta <= 0 && (
                  <div style={{ marginTop: '16px', padding: '12px', background: isDark ? 'rgba(52,211,153,.1)' : '#f0fdf4', border: isDark ? '1px solid rgba(52,211,153,.2)' : '1px solid #bbf7d0', borderRadius: '8px', color: isDark ? '#6ee7b7' : '#166534' }}>
                    ✅ La Renta Neta es negativa o cero. <strong>No se aplica retención de 5ta Categoría.</strong>
                  </div>
                )}
              </div>

              {/* Tabla de tramos */}
              {resultado.calculo.renta_neta > 0 && (
                <div className="card" style={{ padding: '20px' }}>
                  <h4 style={{ marginBottom: '16px' }}>📊 Impuesto por Tramos Progresivos</h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: `2px solid ${c.borderSubtle}`, fontSize: '13px', color: c.textSecondary }}>
                        <th style={{ padding: '8px 4px', textAlign: 'left' }}>Tramo</th>
                        <th style={{ padding: '8px 4px', textAlign: 'center' }}>Rango (UIT)</th>
                        <th style={{ padding: '8px 4px', textAlign: 'center' }}>Rango (S/.)</th>
                        <th style={{ padding: '8px 4px', textAlign: 'center' }}>Tasa</th>
                        <th style={{ padding: '8px 4px', textAlign: 'right' }}>Monto Afecto</th>
                        <th style={{ padding: '8px 4px', textAlign: 'right' }}>Impuesto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultado.tramos.map((tramo, i) => (
                        <tr key={i} style={{
                          borderBottom: `1px solid ${c.borderSubtle}`,
                          background: tramo.monto_afecto > 0 ? (isDark ? 'rgba(251,191,36,.1)' : '#fffbeb') : 'transparent',
                          opacity: tramo.monto_afecto > 0 ? 1 : 0.5
                        }}>
                          <td style={{ padding: '10px 4px' }}>Tramo {tramo.tramo}</td>
                          <td style={{ padding: '10px 4px', textAlign: 'center' }}>
                            {tramo.desde_uit} - {tramo.hasta_uit ?? '∞'} UIT
                          </td>
                          <td style={{ padding: '10px 4px', textAlign: 'center', fontSize: '13px' }}>
                            {formatMoney(tramo.desde_soles)} - {tramo.hasta_soles ? formatMoney(tramo.hasta_soles) : '∞'}
                          </td>
                          <td style={{ padding: '10px 4px', textAlign: 'center', fontWeight: '600', color: '#7c3aed' }}>{tramo.tasa}%</td>
                          <td style={{ padding: '10px 4px', textAlign: 'right', fontWeight: '500' }}>{formatMoney(tramo.monto_afecto)}</td>
                          <td style={{ padding: '10px 4px', textAlign: 'right', fontWeight: '600', color: '#dc2626' }}>{formatMoney(tramo.impuesto)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ borderTop: '2px solid #1e40af', background: isDark ? 'rgba(99,102,241,.08)' : '#eff6ff' }}>
                        <td colSpan={4} style={{ padding: '12px 4px', fontWeight: '700', color: '#1e40af' }}>IMPUESTO ANUAL TOTAL</td>
                        <td style={{ padding: '12px 4px', textAlign: 'right' }}></td>
                        <td style={{ padding: '12px 4px', textAlign: 'right', fontWeight: '700', color: '#1e40af', fontSize: '1.1rem' }}>
                          {formatMoney(resultado.resultado.impuesto_anual)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>

                  {/* Cálculo de retención mensual */}
                  <div style={{ marginTop: '20px', padding: '16px', background: isDark ? 'rgba(148,163,184,.04)' : '#f8fafc', borderRadius: '8px', border: `1px solid ${c.borderSubtle}` }}>
                    <h5 style={{ marginBottom: '12px' }}>Cálculo de Retención Mensual</h5>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center', fontSize: '1.1rem' }}>
                      <span style={{ fontWeight: '500' }}>{formatMoney(resultado.resultado.impuesto_anual)}</span>
                      <span style={{ color: c.textSecondary }}>÷</span>
                      <span style={{ fontWeight: '500' }}>{resultado.resultado.divisor_mes}</span>
                      <span style={{ color: c.textSecondary }}>=</span>
                      <span style={{ fontWeight: '700', color: '#059669', fontSize: '1.3rem' }}>
                        S/. {resultado.resultado.retencion_mensual.toFixed(2)}
                      </span>
                    </div>
                    <p style={{ textAlign: 'center', marginTop: '8px', fontSize: '12px', color: c.textMuted }}>
                      Divisor según Art. 40° del Reglamento de la Ley del IR — {getMesNombre(resultado.datos_ingresados.mes)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Simulador5taCat;
