import { useState, useEffect, useRef } from 'react';
import { FiUpload, FiDownload, FiEye, FiTrash2, FiFile } from 'react-icons/fi';
import { formatMoney, formatDate } from '../../utils/helpers';
import { listarDocumentos, subirDocumento, descargarDocumento, verDocumento, eliminarDocumento, TIPOS_DOCUMENTO } from '../../services/documentoService';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';

function EmpleadoDetail({ empleado }) {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('empleados.editar');

  // ── Documentos ──────────────────────────────────────────────────
  const [documentos, setDocumentos]       = useState([]);
  const [loadingDocs, setLoadingDocs]     = useState(false);
  const [subiendoDocs, setSubiendoDocs]   = useState(false);
  const [formDoc, setFormDoc]             = useState({ tipo: 'asignacion_familiar', nombre: '' });
  const fileInputRef                      = useRef(null);

  useEffect(() => {
    if (empleado?.id) cargarDocumentos();
  }, [empleado?.id]);

  const cargarDocumentos = async () => {
    setLoadingDocs(true);
    try {
      const data = await listarDocumentos(empleado.id);
      setDocumentos(data);
    } catch { /* silencioso */ }
    finally { setLoadingDocs(false); }
  };

  const handleSubir = async (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    if (!formDoc.nombre.trim()) {
      toast.error('Escribe un nombre descriptivo antes de subir');
      return;
    }
    setSubiendoDocs(true);
    try {
      await subirDocumento(empleado.id, archivo, formDoc.tipo, formDoc.nombre.trim());
      toast.success('Documento subido correctamente');
      setFormDoc(f => ({ ...f, nombre: '' }));
      if (fileInputRef.current) fileInputRef.current.value = '';
      cargarDocumentos();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al subir el documento');
    } finally {
      setSubiendoDocs(false);
    }
  };

  const handleEliminar = async (doc) => {
    if (!confirm(`¿Eliminar "${doc.nombre}"?`)) return;
    try {
      await eliminarDocumento(doc.id);
      toast.success('Documento eliminado');
      cargarDocumentos();
    } catch {
      toast.error('Error al eliminar el documento');
    }
  };
  // ────────────────────────────────────────────────────────────────
  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return '-';
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad + ' años';
  };

  const InfoRow = ({ label, value }) => (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value || '-'}</span>
    </div>
  );

  return (
    <div className="empleado-detail">
      <div className="detail-section">
        <h4>Datos Personales</h4>
        <div className="detail-grid">
          <InfoRow label="Código" value={empleado.codigo_trabajador} />
          <InfoRow label="DNI" value={empleado.dni} />
          <InfoRow label="Apellidos" value={empleado.apellidos} />
          <InfoRow label="Nombres" value={empleado.nombres} />
          <InfoRow label="Fecha Nacimiento" value={formatDate(empleado.fecha_nacimiento)} />
          <InfoRow label="Edad" value={calcularEdad(empleado.fecha_nacimiento)} />
          <InfoRow label="Grado Instrucción" value={empleado.grado_instruccion} />
          <InfoRow label="Sexo" value={empleado.sexo === 'M' ? 'Masculino' : 'Femenino'} />
          <InfoRow label="Estado Civil" value={empleado.estado_civil} />
          <InfoRow label="Dirección" value={empleado.direccion} />
          <InfoRow label="País" value={empleado.pais} />
          <InfoRow label="Departamento" value={empleado.departamento} />
          <InfoRow label="Provincia" value={empleado.provincia} />
          <InfoRow label="Distrito" value={empleado.distrito} />
          <InfoRow label="Celular" value={empleado.celular} />
          <InfoRow label="Email" value={empleado.email} />
        </div>
      </div>

      <div className="detail-section">
        <h4>Datos Laborales</h4>
        <div className="detail-grid">
          <InfoRow label="Área" value={empleado.area?.nombre} />
          <InfoRow label="Unidad" value={empleado.unidad} />
          <InfoRow label="Cargo" value={empleado.cargo?.nombre} />
          <InfoRow label="Categoría" value={empleado.categoria} />
          <InfoRow label="Turno" value={empleado.turno?.nombre} />
          <InfoRow label="Fecha Ingreso" value={formatDate(empleado.fecha_ingreso)} />
          <InfoRow label="Situación" value={empleado.situacion_contractual} />
          <InfoRow label="Tipo Contrato" value={empleado.tipo_contrato} />
          <InfoRow label="Sueldo Base" value={formatMoney(empleado.sueldo_base)} />
          <InfoRow label="Contrato Desde" value={formatDate(empleado.contrato_inicio)} />
          <InfoRow label="Contrato Hasta" value={empleado.contrato_fin ? formatDate(empleado.contrato_fin) : <span style={{ color: '#22c55e', fontWeight: 600 }}>ESTABLE</span>} />
          <InfoRow label="Bono Regular" value={formatMoney(empleado.bono_regular)} />
          {empleado.concepto && (
            <InfoRow label="Concepto" value={empleado.concepto} />
          )}
          {empleado.situacion_contractual === 'CESADO' && (
            <>
              <InfoRow label="Fecha Cese" value={formatDate(empleado.fecha_cese)} />
              <InfoRow label="Motivo Cese" value={empleado.motivo_cese} />
            </>
          )}
        </div>
      </div>

      <div className="detail-section">
        <h4>Sistema de Pensiones y Beneficios</h4>
        <div className="detail-grid">
          <InfoRow label="Sistema Pensión" value={`${empleado.sistema_pension?.nombre || '-'}${empleado.sistema_pension?.porcentaje ? ` (${empleado.sistema_pension.porcentaje}%)` : ''}`} />
          <InfoRow label="CUSPP" value={empleado.cuspp || '-'} />
          <InfoRow label="Banco" value={empleado.banco} />
          <InfoRow label="Cuenta Bancaria" value={empleado.cuenta_bancaria} />
          <InfoRow label="CCI" value={empleado.cci} />
          <InfoRow label="Asig. Familiar" value={empleado.tiene_asignacion_familiar ? 'Sí' : 'No'} />
          {empleado.tiene_asignacion_familiar && (
            <>
              <InfoRow label="Valor Asig. Familiar" value={formatMoney(empleado.val_asig_familiar)} />
              <InfoRow label="N° Hijos" value={empleado.numero_hijos} />
            </>
          )}
          <InfoRow
            label="EsSalud +Vida"
            value={empleado.essalud_vida
              ? `Sí — S/. ${parseFloat(empleado.val_essalud_vida || 5).toFixed(2)}`
              : 'No'}
          />
        </div>
      </div>

      {/* ── Sección Documentos ─────────────────────────────────── */}
      <div className="detail-section">
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FiFile size={16} /> Documentos PDF
        </h4>

        {/* Formulario de subida */}
        {canEdit && (
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'flex-end',
            background: 'var(--bg-secondary)', borderRadius: '8px',
            padding: '12px', marginBottom: '12px',
          }}>
            <div style={{ flex: '1 1 140px' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Tipo</label>
              <select
                className="form-select"
                style={{ fontSize: '0.82rem', padding: '5px 8px' }}
                value={formDoc.tipo}
                onChange={e => setFormDoc(f => ({ ...f, tipo: e.target.value }))}
              >
                {TIPOS_DOCUMENTO.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: '2 1 180px' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Descripción</label>
              <input
                type="text"
                className="form-input"
                style={{ fontSize: '0.82rem', padding: '5px 8px' }}
                placeholder="Ej: Acta de nacimiento hijo Juan"
                value={formDoc.nombre}
                onChange={e => setFormDoc(f => ({ ...f, nombre: e.target.value }))}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Archivo PDF</label>
              <label style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '6px 14px', borderRadius: '6px', cursor: subiendoDocs ? 'not-allowed' : 'pointer',
                background: subiendoDocs ? '#6b7280' : 'var(--accent)',
                color: '#fff', fontSize: '0.82rem', fontWeight: 600,
                opacity: subiendoDocs ? 0.7 : 1,
              }}>
                <FiUpload size={14} />
                {subiendoDocs ? 'Subiendo...' : 'Seleccionar PDF'}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  style={{ display: 'none' }}
                  disabled={subiendoDocs}
                  onChange={handleSubir}
                />
              </label>
            </div>
          </div>
        )}

        {/* Lista de documentos */}
        {loadingDocs ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Cargando documentos...</p>
        ) : documentos.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontStyle: 'italic' }}>
            No hay documentos subidos para este empleado.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {documentos.map(doc => (
              <div key={doc.id} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 12px', borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-tertiary)',
              }}>
                <FiFile size={16} style={{ color: '#dc2626', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {doc.nombre}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {doc.tipo_label} · {doc.tamano_formateado} · {doc.created_at}
                    {doc.subido_por && ` · por ${doc.subido_por}`}
                  </div>
                </div>
                <button
                  title="Ver en navegador"
                  onClick={() => verDocumento(doc.id)}
                  style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: '5px', padding: '4px 7px', cursor: 'pointer', color: 'var(--accent)' }}
                >
                  <FiEye size={14} />
                </button>
                <button
                  title="Descargar"
                  onClick={() => descargarDocumento(doc.id, doc.nombre_original)}
                  style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: '5px', padding: '4px 7px', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <FiDownload size={14} />
                </button>
                {canEdit && (
                  <button
                    title="Eliminar"
                    onClick={() => handleEliminar(doc)}
                    style={{ background: 'none', border: '1px solid #fca5a5', borderRadius: '5px', padding: '4px 7px', cursor: 'pointer', color: '#dc2626' }}
                  >
                    <FiTrash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {/* ─────────────────────────────────────────────────────────── */}

    </div>
  );
}

export default EmpleadoDetail;
