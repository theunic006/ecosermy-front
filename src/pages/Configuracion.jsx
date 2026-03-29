import { useState, useEffect } from 'react';
import { FiSave, FiRefreshCw } from 'react-icons/fi';
import api from '../services/api';
import Loading from '../components/common/Loading';
import { formatMoney } from '../utils/helpers';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';

function Configuracion() {
  const { hasPermission } = useAuth();
  const [configs, setConfigs] = useState([]);
  const [afps, setAfps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('general');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [confRes, afpRes] = await Promise.all([
        api.get('/configuracion'),
        api.get('/configuracion/afps'),
      ]);
      setConfigs(confRes.data || []);
      setAfps(afpRes.data || []);
    } catch (error) {
      toast.error('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (key, value) => {
    setConfigs(configs.map(c => c.clave === key ? { ...c, valor: value } : c));
  };

  const handleAfpChange = (id, field, value) => {
    setAfps(afps.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const handleSaveConfigs = async () => {
    setSaving(true);
    try {
      const data = {};
      configs.forEach(c => { data[c.clave] = c.valor; });
      await api.put('/configuracion', data);
      toast.success('Configuración guardada');
    } catch (error) {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAfp = async (afp) => {
    try {
      await api.put(`/configuracion/afps/${afp.id}`, {
        comision_flujo: parseFloat(afp.comision_flujo),
        comision_mixta: parseFloat(afp.comision_mixta),
        prima_seguro: parseFloat(afp.prima_seguro),
        aporte_obligatorio: parseFloat(afp.aporte_obligatorio),
      });
      toast.success(`AFP ${afp.nombre} actualizada`);
    } catch (error) {
      toast.error('Error al guardar AFP');
    }
  };

  const configLabels = {
    rmv: 'Remuneración Mínima Vital (S/)',
    uit: 'Unidad Impositiva Tributaria (S/)',
    onp_porcentaje: 'ONP - Porcentaje (%)',
    essalud_porcentaje: 'EsSalud - Porcentaje (%)',
    asignacion_familiar_porcentaje: 'Asignación Familiar (% de RMV)',
    empresa_nombre: 'Nombre de la Empresa',
    empresa_ruc: 'RUC de la Empresa',
    empresa_direccion: 'Dirección de la Empresa',
  };

  if (loading) return <Loading />;

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Configuración del Sistema</h2>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${tab === 'general' ? 'active' : ''}`} onClick={() => setTab('general')}>
          Parámetros Generales
        </button>
        <button className={`tab ${tab === 'afps' ? 'active' : ''}`} onClick={() => setTab('afps')}>
          AFPs
        </button>
      </div>

      {/* Tab General */}
      {tab === 'general' && (
        <div className="card">
          <div className="config-list">
            {configs.map(config => (
              <div key={config.clave} className="config-item">
                <label>{configLabels[config.clave] || config.clave}</label>
                <input
                  type={['rmv', 'uit', 'onp_porcentaje', 'essalud_porcentaje', 'asignacion_familiar_porcentaje'].includes(config.clave) ? 'number' : 'text'}
                  className="form-input"
                  value={config.valor}
                  onChange={(e) => handleConfigChange(config.clave, e.target.value)}
                  step="0.01"
                  disabled={!hasPermission('configuracion.editar')}
                />
                {config.descripcion && <small className="config-desc">{config.descripcion}</small>}
              </div>
            ))}
          </div>
          {hasPermission('configuracion.editar') && (
            <div className="form-actions">
              <button className="btn-primary" onClick={handleSaveConfigs} disabled={saving}>
                <FiSave size={16} /> {saving ? 'Guardando...' : 'Guardar Configuración'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab AFPs */}
      {tab === 'afps' && (
        <div className="card">
          <div className="afp-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>AFP</th>
                  <th>Comisión Flujo (%)</th>
                  <th>Comisión Mixta (%)</th>
                  <th>Prima Seguro (%)</th>
                  <th>Aporte Obligatorio (%)</th>
                  <th>Total (%)</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {afps.map(afp => (
                  <tr key={afp.id}>
                    <td><strong>{afp.nombre}</strong></td>
                    <td>
                      <input type="number" className="form-input-sm" step="0.01"
                        value={afp.comision_flujo} onChange={(e) => handleAfpChange(afp.id, 'comision_flujo', e.target.value)} />
                    </td>
                    <td>
                      <input type="number" className="form-input-sm" step="0.01"
                        value={afp.comision_mixta} onChange={(e) => handleAfpChange(afp.id, 'comision_mixta', e.target.value)} />
                    </td>
                    <td>
                      <input type="number" className="form-input-sm" step="0.01"
                        value={afp.prima_seguro} onChange={(e) => handleAfpChange(afp.id, 'prima_seguro', e.target.value)} />
                    </td>
                    <td>
                      <input type="number" className="form-input-sm" step="0.01"
                        value={afp.aporte_obligatorio} onChange={(e) => handleAfpChange(afp.id, 'aporte_obligatorio', e.target.value)} />
                    </td>
                    <td>
                      <strong>
                        {(parseFloat(afp.comision_flujo || 0) + parseFloat(afp.prima_seguro || 0) + parseFloat(afp.aporte_obligatorio || 0)).toFixed(2)}%
                      </strong>
                    </td>
                    <td>
                      <button className="btn-sm btn-primary" onClick={() => handleSaveAfp(afp)}>
                        <FiSave size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Configuracion;
