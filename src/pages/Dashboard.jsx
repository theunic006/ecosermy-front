import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FiUsers, FiUserMinus, FiUserPlus, FiBriefcase,
  FiAlertTriangle, FiGift, FiDollarSign, FiTrendingUp, FiActivity,
} from 'react-icons/fi';
import { getDashboard, getRankingLeyendas, getPorUnidad, getRankingAmonestaciones } from '../services/catalogoService';
import { getMesNombre } from '../utils/helpers';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList,
  PieChart, Pie, Legend, LineChart, Line,
} from 'recharts';
import Loading from '../components/common/Loading';
import { useThemeColors } from '../utils/darkColors';

const COLORS = [
  '#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4',
  '#f97316','#84cc16','#ec4899','#14b8a6','#6366f1','#a855f7',
  '#0ea5e9','#22c55e','#eab308','#e11d48','#7c3aed','#059669',
];
const PIE_COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#ec4899'];
const fmt = (v) => Number(v).toLocaleString('es-PE');
const fmtMoney = (v) => `S/ ${Number(v).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const CustomPieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="dash-tooltip">
      <strong>{d.name}</strong>
      <span>{d.value} ({((d.value / d.payload.total) * 100).toFixed(1)}%)</span>
    </div>
  );
};

function PieCard({ title, data, icon }) {
  const total = data.reduce((s, d) => s + d.cantidad, 0);
  const chartData = data.map((d) => ({ ...d, name: d.nombre, value: d.cantidad, total }));
  return (
    <div className="dash-panel">
      <div className="dash-panel-header">{icon}<h3>{title}</h3></div>
      {data.length === 0 ? <p className="dash-empty">Sin datos</p> : (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={2}
              dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={false} style={{ fontSize: 11 }}>
              {chartData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
            </Pie>
            <Tooltip content={<CustomPieTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      )}
      <div className="dash-pie-legend">
        {data.map((d, i) => (
          <div key={i} className="dash-pie-legend-item">
            <span className="dash-pie-dot" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
            <span className="dash-pie-label">{d.nombre}</span>
            <span className="dash-pie-value">{d.cantidad}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isDark, c } = useThemeColors();

  /* Ranking leyendas: periodo seleccionado + datos */
  const [rankingPeriodoId, setRankingPeriodoId] = useState(null);
  const [rankingData, setRankingData] = useState([]);
  const [rankingLoading, setRankingLoading] = useState(false);

  /* Unidades: planilla seleccionada + datos */
  const [unidadPlanillaId, setUnidadPlanillaId] = useState(null);
  const [unidadData, setUnidadData] = useState([]);
  const [unidadLoading, setUnidadLoading] = useState(false);

  /* Ranking Amonestaciones */
  const [rankingAmon, setRankingAmon]           = useState([]);
  const [loadingRankingAmon, setLoadingRankingAmon] = useState(false);
  const [filtroAmonAnio, setFiltroAmonAnio]     = useState('');
  const [filtroAmonMes, setFiltroAmonMes]       = useState('');
  const [aniosAmon, setAniosAmon]               = useState([]);

  const fetchRankingAmon = useCallback(async (anio, mes) => {
    setLoadingRankingAmon(true);
    try {
      const res = await getRankingAmonestaciones({ anio, mes });
      setRankingAmon(res.data || []);
      if (res.anios?.length) setAniosAmon(res.anios);
    } catch (e) { console.error(e); }
    finally { setLoadingRankingAmon(false); }
  }, []);

  useEffect(() => {
    getDashboard().then((d) => {
      setData(d);
      // Datos iniciales del ranking
      if (d.ranking_leyendas?.length) setRankingData(d.ranking_leyendas);
      if (d.ranking_periodo_id) setRankingPeriodoId(d.ranking_periodo_id);
      // Datos iniciales de unidades
      if (d.por_unidad?.length) setUnidadData(d.por_unidad);
      if (d.planilla_id_unidad) setUnidadPlanillaId(d.planilla_id_unidad);
    }).catch(console.error).finally(() => setLoading(false));

    // Ranking amonestaciones
    fetchRankingAmon('', '');
  }, []);

  const fetchRanking = useCallback(async (pid) => {
    setRankingPeriodoId(pid);
    setRankingLoading(true);
    try {
      const res = await getRankingLeyendas(pid);
      setRankingData(res.data || []);
    } catch (e) { console.error(e); }
    finally { setRankingLoading(false); }
  }, []);

  const fetchUnidad = useCallback(async (planillaId) => {
    setUnidadPlanillaId(planillaId);
    setUnidadLoading(true);
    try {
      const res = await getPorUnidad(planillaId);
      setUnidadData(res.data || []);
    } catch (e) { console.error(e); }
    finally { setUnidadLoading(false); }
  }, []);

  const mesData = useMemo(() => {
    const map = {};
    (data?.cesados_por_mes || []).forEach(({ periodo, etiqueta, cantidad }) => {
      if (!map[periodo]) map[periodo] = { periodo, etiqueta, cesados: 0, nuevos: 0 };
      map[periodo].cesados = cantidad;
    });
    (data?.nuevos_por_mes || []).forEach(({ periodo, etiqueta, cantidad }) => {
      if (!map[periodo]) map[periodo] = { periodo, etiqueta, cesados: 0, nuevos: 0 };
      map[periodo].nuevos = cantidad;
    });
    return Object.values(map).sort((a, b) => a.periodo.localeCompare(b.periodo));
  }, [data]);

  if (loading) return <Loading />;

  const mesNombre = getMesNombre(data?.mes_actual);
  const anio = data?.anio_actual;

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Dashboard</h2>
        <span className="page-subtitle">{mesNombre} {anio}</span>
      </div>

      {/* KPI */}
      <div className="dash-kpi-grid">
        <div className="dash-kpi dash-kpi--blue">
          <div className="dash-kpi-icon"><FiUsers size={22} /></div>
          <div><h3>{fmt(data?.total_vigentes)}</h3><p>Personal Vigente</p></div>
        </div>
        <div className="dash-kpi dash-kpi--slate">
          <div className="dash-kpi-icon"><FiUsers size={22} /></div>
          <div><h3>{fmt(data?.total_cesados)}</h3><p>Total Cesados</p></div>
        </div>
        <div className="dash-kpi dash-kpi--red">
          <div className="dash-kpi-icon"><FiUserMinus size={22} /></div>
          <div><h3>{data?.cesados_mes ?? 0}</h3><p>Cesados {mesNombre}</p></div>
        </div>
        <div className="dash-kpi dash-kpi--green">
          <div className="dash-kpi-icon"><FiUserPlus size={22} /></div>
          <div><h3>{data?.nuevos_mes ?? 0}</h3><p>Nuevos {mesNombre}</p></div>
        </div>
        <div className="dash-kpi dash-kpi--amber">
          <div className="dash-kpi-icon"><FiAlertTriangle size={22} /></div>
          <div><h3>{data?.contratos_por_vencer ?? 0}</h3><p>Contratos x Vencer</p></div>
        </div>
        <div className="dash-kpi dash-kpi--purple">
          <div className="dash-kpi-icon"><FiGift size={22} /></div>
          <div><h3>{data?.cumpleanios?.length ?? 0}</h3><p>Cumpleanos del Mes</p></div>
        </div>
      </div>

      {/* Tarjetas por Unidad */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          <FiBriefcase size={18} color="#3b82f6" />
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: c.textPrimary }}>Personal Vigente por Unidad</h3>
          <span className="dash-panel-badge">{unidadData.length} unidades</span>
          {(data?.planillas_disponibles?.length > 0) && (
            <select
              value={unidadPlanillaId || ''}
              onChange={(e) => fetchUnidad(Number(e.target.value))}
              style={{
                marginLeft: 'auto', padding: '5px 10px', borderRadius: 6,
                border: `1px solid ${isDark ? '#475569' : '#cbd5e1'}`,
                background: isDark ? '#1e293b' : '#fff',
                color: c.textPrimary, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
              }}
            >
              {data.planillas_disponibles.map((p) => (
                <option key={p.id} value={p.id}>{p.etiqueta}</option>
              ))}
            </select>
          )}
        </div>
        {unidadLoading ? <p className="dash-empty">Cargando...</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {unidadData.map((u, idx) => {
            const unidadColor = COLORS[idx % COLORS.length];
            const maxCantidad   = Math.max(...unidadData.map(x => x.cantidad), 1);
            const maxPagado     = Math.max(...unidadData.map(x => x.total_pagado), 1);
            const maxOnp        = Math.max(...unidadData.map(x => x.onp), 1);
            const maxAfp        = Math.max(...unidadData.map(x => x.afp), 1);
            const barras = [
              { label: 'Cantidad Personal', value: u.cantidad,     max: maxCantidad, color: '#3b82f6', display: fmt(u.cantidad) },
              { label: 'Total Pagado',       value: u.total_pagado, max: maxPagado,   color: '#10b981', display: u.total_pagado > 0 ? fmtMoney(u.total_pagado) : '—' },
              { label: 'ONP',                value: u.onp,          max: maxOnp,      color: '#6366f1', display: fmt(u.onp) },
              { label: 'AFP',                value: u.afp,          max: maxAfp,      color: '#059669', display: fmt(u.afp) },
            ];
            return (
              <div key={idx} className="dash-panel" style={{ borderTop: `3px solid ${unidadColor}`, padding: '16px 18px' }}>
                {/* Header de la tarjeta */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: unidadColor, flexShrink: 0 }} />
                  <span style={{ fontWeight: 800, fontSize: '1rem', color: c.textPrimary, letterSpacing: '0.03em' }}>{u.nombre}</span>
                </div>
                {/* 4 barras */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                  {barras.map((b, bi) => {
                    const pct = b.max > 0 ? Math.max((b.value / b.max) * 100, b.value > 0 ? 4 : 0) : 0;
                    return (
                      <div key={bi}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                          <span style={{ fontSize: '0.74rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: c.textSecondary }}>{b.label}</span>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: b.color }}>{b.display}</span>
                        </div>
                        <div style={{ background: isDark ? '#1e293b' : '#f1f5f9', borderRadius: 6, height: 10, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, background: b.color, height: '100%', borderRadius: 6, transition: 'width 0.8s ease' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>

      {/* Ranking Leyendas + Movimiento de Personal — misma fila */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* Ranking Leyendas por Unidad */}
        <div className="dash-panel" style={{ margin: 0 }}>
          <div className="dash-panel-header" style={{ flexWrap: 'wrap', gap: 10 }}>
            <FiActivity size={18} />
            <h3 style={{ margin: 0 }}>Ranking de Leyendas por Unidad</h3>
            {(data?.periodos_disponibles?.length > 0) && (
              <select
                value={rankingPeriodoId || ''}
                onChange={(e) => fetchRanking(Number(e.target.value))}
                style={{
                  marginLeft: 'auto', padding: '5px 10px', borderRadius: 6,
                  border: `1px solid ${isDark ? '#475569' : '#cbd5e1'}`,
                  background: isDark ? '#1e293b' : '#fff',
                  color: c.textPrimary, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                }}
              >
                {data.periodos_disponibles.map((p) => (
                  <option key={p.id} value={p.id}>{p.etiqueta}</option>
                ))}
              </select>
            )}
          </div>
          {rankingLoading ? <p className="dash-empty">Cargando...</p>
           : rankingData.length === 0 ? <p className="dash-empty">Sin datos del periodo</p>
           : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={rankingData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="unidad" tick={{ fontSize: 12, fontWeight: 600 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} label={{ value: 'Días', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }} />
                <Tooltip content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0]?.payload;
                  if (!d) return null;
                  const items = [
                    { key: 'v', label: 'Vacaciones (V)', color: '#5538C7' },
                    { key: 'p', label: 'Permisos (P)', color: '#f59e0b' },
                    { key: 'r', label: 'Renuncias (R)', color: '#ef4444' },
                    { key: 'f', label: 'Faltas (F)', color: '#d32f2f' },
                    { key: 'dm', label: 'Desc. Médico (DM)', color: '#10b981' },
                  ];
                  return (
                    <div style={{ background: isDark ? '#1e293b' : '#fff', padding: '10px 14px', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,.15)', minWidth: 200 }}>
                      <strong style={{ color: c.textPrimary, fontSize: '0.9rem' }}>{label}</strong>
                      <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {items.map(({ key, label: lbl, color }) => (
                          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: '0.8rem' }}>
                            <span style={{ color }}>{lbl}</span>
                            <span style={{ color: c.textPrimary, fontWeight: 600 }}>
                              {key === 'r'
                                ? `${d[`${key}_personas`]} pers.`
                                : `${d[`${key}_dias`]} días · ${d[`${key}_personas`]} pers.`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="v_dias"  name="Vacaciones (V)"    fill="#5538C7" radius={[4,4,0,0]} />
                <Bar dataKey="p_dias"  name="Permisos (P)"      fill="#f59e0b" radius={[4,4,0,0]} />
                <Bar dataKey="r_dias"  name="Renuncias (R)"     fill="#ef4444" radius={[4,4,0,0]} />
                <Bar dataKey="f_dias"  name="Faltas (F)"        fill="#d32f2f" radius={[4,4,0,0]} />
                <Bar dataKey="dm_dias" name="Desc. Médico (DM)" fill="#10b981" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Movimiento de Personal por Mes */}
        <div className="dash-panel" style={{ margin: 0 }}>
          <div className="dash-panel-header">
            <FiTrendingUp size={18} />
            <h3>Movimiento de Personal — últimos 12 meses</h3>
          </div>
          {mesData.length === 0 ? (
            <p className="dash-empty">Sin datos</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mesData} margin={{ top: 16, right: 20, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="etiqueta" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.12)' }} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Bar dataKey="cesados" name="Cesados" fill="#ef4444" radius={[4,4,0,0]}>
                  <LabelList dataKey="cesados" position="top" style={{ fontSize: 11, fontWeight: 700, fill: '#ef4444' }} />
                </Bar>
                <Bar dataKey="nuevos" name="Nuevos" fill="#10b981" radius={[4,4,0,0]}>
                  <LabelList dataKey="nuevos" position="top" style={{ fontSize: 11, fontWeight: 700, fill: '#10b981' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>

      {/* Ranking Top 10 — Más Amonestaciones */}
      <div className="dash-panel dash-panel--full" style={{ marginBottom: 16 }}>
        <div className="dash-panel-header" style={{ flexWrap: 'wrap', gap: 10 }}>
          <FiAlertTriangle size={18} color="#b45309" />
          <h3 style={{ margin: 0 }}>Top 10 Personal con Mayor Número de Amonestaciones</h3>
          <span className="dash-panel-badge">{rankingAmon.length} personas</span>

          {/* Filtros compactos en una sola fila */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 0,
              border: `1px solid ${isDark ? '#475569' : '#cbd5e1'}`,
              borderRadius: 8, overflow: 'hidden',
              background: isDark ? '#0f172a' : '#f8fafc',
            }}>
              <select
                value={filtroAmonAnio}
                onChange={e => { setFiltroAmonAnio(e.target.value); fetchRankingAmon(e.target.value, filtroAmonMes); }}
                style={{
                  padding: '5px 10px', border: 'none', outline: 'none',
                  background: 'transparent', color: c.textPrimary,
                  fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                  width: 110,
                }}
              >
                <option value="">Año</option>
                {aniosAmon.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <span style={{ width: 1, height: 20, background: isDark ? '#334155' : '#cbd5e1', flexShrink: 0 }} />
              <select
                value={filtroAmonMes}
                onChange={e => { setFiltroAmonMes(e.target.value); fetchRankingAmon(filtroAmonAnio, e.target.value); }}
                style={{
                  padding: '5px 10px', border: 'none', outline: 'none',
                  background: 'transparent', color: c.textPrimary,
                  fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                  width: 120,
                }}
              >
                <option value="">Mes</option>
                {['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'].map((m, i) => (
                  <option key={i+1} value={i+1}>{m}</option>
                ))}
              </select>
            </div>
            {(filtroAmonAnio || filtroAmonMes) && (
              <button
                onClick={() => { setFiltroAmonAnio(''); setFiltroAmonMes(''); fetchRankingAmon('', ''); }}
                title="Limpiar filtros"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 28, height: 28,
                  background: isDark ? 'rgba(239,68,68,.15)' : '#fee2e2',
                  color: '#dc2626', border: 'none', borderRadius: 6,
                  cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem',
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>
        {loadingRankingAmon ? (
          <p className="dash-empty">Cargando...</p>
        ) : rankingAmon.length === 0 ? (
          <p className="dash-empty">📋 Sin amonestaciones registradas</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
            {/* Gráfico de barras horizontales apiladas */}
            <div style={{ overflowX: 'auto' }}>
              <div style={{ minWidth: 380 }}>
                <ResponsiveContainer width="100%" height={Math.max(260, rankingAmon.length * 42)}>
                  <BarChart
                    data={[...rankingAmon].reverse()}
                    layout="vertical"
                    margin={{ top: 4, right: 50, left: 170, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis
                      type="category"
                      dataKey="nombre"
                      tick={{ fontSize: 10.5, fontWeight: 600 }}
                      width={165}
                      tickFormatter={(v) => v.length > 24 ? v.substring(0, 23) + '…' : v}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.12)', fontSize: '0.82rem' }}
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0]?.payload;
                        return (
                          <div style={{ background: isDark ? '#1e293b' : '#fff', padding: '10px 14px', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,.15)', minWidth: 210 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: c.textPrimary, marginBottom: 6 }}>{label}</div>
                            <div style={{ fontSize: '0.78rem', color: c.textMuted, marginBottom: 8 }}>{d?.area} · {d?.cargo}</div>
                            {[{key:'verbal',label:'Verbal',color:'#f59e0b'},{key:'escrita',label:'Escrita',color:'#dc2626'},{key:'suspension',label:'Suspensión',color:'#7c3aed'},{key:'otros',label:'Otros',color:'#64748b'}].map(t => (
                              d?.[t.key] > 0 && (
                                <div key={t.key} style={{ display:'flex', justifyContent:'space-between', gap:16 }}>
                                  <span style={{ color: t.color, fontWeight: 600 }}>{t.label}</span>
                                  <span style={{ fontWeight: 700, color: c.textPrimary }}>{d[t.key]}</span>
                                </div>
                              )
                            ))}
                            <div style={{ borderTop: `1px solid ${isDark?'rgba(255,255,255,.1)':'#e2e8f0'}`, marginTop:6, paddingTop:6, display:'flex', justifyContent:'space-between' }}>
                              <span style={{ fontWeight:700, color: c.textPrimary }}>Total</span>
                              <span style={{ fontWeight:800, color:'#b45309', fontSize:'1rem' }}>{d?.total}</span>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="verbal"     name="Verbal"     stackId="a" fill="#f59e0b" radius={[0,0,0,0]}>
                      <LabelList dataKey="verbal" position="insideRight" style={{ fontSize: 10, fill: '#fff', fontWeight: 700 }} formatter={v => v > 0 ? v : ''} />
                    </Bar>
                    <Bar dataKey="escrita"    name="Escrita"    stackId="a" fill="#dc2626" radius={[0,0,0,0]} />
                    <Bar dataKey="suspension" name="Suspensión" stackId="a" fill="#7c3aed" radius={[0,0,0,0]} />
                    <Bar dataKey="otros"      name="Otros"      stackId="a" fill="#64748b" radius={[0,4,4,0]}>
                      <LabelList dataKey="total" position="right" style={{ fontSize: 11, fontWeight: 800, fill: isDark ? '#e2e8f0' : '#1e293b' }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tabla de detalle */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: c.tableHeaderBg, color: isDark ? '#c4ccdb' : '#fff' }}>
                    {['#', 'Empleado', 'Área', 'V', 'E', 'S', 'O', 'Total'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: h === '#' || h === 'V' || h === 'E' || h === 'S' || h === 'O' || h === 'Total' ? 'center' : 'left', fontWeight: 700, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rankingAmon.map((r, idx) => (
                    <tr key={idx} style={{ background: idx % 2 === 0 ? c.tableRowEven : c.tableRowOdd, borderBottom: `1px solid ${c.borderSubtle}` }}>
                      <td style={{ padding: '7px 10px', textAlign: 'center', fontWeight: 700, color: idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : c.textMuted }}>
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                      </td>
                      <td style={{ padding: '7px 10px' }}>
                        <div style={{ fontWeight: 700, color: c.textPrimary }}>{r.nombre}</div>
                        <div style={{ fontSize: '0.72rem', color: c.textMuted }}>{r.cargo}</div>
                      </td>
                      <td style={{ padding: '7px 10px', color: c.textMuted, fontSize: '0.75rem' }}>{r.area}</td>
                      {[{k:'verbal',c:'#f59e0b'},{k:'escrita',c:'#dc2626'},{k:'suspension',c:'#7c3aed'},{k:'otros',c:'#64748b'}].map(t => (
                        <td key={t.k} style={{ padding: '7px 10px', textAlign: 'center', fontWeight: r[t.k] > 0 ? 700 : 400, color: r[t.k] > 0 ? t.c : c.textMuted }}>
                          {r[t.k] > 0 ? r[t.k] : '—'}
                        </td>
                      ))}
                      <td style={{ padding: '7px 10px', textAlign: 'center', fontWeight: 800, fontSize: '1rem', color: '#b45309' }}>{r.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: 8, fontSize: '0.72rem', color: c.textMuted, textAlign: 'right' }}>
                V=Verbal · E=Escrita · S=Suspensión · O=Otros
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Personal por Cargo */}
      <div className="dash-panel dash-panel--full">
        <div className="dash-panel-header">
          <FiBriefcase size={18} />
          <h3>Personal Vigente por Cargo (Top 20)</h3>
          <span className="dash-panel-badge">{data?.por_cargo?.length ?? 0} cargos</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 500 }}>
            <ResponsiveContainer width="100%" height={Math.max(300, (data?.por_cargo?.length || 1) * 32)}>
              <BarChart data={data?.por_cargo || []} layout="vertical" margin={{ top: 5, right: 40, left: 160, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="nombre" tick={{ fontSize: 11 }} width={155} />
                <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.1)' }} formatter={(v) => [v, 'Personas']} />
                <Bar dataKey="cantidad" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={20}>
                  <LabelList dataKey="cantidad" position="right" style={{ fontSize: 12, fontWeight: 700, fill: '#1e293b' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Pie charts */}
      <div className="dash-pie-row">
        <PieCard title="Por Categoria" data={data?.por_categoria || []} icon={<FiUsers size={18} />} />
        <PieCard title="Por Sexo" data={data?.por_sexo || []} icon={<FiUsers size={18} />} />
        <PieCard title="Por Tipo Contrato" data={data?.por_tipo_contrato || []} icon={<FiBriefcase size={18} />} />
      </div>

      {/* Sistema Pension + Evolucion */}
      <div className="dash-bottom-row">
        <PieCard title="Por Sistema de Pension" data={data?.por_sistema_pension || []} icon={<FiDollarSign size={18} />} />
        {(data?.evolucion_planilla?.length > 0) && (
          <div className="dash-panel dash-panel--grow">
            <div className="dash-panel-header">
              <FiTrendingUp size={18} />
              <h3>Evolucion de Planilla</h3>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.evolucion_planilla} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="periodo" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `S/${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => [fmtMoney(v), 'Neto']}
                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.1)' }} />
                <Line type="monotone" dataKey="total_neto" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Neto" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Cumpleanios */}
      {(data?.cumpleanios?.length > 0) && (
        <div className="dash-panel dash-panel--full">
          <div className="dash-panel-header">
            <FiGift size={18} />
            <h3>Cumpleanios en {mesNombre}</h3>
            <span className="dash-panel-badge">{data.cumpleanios.length} colaboradores</span>
          </div>
          <div className="dash-birthday-grid">
            {data.cumpleanios.map((cu, i) => (
              <div key={i} className="dash-birthday-card">
                <span className="dash-birthday-day">{cu.dia}</span>
                <div>
                  <span className="dash-birthday-name">{cu.nombre}</span>
                  <span className="dash-birthday-cargo">{cu.cargo}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;