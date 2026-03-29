import { useRef, useState } from 'react';
import html2pdf from 'html2pdf.js';
import { toast } from 'react-toastify';
import '../styles/boleta.css';
import logoImg from '../public/img/logo_ecosermy.png';
import firmaImg from '../public/img/firma.png';

const formatMoney = (value) => {
  const num = parseFloat(value) || 0;
  return num.toFixed(2);
};

function BoletaCopia({ data, tipo }) {
  const { empresa, periodo, empleado, asistencia, ingresos, descuentos, aportes_empleador, resumen } = data;

  // Definir orden y etiquetas fijas según la imagen
  const conceptosIngresosFijos = [
    'REMUNERACIÓN O JORNAL BÁSICO',
    'REMUNERACIÓN VACACIONAL',
    'VACACIONES PAGADAS',
    'ASIGNACIÓN FAMILIAR',
    'TRABAJO DÍA FERIADO',
    'TRABAJO DÍAS LIBRES',
    'TRABAJO MEDIO DÍA',
    'HORAS EXTRAS',
    'BONO REGULAR',
    'BONO POR PRODUCTIVIDAD',
    'ALIMENTACION',
    'MOVILIDAD',
  ];

  const conceptosDescuentosFijos = [
    'RENTA QUINTA CATEGORÍA RETENCIONES',
    'SISTEMA NAC. DE PENSIONES DL 19990',
    'COMISIÓN AFP PORCENTUAL',
    'SPP - APORTACIÓN OBLIGATORIA',
    'SEGURO',
    'DÍAS NO TRABAJADOS',
    'FALTAS',
    'SUSPENSIONES',
    'OTROS DESCUENTOS'
  ];

  const conceptosAportesFijos = [
    'PÓLIZA DE SEGURO - D. LEG. 688',
    'ESSALUD (REGULAR) TRAB',
    'SCTR SALUD',
    'SCTR PENSIÓN',
    'VIDA LEY'
  ];

  // Busca el item en la lista con matching robusto (multi-palabra)
  const findItem = (lista, nombre) => {
    // Intento 1: búsqueda exacta
    let item = lista.find(i => i.concepto &&
      i.concepto.toUpperCase().trim() === nombre.toUpperCase().trim()
    );
    if (item) return item;
    // Intento 2: búsqueda por las primeras 2 palabras significativas
    const palabras = nombre.toUpperCase().split(' ').filter(p => p.length > 3).slice(0, 2);
    item = lista.find(i => {
      if (!i.concepto) return false;
      const c = i.concepto.toUpperCase();
      return palabras.every(p => c.includes(p));
    });
    return item || null;
  };

  // Si el item existe en data → mostrar su valor (incluyendo 0.00)
  // Si NO existe en data → mostrar '' (vacío)
  const GetMonto = (lista, nombre) => {
    const item = findItem(lista, nombre);
    return item !== null ? formatMoney(item.monto) : '';
  };

  // Mostrar check ► solo cuando el valor es mayor que 0
  const ShowCheck = (lista, nombre) => {
    const item = findItem(lista, nombre);
    return item !== null && parseFloat(item.monto) > 0;
  };

  // Filas del cuadro principal (12 ingresos + 9 descuentos + 5 aportes)
  const TOTAL_FILAS = 13;

  const filasRender = Array.from({ length: TOTAL_FILAS }, (_, i) => ({
    ingreso: {
      label: i < conceptosIngresosFijos.length ? conceptosIngresosFijos[i] : (i < TOTAL_FILAS ? '-' : ''),
      monto: i < conceptosIngresosFijos.length ? GetMonto(ingresos, conceptosIngresosFijos[i]) : '',
      check: i < conceptosIngresosFijos.length && ShowCheck(ingresos, conceptosIngresosFijos[i]),
    },
    descuento: {
      label: i < conceptosDescuentosFijos.length ? conceptosDescuentosFijos[i] : '',
      monto: i < conceptosDescuentosFijos.length ? GetMonto(descuentos, conceptosDescuentosFijos[i]) : '',
      check: i < conceptosDescuentosFijos.length && ShowCheck(descuentos, conceptosDescuentosFijos[i]),
    },
    aporte: {
      label: i < conceptosAportesFijos.length ? conceptosAportesFijos[i] : '',
      monto: i < conceptosAportesFijos.length ? GetMonto(aportes_empleador, conceptosAportesFijos[i]) : '',
    },
  }));

  return (
    <div className="boleta-copia">

      {/* ===== ENCABEZADO ===== */}
      <table className="boleta-table boleta-no-margin" style={{ border: 'none' }}>
        <tbody>
          <tr>
            <td className="boleta-titulo-cell" style={{ border: 'none' }}>
              <div className="boleta-titulo-inner">
                <strong className="boleta-titulo-text">BOLETA DE PAGO</strong>
                <div className="boleta-subtitulo">ART. 19 DEL DECRETO SUPREMO N° 001-98-TR DEL 22-01-98</div>
                <div className="boleta-periodo">{periodo.texto}</div>
              </div>
            </td>
            <td className="boleta-logo-cell" style={{ border: 'none' }}>
              <img src={logoImg} alt="Ecosermy Yauli" className="boleta-logo-img" />
            </td>
          </tr>
        </tbody>
      </table>

      {/* ===== DATOS DE LA EMPRESA ===== */}
      <table className="boleta-table boleta-no-margin">
        <tbody>
          <tr>
            <td colSpan="3" className="boleta-section-header">DATOS DE LA EMPRESA:</td>
          </tr>
          <tr>
            <td className="boleta-col-label" width="15%">RUC</td>
            <td className="boleta-col-label" width="45%">RAZON SOCIAL</td>
            <td className="boleta-col-label" width="40%">DIRECCIÓN</td>
          </tr>
          <tr>
            <td className="boleta-value boleta-center">20516385813</td>
            <td className="boleta-value boleta-center">EMPRESA COMUNAL DE SERVICIOS MULTIPLES YAULI</td>
            <td className="boleta-value boleta-center">AV. LADISLAO ESPINAR S/N YAULI - YAULI - JUNIN</td>
          </tr>
        </tbody>
      </table>

      {/* ===== DATOS DEL TRABAJADOR ===== */}
      <table className="boleta-table boleta-no-margin">
        <tbody>
          <tr>
            <td colSpan="6" className="boleta-section-header">DATOS DEL TRABAJADOR:</td>
          </tr>
          <tr>
            <td className="boleta-col-label" width="11%">CÓDIGO</td>
            <td className="boleta-col-label" width="20%">NOMBRES</td>
            <td className="boleta-col-label" width="20%">APELLIDOS</td>
            <td className="boleta-col-label" width="6%">D.N.I.</td>
            <td className="boleta-col-label" width="9%">SITUACION</td>
            <td className="boleta-col-label" width="33%">DIRECCIÓN</td>
          </tr>
          <tr>
            <td className="boleta-value boleta-codigo">{empleado.codigo}</td>
            <td className="boleta-value boleta-center">{empleado.nombres}</td>
            <td className="boleta-value boleta-center">{empleado.apellidos}</td>
            <td className="boleta-value boleta-center">{empleado.dni}</td>
            <td className="boleta-value boleta-center">{empleado.situacion}</td>
            <td className="boleta-value boleta-center">{empleado.direccion}</td>
          </tr>
        </tbody>
      </table>

      {/* ===== DATOS DEL TRABAJADOR VINCULADOS A LA RELACIÓN LABORAL ===== */}
      <table className="boleta-table boleta-no-margin">
        <tbody>
          <tr>
            <td colSpan="6" className="boleta-section-header">DATOS DEL TRABAJADOR VINCULADOS A LA RELACION LABORAL:</td>
          </tr>
          <tr>
            <td className="boleta-col-label" width="36%">CARGO</td>
            <td className="boleta-col-label" width="10%">CATEGORIA</td>
            <td className="boleta-col-label" width="10%">SUELDO</td>
            <td className="boleta-col-label" width="16%">REGIMEN PENSIONARIO</td>
            <td className="boleta-col-label" width="16%">C.U.S.P.P.</td>
            <td className="boleta-col-label" width="12%">FECHA DE INGRESO</td>
          </tr>
          <tr>
            <td className="boleta-value">{empleado.cargo}</td>
            <td className="boleta-value boleta-center">{empleado.categoria || '-'}</td>
            <td className="boleta-value boleta-center">{formatMoney(empleado.sueldo_base)}</td>
            <td className="boleta-value boleta-center">{empleado.sistema_pensiones}</td>
            <td className="boleta-value boleta-center">{empleado.cuspp || '-'}</td>
            <td className="boleta-value boleta-center">{empleado.fecha_ingreso}</td>
          </tr>
        </tbody>
      </table>

      {/* ===== SECCIÓN COMBINADA: DÍAS + BANCO ===== */}
      <table className="boleta-table boleta-no-margin">
        <tbody>
          <tr>
            {/* BLOQUE IZQUIERDO: Días y Motivo Suspensión */}
            <td style={{ padding: 0, verticalAlign: 'top', width: '72%' }}>
              <table className="boleta-inner-table">
                <tbody>
                  {/* Cabeceras días */}
                  <tr>
                    <td className="boleta-col-label boleta-center" width="20%">DIAS LABORADOS</td>
                    <td className="boleta-col-label boleta-center" width="20%">DIAS NO LABORADOS</td>
                    <td className="boleta-col-label boleta-center" width="20%">DIAS SUBSIDIADOS</td>
                    <td className="boleta-col-label boleta-center" width="24%">JORNADA ORDINARIA
                    </td>
                    <td className="boleta-col-label boleta-center" width="16%">CONDICION</td>
                  </tr>
                  {/* Valores días */}
                  <tr>
                    <td className="boleta-value boleta-center">{asistencia.dias_trabajados}</td>
                    <td className="boleta-value boleta-center">{Math.round(asistencia.dias_no_laborados)}</td>
                    <td className="boleta-value boleta-center">-</td>
                    <td className="boleta-value boleta-center">48 H</td>
                    <td className="boleta-value boleta-center">Domiciliado</td>
                  </tr>
                  {/* MOTIVO SUSPENSIÓN */}
                  <tr>
                    <td colSpan="5" className="boleta-section-header-sm">Motivo de Suspensión de Labores</td>
                  </tr>
                  <tr>
                    <td className="boleta-col-label boleta-center" colSpan="2">TIPO</td>
                    <td className="boleta-col-label boleta-center" colSpan="2">MOTIVO</td>
                    <td className="boleta-col-label boleta-center">N° DIAS</td>
                  </tr>
                  <tr>
                    <td className="boleta-value boleta-center" colSpan="2">-</td>
                    <td className="boleta-value boleta-center" colSpan="2">-</td>
                    <td className="boleta-value boleta-center">-</td>
                  </tr>
                  <tr>
                    <td className="boleta-value boleta-center" colSpan="2">-</td>
                    <td className="boleta-value boleta-center" colSpan="2">-</td>
                    <td className="boleta-value boleta-center">-</td>
                  </tr>
                </tbody>
              </table>
            </td>
            {/* BLOQUE DERECHO: Datos bancarios */}
            <td style={{ padding: 0, verticalAlign: 'top', width: '28%' }}>
              <table className="boleta-inner-table" style={{ height: '100%' }}>
                <tbody>
                  <tr>
                    <td className="boleta-col-label boleta-center" colSpan="2">CTA AHORRO DE DEPÓSITO</td>
                  </tr>
                  <tr>
                    <td className="boleta-value boleta-center" colSpan="2">{empleado.cuenta_bancaria || '-'}</td>
                  </tr>
                  <tr>
                    <td className="boleta-col-label boleta-center" colSpan="2">ENTIDAD BANCARIA</td>
                  </tr>
                  <tr>
                    <td className="boleta-value boleta-center" colSpan="2">{empleado.banco || '-'}</td>
                  </tr>
                  <tr>
                    <td className="boleta-col-label boleta-center" colSpan="2">UNIDAD DE TRABAJO</td>
                  </tr>
                  <tr>
                    <td className="boleta-value boleta-center" colSpan="2">{empleado.unidad || empleado.area}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ===== CUADRO PRINCIPAL - 3 COLUMNAS ===== */}
      <table className="boleta-table boleta-no-margin boleta-main-table">
        <colgroup>
          <col style={{ width: '24.4%' }} />
          <col style={{ width: '8.6%' }} />
          <col style={{ width: '25.2%' }} />
          <col style={{ width: '8.8%' }} />
          <col style={{ width: '24.4%' }} />
          <col style={{ width: '8.6%' }} />
        </colgroup>
        <thead>
          <tr>
            <th className="boleta-main-header" colSpan="2">REMUNERACIONES</th>
            <th className="boleta-main-header" colSpan="2">RETENCIONES / DESCUENTOS</th>
            <th className="boleta-main-header" colSpan="2">APORTACIONES DEL EMPLEADOR</th>
          </tr>
        </thead>
        <tbody>
          {filasRender.map((fila, i) => (
            <tr key={i}>
              {/* REMUNERACIONES */}
              <td className="boleta-concepto">
                <div className="boleta-concepto-inner">
                  <span>{fila.ingreso.label}</span>
                </div>
              </td>
              <td className="boleta-monto">{fila.ingreso.monto}</td>

              {/* RETENCIONES / DESCUENTOS */}
              <td className="boleta-concepto">
                <div className="boleta-concepto-inner">
                  <span>{fila.descuento.label}</span>
                </div>
              </td>
              <td className="boleta-monto">{fila.descuento.monto}</td>

              {/* APORTACIONES */}
              <td className="boleta-concepto">
                <div className="boleta-concepto-inner">
                  <span>{fila.aporte.label}</span>
                </div>
              </td>
              <td className="boleta-monto">{fila.aporte.monto}</td>
            </tr>
          ))}
          
          {/* Fila totales + neto */}
          <tr className="boleta-totales-row">
            <td className="boleta-total-label">Total Remuneraciones</td>
            <td className="boleta-total-monto">{formatMoney(resumen.total_ingresos)}</td>
            <td className="boleta-total-label">Total Descuentos</td>
            <td className="boleta-total-monto">{formatMoney(resumen.total_descuentos)}</td>
            <td className="boleta-total-label">Neto a Pagar</td>
            <td className="boleta-total-monto boleta-neto-val">S/ {formatMoney(resumen.neto_pagar)}</td>
          </tr>
        </tbody>
      </table>

      {/* ===== FIRMAS ===== */}
      <div className="boleta-firmas">
        {/* EMPLEADOR */}
        <div className="boleta-firma-empleador">
          <img src={firmaImg} alt="Firma" className="boleta-firma-img" />
          <div className="boleta-firma-linea"></div>
          <div className="boleta-firma-texto">EMPLEADOR</div>
        </div>
        {/* TRABAJADOR */}
        <div className="boleta-firma-trabajador">
          <div className="boleta-firma-espacio"></div>
          <div className="boleta-firma-linea"></div>
          <div className="boleta-firma-texto">TRABAJADOR</div>
        </div>
      </div>

      {/* Marca tipo */}
      <div className="boleta-tipo-marca">{tipo}</div>
    </div>
  );
}

function BoletaPago({ data, onClose }) {
  const printRef = useRef();
  const [generando, setGenerando] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const getNombreArchivo = () => {
    const apellidos = data?.empleado?.apellidos?.replace(/\s+/g, '_') || 'empleado';
    const periodo = data?.periodo?.texto?.replace(/\s+/g, '_') || 'boleta';
    return `boleta_${apellidos}_${periodo}.pdf`;
  };

  const generarBlob = () => {
    const elemento = printRef.current;
    const opciones = {
      margin: [4, 4, 4, 4],
      filename: getNombreArchivo(),
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };
    return html2pdf().set(opciones).from(elemento).outputPdf('blob');
  };

  const handleDescargar = async () => {
    if (generando) return;
    setGenerando(true);
    try {
      const elemento = printRef.current;
      const opciones = {
        margin: [4, 4, 4, 4],
        filename: getNombreArchivo(),
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      };
      await html2pdf().set(opciones).from(elemento).save();
    } catch (err) {
      toast.error('Error al generar el PDF');
    } finally {
      setGenerando(false);
    }
  };

  const handleEmail = async () => {
    const email = data?.empleado?.email || '';
    if (!email) {
      toast.warning('El empleado no tiene correo electrónico registrado');
      return;
    }
    setGenerando(true);
    try {
      // Descargar PDF
      const pdfBlob = await generarBlob();
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = getNombreArchivo();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const asunto = `Boleta de Pago - ${data.empleado.apellidos} ${data.empleado.nombres} - ${data.periodo.texto}`;
      const cuerpo =
        `Estimado/a ${data.empleado.nombres} ${data.empleado.apellidos},\n\n` +
        `ECOSERMY S.A.C. le hace llegar su Boleta de Pago correspondiente al período ${data.periodo.texto}.\n\n` +
        `RESUMEN:\n` +
        `  Total Ingresos:    S/ ${parseFloat(data.resumen?.total_ingresos || 0).toFixed(2)}\n` +
        `  Total Descuentos: S/ ${parseFloat(data.resumen?.total_descuentos || 0).toFixed(2)}\n` +
        `  Neto a Pagar:     S/ ${parseFloat(data.resumen?.neto_pagar || 0).toFixed(2)}\n\n` +
        `Adjunto encontrará el documento PDF con el detalle completo.\n\n` +
        `Ante cualquier consulta, comuníquese con el área de Recursos Humanos.\n\n` +
        `Atentamente,\nECOSERMY S.A.C.`;

      setTimeout(() => {
        window.location.href = `mailto:${email}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
        toast.info('📎 PDF descargado. Adjúntalo al correo que se abrió en Outlook.');
      }, 600);
    } catch (err) {
      toast.error('Error al generar el PDF');
    } finally {
      setGenerando(false);
    }
  };

  const handleWhatsApp = async () => {
    const celular = data?.empleado?.celular || '';
    if (!celular) {
      toast.warning('El empleado no tiene número de celular registrado');
      return;
    }
    const numLimpio = celular.replace(/\D/g, '');
    const numCompleto = numLimpio.startsWith('51') ? numLimpio : `51${numLimpio}`;
    const mensaje =
      `*ECOSERMY S.A.C.* le hace llegar su Boleta de Pago.\n\n` +
      `👤 Trabajador: *${data.empleado.nombres} ${data.empleado.apellidos}*\n` +
      `📅 Período: *${data.periodo.texto}*\n\n` +
      `💰 Ingresos:    S/ ${parseFloat(data.resumen?.total_ingresos || 0).toFixed(2)}\n` +
      `➖ Descuentos: S/ ${parseFloat(data.resumen?.total_descuentos || 0).toFixed(2)}\n` +
      `✅ *Neto a Pagar: S/ ${parseFloat(data.resumen?.neto_pagar || 0).toFixed(2)}*\n\n` +
      `📄 Se adjunta el documento en PDF con el detalle completo de su boleta.\n` +
      `Ante cualquier consulta, comuníquese con el área de Recursos Humanos.`;

    setGenerando(true);
    try {
      const pdfBlob = await generarBlob();
      const archivo = new File([pdfBlob], getNombreArchivo(), { type: 'application/pdf' });

      // MÓVIL: Web Share API — comparte el PDF directamente a WhatsApp
      if (navigator.canShare && navigator.canShare({ files: [archivo] })) {
        await navigator.share({ files: [archivo], title: 'Boleta de Pago', text: mensaje });
        return;
      }

      // DESKTOP: descargar PDF + abrir WhatsApp Web con el mensaje
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = getNombreArchivo();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setTimeout(() => {
        window.open(`https://wa.me/${numCompleto}?text=${encodeURIComponent(mensaje)}`, '_blank');
      }, 500);

      toast.info('📎 El PDF se descargó. En WhatsApp Web haz clic en 📎 para adjuntarlo y luego envía el mensaje.');
    } catch (err) {
      if (err.name !== 'AbortError') toast.error('Error al generar el PDF');
    } finally {
      setGenerando(false);
    }
  };

  if (!data) return null;

  return (
    <div className="boleta-modal-overlay">
      <div className="boleta-modal-container">
        {/* Barra de acciones - solo pantalla */}
        <div className="boleta-actions no-print">
          <button className="btn-primary" onClick={handlePrint} disabled={generando}>
            🖨️ Imprimir Boleta
          </button>
          <button className="btn-success" onClick={handleDescargar} disabled={generando}>
            {generando ? '⏳ Generando...' : '📥 Descargar PDF'}
          </button>
          <button className="btn-email" onClick={handleEmail} disabled={generando}>
            {generando ? '⏳ Generando...' : `📧 Enviar por Correo${data?.empleado?.email ? ' (' + data.empleado.email + ')' : ''}`}
          </button>
          <button className="btn-whatsapp" onClick={handleWhatsApp} disabled={generando}>
            {generando ? '⏳ Generando...' : `💬 WhatsApp ${data?.empleado?.celular ? '+51' + data.empleado.celular.replace(/\D/g, '') : 'Sin número'}`}
          </button>
          <button className="btn-secondary" onClick={onClose} disabled={generando}>
            Cerrar
          </button>
        </div>

        {/* Contenido imprimible */}
        <div className="boleta-print-area" ref={printRef}>
          {/* COPIA 1 - ORIGINAL */}
          <BoletaCopia data={data}/>

          {/* Separador solo impresión */}
          <div className="boleta-separador-print">
          
          </div>

          {/* COPIA 2 - COPIA (solo se ve al imprimir) */}
          <div className="boleta-copia-print">
            <BoletaCopia data={data}/>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BoletaPago;
