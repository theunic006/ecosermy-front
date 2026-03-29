/**
 * Plantilla de Contrato de Trabajo — ECOSERMY
 * Genera HTML completo de 10 páginas para conversión a PDF/Word
 */
import { montoALetrasFormato } from './numberToWords';
import { LOGO_ECOSERMY } from './logoBase64';

// ── Helpers ─────────────────────────────────────────────────────────────

function formatFecha(fecha) {
  if (!fecha) return '_______________';
  const f = String(fecha).substring(0, 10);
  const d = new Date(f + 'T00:00:00');
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return `${d.getDate()} de ${meses[d.getMonth()]} del ${d.getFullYear()}`;
}

function formatFechaCorta(fecha) {
  if (!fecha) return '___/___/______';
  const f = String(fecha).substring(0, 10);
  const d = new Date(f + 'T00:00:00');
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
}

// ── Encabezado de página ────────────────────────────────────────────────

function encabezado(pagina, total = 11) {
  return `
  <table style="width:100%; border-collapse:collapse; border:2px solid #000; margin-bottom:16px; table-layout:fixed; font-family: Calibri, Arial, Helvetica, sans-serif;">
    <colgroup>
      <col style="width:26%">
      <col style="width:43%">
      <col style="width:12%">
      <col style="width:19%">
    </colgroup>
    <tr>
      <td rowspan="4" style="border:1px solid #000; text-align:center; padding:2px 3px; vertical-align:middle; background:#fff;">
        <img src="${LOGO_ECOSERMY}" alt="ECOSERMY" style="max-width:120px; max-height:45px; display:block; margin:0 auto 3px auto;">
        <div style="font-size:6.5pt; font-weight:bold; text-transform:uppercase; letter-spacing:0.2px; color:#000;">SISTEMA DE GESTIÓN INTEGRADO</div>
      </td>
      <td style="border:1.5px solid #000; text-align:center; padding:3px 4px; vertical-align:middle; background:#374151;">
        <div style="color:#fff; font-size:9.5pt; font-weight:bold; letter-spacing:2px; text-transform:uppercase;">FORMATO</div>
      </td>
      <td style="border:1px solid #000; padding:2px 6px; font-size:8pt; font-weight:400; vertical-align:middle;">Código</td>
      <td style="border:1px solid #000; padding:2px 6px; font-size:8pt; font-weight:bold; color:#1a6fa8; text-align:center; vertical-align:middle;">ECO-FT-RH 26.01</td>
    </tr>
    <tr>
      <td rowspan="3" style="border:1.5px solid #000; text-align:center; padding:2px 6px; vertical-align:middle; background:#fff;">
        <div style="color:#000; font-size:13pt; font-weight:bold; line-height:1.2;">CONTRATO DE TRABAJO</div>
        <div style="color:#000; font-size:10pt; font-weight:bold; line-height:1.2;">SUJETO A MODALIDAD¹</div>
        <div style="color:#000; font-size:9pt; font-weight:bold; line-height:1.2; margin-top:1px;">CONTRATO POR SERVICIO ESPECIFICO</div>
      </td>
      <td style="border:1px solid #000; padding:2px 6px; font-size:8pt; font-weight:400; vertical-align:middle;">Revisión</td>
      <td style="border:1px solid #000; padding:2px 6px; font-size:8pt; font-weight:bold; color:#1a6fa8; text-align:center; vertical-align:middle;">V02</td>
    </tr>
    <tr>
      <td style="border:1px solid #000; padding:2px 6px; font-size:8pt; font-weight:400; vertical-align:middle;">Área</td>
      <td style="border:1px solid #000; padding:2px 6px; font-size:8pt; font-weight:bold; color:#1a6fa8; text-align:center; vertical-align:middle;">Corporativo</td>
    </tr>
    <tr>
      <td style="border:1px solid #000; padding:2px 6px; font-size:8pt; font-weight:400; vertical-align:middle;">Paginas</td>
      <td style="border:1px solid #000; padding:2px 6px; font-size:8pt; font-weight:bold; color:#1a6fa8; text-align:center; vertical-align:middle;">Página ${pagina} de ${total}</td>
    </tr>
  </table>`;
}

// ── Bloque de firmas ────────────────────────────────────────────────────

function firmas(nombre, dni) {
  return `
  <table style="width:100%; margin-top:60px;">
    <tr>
      <td style="width:45%; text-align:center; padding-top:40px; border-top:1px solid #000; vertical-align:top;">
        <strong>JUAN FRANCISCO BERNALDO SABUCO</strong><br/>
        D.N.I. 04019887<br/>
        EL EMPLEADOR
      </td>
      <td style="width:10%;"></td>
      <td style="width:45%; text-align:center; padding-top:40px; border-top:1px solid #000; vertical-align:top;">
        <strong>${nombre}</strong><br/>
        D.N.I. N° ${dni}<br/>
        EL TRABAJADOR
      </td>
    </tr>
  </table>`;
}

function firmaSoloTrabajador(nombre, dni) {
  return `
  <div style="text-align:center; margin-top:60px;">
    <div style="width:250px; margin:0 auto; border-top:1px solid #000; padding-top:10px;">
      <strong>${nombre}</strong><br/>
      D.N.I. N° ${dni}<br/>
      EL TRABAJADOR
    </div>
  </div>`;
}

// ── ESTILOS GLOBALES ────────────────────────────────────────────────────

const estilos = `
<style>
  @page { size: A4; margin: 15mm 20mm 15mm 25mm; }
  * { box-sizing: border-box; }
  body, html { margin:0; padding:0; }
  .contrato-page {
    font-family: 'Times New Roman', Times, serif;
    font-size: 11pt;
    line-height: 1.5;
    color: #000;
    text-align: justify;
    min-height: 267mm;
    page-break-after: always;
    padding: 0;
  }
  .contrato-page:last-child { page-break-after: auto; }
  .contrato-page p {
    margin: 0 0 10px 0;
  }
  .contrato-page h2 {
    text-align: center; font-size: 12pt; margin: 12px 0 12px; text-decoration: underline; font-weight: bold;
  }
  .contrato-page h3 {
    text-align: center; font-size: 11pt; margin: 10px 0 6px; text-decoration: underline;
  }
  .clausula { font-weight: bold; text-decoration: underline; margin: 16px 0 8px; font-size: 11pt; }
  .indent { padding-left: 20px; }
  .bold { font-weight: bold; }
  .center { text-align: center; }
  .highlight {
    font-weight: bold;
  }
  ul.contrato-list { margin: 6px 0; padding-left: 30px; }
  ul.contrato-list li { margin-bottom: 4px; }
  ol.sst-list { margin: 4px 0; padding-left: 20px; }
  ol.sst-list li { margin-bottom: 5px; text-align: justify; }
</style>`;

// ── PÁGINAS 1-4: CONTRATO PRINCIPAL ─────────────────────────────────────

function paginasContrato(d) {
  const fechaFirma = '31 de marzo del 2026';
  const sueldoLetras = montoALetrasFormato(d.sueldo_base);

  // ── PÁGINA 1: Título + Cláusulas 1-2 ──────────────────────────────────
  const pag1 = `
  <div class="contrato-page">
    ${encabezado(1)}
    <h2>CONTRATO DE TRABAJO SUJETO A MODALIDAD POR SERVICIO ESPECÍFICO Y<br/>OBRA DETERMINADA</h2>
    <p style="text-indent:30px; margin-top: 15px;">Conste por el presente documento, el contrato de trabajo celebrado de una parte por la <strong>EMPRESA COMUNAL DE SERVICIOS MÚLTIPLES YAULI – ECOSERMY</strong>, con R.U.C. N° 20516385813, con domicilio fiscal en Av. Ladislao Espinar S/N Sec. Yauli (frente a la piscina natural), Yauli – Junín, debidamente representada por su <u>Presidente</u> el <strong>Sr. Juan Francisco BERNALDO SABUCO</strong> con DNI N° 04019887, a quien en lo sucesivo se le denominará <strong>EL EMPLEADOR</strong>; y de la otra parte el Sr(a). <span class="highlight">${d.nombre_completo}</span>, identificado con DNI: <span class="highlight">${d.dni}</span>, con domicilio en <span class="highlight">${d.direccion}</span>, con <span class="highlight">${d.codigo_trabajador}</span>, a quien en adelante se le denominará <strong>EL TRABAJADOR</strong>; bajo el régimen de la Ley General de Comunidades Campesinas – Ley N°24656, el Decreto Supremo N°003-97-TR (Texto Único Ordenado de la Ley de Productividad y Competitividad Laboral - LPCL) y normas complementarias, en los términos y condiciones siguientes:</p>

    <p class="clausula">CLÁUSULA PRIMERA: ANTECEDENTES Y NATURALEZA JURÍDICA</p>
    <p><strong>EL EMPLEADOR</strong> es una empresa de régimen comunal, regulada por la Ley General de Comunidades Campesinas, especializada en servicios de contratista minero y obras civiles, que desarrolla múltiples frentes de trabajo, tanto bajo la modalidad de tercerización para empresas mineras como para la ejecución de obras y servicios propios.</p>
    <p><strong>EL TRABAJADOR</strong> declara bajo juramento ser persona idónea, calificada y con amplia experiencia para el puesto de <span class="highlight">${d.cargo}</span>, asumiendo la veracidad de toda la información y documentación presentada. La falsedad de la misma constituirá causal de resolución contractual inmediata, sin perjuicio de las acciones legales a que hubiere lugar.</p>

    <p class="clausula">CLÁUSULA SEGUNDA: CAUSAL OBJETIVA Y OBJETO DEL CONTRATO</p>
    <p>La presente contratación se celebra al amparo del <strong>Artículo 56°</strong> del D.S. N°003-97-TR (Ley de <u>Productividad y Competitividad Laboral</u>), por la necesidad temporal de atender la ejecución de <strong>obras determinadas, servicios específicos y necesidades coyunturales del mercado</strong>, propias de la actividad empresarial de <strong>EL EMPLEADOR</strong>.</p>
    <p><strong>EL OBJETO</strong> de este contrato es la prestación de servicios para la ejecución de las labores de <span class="highlight">${d.categoria}</span> que requieran ser desarrolladas en cualquiera de los múltiples frentes de trabajo de <strong>EL EMPLEADOR</strong>, los cuales incluyen, mas no se limitan a:</p>
    <p>a) <strong>Servicios de Tercerización:</strong> Derivados de los contratos de servicios suscritos por <strong>EL EMPLEADOR</strong> con empresas del sector minero e industrial, tales como, <span class="highlight">U.M. ${d.unidad}</span>, y/o cualquier otra empresa cliente con la que se suscriba contrato.</p>
    <p>b) <strong>Obras y Servicios Propios:</strong> Para el desarrollo de proyectos, mantenimiento, ampliación o ejecución de obras de la propia empresa ECOSERMY.</p>
    
    
  </div>`;

  // ── PÁGINA 2: Cláusulas 3-5 (5.1-5.3) ────────────────────────────────
  const pag2 = `
  <div class="contrato-page">
    ${encabezado(2)}
    <p>c) <strong>Necesidades Coyunturales:</strong> Para atender picos de producción, demandas temporales de servicios o cualquier otra necesidad transitoria de la cartera de proyectos de <strong>EL EMPLEADOR</strong>.</p>
    <p>La duración del presente contrato estará sujeta a la <strong>vigencia de los contratos con los clientes finales, la culminación de las obras o servicios asignados, o la finalización de la necesidad temporal</strong> que dio origen a la contratación, lo que ocurra primero.</p>
    <p class="clausula">CLÁUSULA TERCERA: PLAZO Y DURACIÓN</p>
    <p>El plazo de duración del presente contrato es desde el <span class="highlight">${formatFechaCorta(d.contrato_inicio)}</span> hasta el <span class="highlight">${d.contrato_fin ? formatFechaCorta(d.contrato_fin) : 'INDEFINIDO'}</span> o hasta la finalización de la necesidad temporal objeto de este contrato, lo que ocurra primero. El vínculo laboral terminará de pleno derecho en la fecha señalada, sin necesidad de preaviso, comunicación escrita ni pago de indemnización alguna, por aplicación de la causal objetiva.</p>
    <p>Si la obra o servicio específico culmina antes de la fecha prevista, el contrato se dará por terminado automáticamente. <strong>EL EMPLEADOR</strong> solo estará obligado al pago de las remuneraciones y beneficios legales devengados hasta la fecha del cese efectivo.</p>

    <p class="clausula">CLÁUSULA CUARTA: RÉGIMEN REMUNERATIVO (JORNAL DIARIO O MENSUAL)</p>
    <p><strong><u>RÉGIMEN MENSUAL</u></strong></p>
    <p>4.1. En contraprestación, <strong>EL EMPLEADOR</strong> abonará una remuneración bruta mensual de S/ <span class="highlight">${d.sueldo_base.toFixed(2)}</span> <span class="highlight">${sueldoLetras}</span>.</p>
    <p><strong>4.2. MONTO POR BENEFICIO ECONÓMICO NO REMUNERATIVO POR OTRAS CONDICIONES</strong></p>
    <p class="indent">De conformidad con los conceptos no remunerativos que prevé el art. 7º del TUO de la Ley de Productividad y Competitividad Laboral, <strong>EL EMPLEADOR</strong> abonará a <strong>EL TRABAJADOR</strong> la suma de S/.200 (doscientos soles 00/100 SOLES) mensuales, bajo el concepto de "Beneficio económico por otras Condiciones", cuyo otorgamiento obedece a criterios internos y liberalidad del empleador y no constituye remuneración en los términos previstos por el artículo 6 del TUO de la Ley de Productividad y Competitividad Laboral.</p>
    <p class="indent">En tal sentido:</p>
    <p class="indent">a) Dicho monto no será base de cálculo para beneficios sociales (gratificaciones, CTS, vacaciones, u otros).</p>
    <p class="indent">b) No estará afecto a aportes previsionales (AFP U ONP), ni a EsSalud.</p>
    <p class="indent">c) Sin embargo, será considerado como ingreso anual computable para efectos del Impuesto a la Renta de Quinta Categoría, en caso corresponda.</p>

    <p class="clausula">CLÁUSULA QUINTA: RÉGIMEN DE JORNADA ATÍPICA 14x7 Y HORARIOS</p>
    <p><strong>5.1. JORNADA ATÍPICA:</strong> Las partes convienen expresamente en someterse a un régimen de jornada atípica acumulativa de <strong>catorce (14) días continuos de trabajo</strong>, seguidos de <strong>siete (7) días continuos de descanso</strong>, conforme a lo establecido en el D.S. N°008-2002-TR.</p>
    <p><strong>5.2. HORARIO ESTABLECIDO:</strong> El horario de trabajo se establecerá de la siguiente manera: ingreso a las 7:00 horas, salida a las 19:00 horas, con una hora de refrigerio entre las 12:00 y 13:00 horas, resultando en una jornada efectiva diaria de 11 horas y una jornada semanal promedio de 77 horas.</p>
    <p><strong>5.3. COMPENSACIÓN Y FERIADOS:</strong></p>
    <ul class="contrato-list">
      <li><strong>Compensación por Jornada Atípica:</strong> La remuneración mensual pactada incluye una compensación global por la jornada atípica 14x7 y sus particularidades.</li>
      <li><strong>Feriados Laborados:</strong> Los días feriados que coincidan con días de trabajo serán remunerados con el recargo del 100% establecido en el Artículo 6° del D.S. N°012-92-TR, el cual se calculará y pagará adicionalmente a la remuneración mensual.</li>
      <li><strong>Carácter Complementario:</strong> El TRABAJADOR reconoce que la compensación por jornada atípica es independiente y complementaria al pago de feriados, no existiendo duplicidad ni compensación entre ambos conceptos.</li>
    </ul>
  </div>`;

  // ── PÁGINA 3: Cláusulas 5.4-5.5 + Cláusulas 6-9 ─────────────────────
  const pag3 = `
  <div class="contrato-page">
    ${encabezado(3)}
    <p><strong>5.4. BASE LEGAL:</strong> Este régimen se acoge a lo dispuesto en el <strong>Artículo 5° del D.S. N°008-2002-TR</strong>, que permite la distribución irregular de la jornada hasta el límite máximo de 12 horas diarias, con cálculo de promedio en periodos trimestrales.</p>
    <p><strong>5.5. FACULTADES DEL EMPLEADOR:</strong> <u>EL EMPLEADOR podrá modificar los horarios y turnos según necesidades operativas, garantizando siempre el descanso mínimo de 12 horas entre jornadas.</u></p>

    <p class="clausula">CLÁUSULA SEXTA: LUGAR DE PRESTACIÓN DE SERVICIOS</p>
    <p><strong>EL TRABAJADOR</strong> prestará sus servicios en las instalaciones de <strong>EL EMPLEADOR</strong>, en las unidades operativas de sus clientes, o en cualquier otro frente de trabajo, proyecto u obra que <strong>EL EMPLEADOR</strong> determine, pudiendo ser reasignado entre ellos según las necesidades del servicio.</p>

    <p class="clausula">CLÁUSULA SÉPTIMA: OBLIGACIONES DE CONFIDENCIALIDAD Y NO COMPETENCIA</p>
    <p><strong>7.1.</strong> <strong>EL TRABAJADOR</strong> se obliga a mantener estricta confidencialidad sobre toda información técnica, comercial, operativa, estratégica, de clientes, proveedores, métodos de trabajo y cualquier dato de <strong>EL EMPLEADOR</strong> o de sus clientes al que tenga acceso. Esta obligación subsistirá por <strong>tres (3) años</strong> posteriores a la terminación del contrato.</p>
    <p><strong>7.2. Protección de Datos: EL TRABAJADOR</strong> autoriza expresamente a <strong>EL EMPLEADOR</strong> al tratamiento de sus datos personales, inclusive de carácter sensible (como resultados de exámenes médicos), para los fines de la relación laboral, y para compartirlos con sus empresas clientes cuando sea necesario, de conformidad con la <strong>Ley N°29733 - Ley de Protección de Datos Personales</strong>.</p>
    <p><strong>7.3. No Competencia:</strong> Durante la vigencia del contrato, <strong>EL TRABAJADOR</strong> se abstendrá de prestar servicios, directa o indirectamente, a empresas competidoras de <strong>EL EMPLEADOR</strong> en el sector minero y de construcción.</p>

    <p class="clausula">CLÁUSULA OCTAVA: PROPIEDAD INTELECTUAL E INNOVACIONES</p>
    <p>Cualquier invento, innovación, mejora de proceso, desarrollo técnico o creación intelectual que <strong>EL TRABAJADOR</strong> realice con ocasión de su trabajo, será propiedad exclusiva de <strong>EL EMPLEADOR</strong>, quien podrá patentarlo o utilizarlo libremente, sin obligación de compensación adicional alguna, conforme al <strong>Artículo 50° de la LPCL</strong>.</p>

    <p class="clausula">CLÁUSULA NOVENA: TERMINACIÓN AUTOMÁTICA Y RESOLUCIÓN</p>
    <p><strong>9.1. Terminación Automática:</strong> El presente contrato se extinguirá automáticamente, sin responsabilidad indemnizatoria para <strong>EL EMPLEADOR</strong>, por la culminación de la obra o servicio específico, por la terminación, resolución o anulación del contrato principal con la empresa cliente, o por la finalización de la necesidad temporal propia que dio origen al contrato.</p>
    <p><strong>9.2. Resolución por Causa Imputable al Trabajador:</strong> Constituyen causas suficientes para la resolución del contrato sin indemnización, entre otras: la falsedad documentaria o declarativa, el incumplimiento grave de sus obligaciones, el incumplimiento reiterado de las normas de seguridad y salud en el trabajo, y el incumplimiento de las obligaciones de confidencialidad.</p>
  </div>`;

  // ── PÁGINA 4: Cláusulas 10-11 + Disposiciones + Firmas ───────────────
  const pag4 = `
  <div class="contrato-page">
    ${encabezado(4)}
    <p class="clausula">CLÁUSULA DÉCIMA: DESCUENTOS AUTORIZADOS</p>
    <p>Las partes acuerdan que <strong>EL EMPLEADOR</strong> podrá descontar de las remuneraciones o beneficios sociales de <strong>EL TRABAJADOR</strong>, hasta el límite permitido por la ley (Artículo 26° de la Constitución y Ley N°9463), los siguientes conceptos:</p>
    <p>a) El valor de las herramientas, equipos o materiales perdidos o dañados por su culpa.</p>
    <p>b) Las multas o penalidades que imponga el cliente final como consecuencia directa de una falta inexcusable de <strong>EL TRABAJADOR</strong>.</p>

    <p class="clausula">CLÁUSULA DÉCIMO PRIMERA: JURISDICCIÓN Y DOMICILIO</p>
    <p class="indent">Para cualquier controversia derivada del presente contrato, las partes se someten a la jurisdicción de los Jueces y Salas Especializadas de <strong>La Oroya</strong>, renunciando a cualquier otro fuero o jurisdicción. Se establecen como domicilios los consignados en el encabezado.</p>

    <br/>
    <p class="clausula" style="text-decoration:none;">DISPOSICIONES COMPLEMENTARIAS</p>
    <p>En todo lo no previsto en el presente contrato, se aplicarán las disposiciones del <strong>D.S. N°003-97-TR (LPCL)</strong>, la <strong>Ley N°29783 - Ley de Seguridad y Salud en el Trabajo</strong>, el <strong>Reglamento Interno de Trabajo</strong> y el <strong>Reglamento de Seguridad y Salud</strong> de <strong>EL EMPLEADOR</strong>, los cuales <strong>EL TRABAJADOR</strong> declara conocer y aceptar.</p>

    <p><strong>ANEXOS OBLIGATORIOS (Forman parte integral del contrato):</strong></p>
    <ul class="contrato-list">
      <li>ANEXO 01: Régimen de Jornada Acumulativa 14x7 (Detallado).</li>
      <li>ANEXO 02: Política de Confidencialidad y Protección de Datos.</li>
      <li>ANEXO 03: Política de Seguridad y Salud en el Trabajo (SST).</li>
      <li>ANEXO 04: Carta de Compromiso Política de Cero Alcohol y Drogas.</li>
    </ul>

    <p>En señal de conformidad, las partes firman el presente contrato en dos ejemplares del mismo tenor y a un solo efecto, en la ciudad de Yauli, <span class="highlight">a los ${fechaFirma}</span></p>

    ${firmas(d.nombre_completo, d.dni)}
  </div>`;

  return pag1 + pag2 + pag3 + pag4;
}

// ── PÁGINA 5: ANEXO 01 ─────────────────────────────────────────────────

function paginaAnexo01(d) {
  return `
  <div class="contrato-page">
    ${encabezado(5)}
    <h3>ANEXO Nº01<br/>CONVENIO INDIVIDUAL PARA EL ESTABLECIMIENTO DE<br/>RÉGIMEN ACUMULATIVO DE JORNADA DE TRABAJO Y DESCANSO</h3>

    <p>Por el presente documento las partes del "CONTRATO DE TRABAJO SUJETO A MODALIDAD POR SERVICIO ESPECIFICO", que celebran de una parte EMPRESA COMUNAL DE SERVICIOS MÚLTIPLES YAULI - ECOSERMY, con RUC Nº20516385813, debidamente representada por su presidente el Sr. Juan Francisco BERNALDO SABUCO, con DNI Nº04019887, a quien en adelante se le denominará EL EMPLEADOR; y de la otra parte la Sr(a). <span class="highlight">${d.nombre_completo}</span> con DNI Nº <span class="highlight">${d.dni}</span>, a quien en adelante se le denominará EL TRABAJADOR; en razón de la naturaleza de la Empresa; las partes convienen de manera expresa y voluntaria, en aplicación de lo dispuesto en el Convenio Internacional de Trabajo N°1 de la OIT, Decreto Legislativo N°854 modificado por Ley N°27671, D. S. N°008-2002-TR, y complementarias, establecer un Régimen Alternativo de Acumulación de Jornada de Trabajo Atípico y Descanso, mediante el cual queda establecido que:</p>

    <p><strong>PRIMERO:</strong> EL TRABAJADOR prestará servicios en el centro de trabajo según régimen laboral establecido por nuestro cliente, de trabajo continúo seguido por de descanso continuo. El periodo de labores incluirá los días sábados, domingos y feriados, asimismo queda convenido que el periodo acumulativo en promedio no excederá de las horas de trabajo establecidos por Ley dentro del horario establecido en EL EMPLEADOR: <u>Turno día</u> de 07:00 a 12:00 horas y de 13:00 a 19:00 horas, el refrigerio se tomará de 12:00 a 13:00 horas; y <u>Turno noche</u> de 19:00 a 7:00 horas, el descanso se tomará de una hora en coordinación con el Supervisor encargado.<br/>Este horario podrá ser modificado de acuerdo a las necesidades de EL EMPLEADOR, sin necesidad de sustentar estas necesidades ante EL TRABAJADOR.</p>

    <p><strong>SEGUNDO:</strong> EL TRABAJADOR para el desarrollo de sus actividades privadas y familiares tomará su periodo acumulativo de descanso fuera de la Unidad de Trabajo.</p>

    <p><strong>TERCERA:</strong> En caso se produzcan faltas injustificadas, sanciones de suspensión, permisos sin goce de haberes o cualquier otra falta que a criterio de suspensión no se encuentra justificado, el pago se efectuará sobre los días efectivamente laborados y la aplicación del descuento proporcional.</p>

    <p><strong>CUARTA:</strong> Queda expresamente convenido que EL EMPLEADOR podrá modificar el convenio en función a sus necesidades operativas o administrativas, dejándose constancia que la modificación que pudiera efectuarse no afecte los derechos de EL TRABAJADOR a la jornada máxima de Ley, ni a los descansos semanales obligatorios establecido por ley.</p>

    <p><strong>QUINTO:</strong> EL TRABAJADOR declara expresamente conocer las implicancias del Régimen Acumulativo de Jornada de Trabajo y Descanso que se establece mediante el presente Convenio, igualmente reconoce expresamente que no se vulnera su derecho de la Jornada Máxima Legal y a su descanso semanal obligatorio.</p>

    <p>Como muestra de conformidad con todas las cláusulas del presente convenio firman las partes, por duplicado a <span class="highlight">${formatFecha(d.contrato_inicio)}</span></p>

    ${firmas(d.nombre_completo, d.dni)}
  </div>`;
}

// ── PÁGINA 6: ANEXO 02 ─────────────────────────────────────────────────

function paginaAnexo02(d) {
  return `
  <div class="contrato-page">
    ${encabezado(6)}
    <h3>ANEXO Nº02<br/>POLÍTICA DE CONFIDENCIALIDAD Y PROTECCIÓN DE DATOS</h3>

    <p style="margin-top:30px;">Yo, <span class="highlight">${d.nombre_completo}</span>, identificado con DNI N° <span class="highlight">${d.dni}</span> en mi calidad de TRABAJADOR de ECOSERMY, DECLARO:</p>

    <p style="margin-top:30px;"><strong>OBLIGACIÓN DE CONFIDENCIALIDAD:</strong> Me comprometo a mantener absoluta reserva sobre toda información, documentación, datos, procedimientos, métodos de trabajo, estrategias comerciales, listas de clientes, información técnica y cualquier otro dato al que tenga acceso durante mi relación laboral.</p>

    <p style="margin-top:20px;"><strong>PROHIBICIÓN DE DIVULGACIÓN:</strong> No revelaré, compartiré, utilizaré en provecho propio o de terceros, ni divulgaré de ninguna forma información confidencial del EMPLEADOR o de sus clientes.</p>

    <p style="margin-top:20px;"><strong>PROTECCIÓN DE DATOS:</strong> Autorizo al EMPLEADOR al tratamiento de mis datos personales, incluidos datos sensibles (resultados médicos), para fines laborales y para compartirlos con clientes cuando sea necesario, conforme a la Ley N°29733.</p>

    <p style="margin-top:20px;"><strong>DURACIÓN:</strong> Esta obligación subsiste por TRES (3) AÑOS posteriores a la terminación de mi contrato.</p>

    <p style="margin-top:20px;"><strong>CONSECUENCIAS:</strong> El incumplimiento de esta obligación constituye falta grave y faculta al EMPLEADOR a tomar acciones legales, incluida la demanda por daños y perjuicios.</p>

    ${firmaSoloTrabajador(d.nombre_completo, d.dni)}
  </div>`;
}

// ── PÁGINAS 7-9: ANEXO 03 ──────────────────────────────────────────────

function paginasAnexo03(d) {
  const items = [
    'Cumplir permanentemente con las normas de seguridad establecidas en el Reglamento Interno de Seguridad y Salud Ocupacional en el Trabajo.',
    'Conocer y aplicar su Derecho de Negativa al Trabajo Peligroso, cuando un trabajo sea exigido en condiciones que no son las adecuadas.',
    'Conocer y mostrar participación en el cumplimiento a los objetivos de Seguridad planteados por nuestra empresa ECOSERMY.',
    'No fumar dentro de las instalaciones de ECOSERMY y en el área de trabajo en cumplimiento de la Ley y como medida de control básica para prevenir incendios.',
    'Estar siempre alerta y consciente de la tarea a realizar. Mantener el estado de alerta y cuidarse así mismo concentrándose en la tarea, evitando distracciones, identificando y controlando los peligros en su entorno, llenando el IPERC y/o ATS.',
    'Repasar y Comprender los formatos que le hayan sido entregados en función de cumplir con nuestro Programa Anual de Seguridad y demás reglamentos. Ante cualquier duda, siempre tomar la premisa de consultar.',
    'Conducir los vehículos en forma segura evitando distraerse hablando por celular, respetando los límites de velocidad, parando completamente en los cruces de vías de tránsito de vehículos.',
    'Usar la maquinaria de movimiento de carga de acuerdo a las especificaciones del fabricante respetando los límites de velocidad y los límites de carga establecidos.',
    'Usar sólo herramientas originales, en buen estado de conservación y de acuerdo a las especificaciones del fabricante. Mantener una lista de las herramientas que usa en el trabajo y revisarlas periódicamente para garantizar su buen estado. Solicite el cambio cuando lo requiera.',
    'Usar equipo de protección personal original y autorizada por el área de seguridad de ECOSERMY, y de ser necesario, rectificado por la Empresa Cliente.',
    'Resguardar el equipo de protección para mantenerlo en buen estado. Revisar el equipo de protección personal en forma diaria en busca de daños. Solicitar el cambio de su equipo de protección cuando detecte algún daño.',
    'Respetar las buenas prácticas para el uso y almacenamiento de productos químicos: usar el equipo de protección estándar que incluye lentes de seguridad, protección respiratoria de media cara con cartuchos adecuados para el producto químico a utilizar y guantes de nitrilo; rotular los envases de los productos químicos con su nombre comercial, código de las naciones unidas y rombo de la NFPA; mantener los recipientes siempre cerrados para evitar derrames; segregar los productos químicos, separando los productos inflamables de los oxidantes; controlar los derrames de los productos químicos en forma inmediata y segura para las personas, el medio ambiente y siguiendo las instrucciones de la hoja de seguridad del producto (MSDS).',
    'Cumplir con las recomendaciones de seguridad de los avisos publicados en las instalaciones de ECOSERMY y en las áreas de trabajo (señalización preventiva de seguridad).',
    'Respetar las zonas de seguridad en caso de sismo, accesos a extintores y equipos contraincendios, los cuales deben estar siempre despejadas.',
    'Cumplir con los permisos de trabajos especiales de alto riesgo PETAR como, por ejemplo: los trabajos en altura, "todo el personal que realice una actividad a más de 1.8 metros debe usar arnés de seguridad"; trabajos en caliente, "se debe contar con un extintor y despejar la zona de material inflamable o combustible".',
    'Dar alerta en las maniobras de izaje de geo sintéticos, objetos pesados y asegurar la zona de trabajo para evitar que una persona pase debajo de la carga suspendida.',
    'Controlar el uso de escaleras para ascender a otros niveles ya que el mal uso de los mismos puede generar caídas y accidentes incapacitantes y/o mortales.',
    'No emprender ningún trabajo y/o actividad para el cual no ha recibido entrenamiento o que pueda poner en peligro tanto a la persona que realiza la actividad como a sus compañeros de trabajo o las instalaciones.',
    'Promover el trabajo seguro del equipo de trabajo, no interfiriendo en sus actividades salvo que observe incumplimiento de las normas de seguridad en cuyo caso deberá solicitar paralización del trabajo y comunicar de inmediato a su supervisor de seguridad y al de operaciones de ECOSERMY. Toda instrucción de trabajo operativa debe ser dada por su propio supervisor y con conocimiento del de seguridad.',
    'Asistir y participar activamente en las inducciones, charlas o cursos de capacitación y/o entrenamiento sobre Seguridad y Salud Ocupacional en el trabajo, Medio Ambiente, Responsabilidad Social y Calidad a las que sea convocado.',
    'Ningún trabajador intervendrá, cambiará, desplazará, dañará los dispositivos de seguridad destinados a su protección, o la de terceros, ni cambiará los métodos o procedimientos adoptados.',
    'Cooperar y participar en el proceso de investigación de los accidentes de trabajo y las enfermedades ocupacionales cuando se requiera.',
    'Mantener las condiciones de orden y limpieza en todos los lugares y actividades de trabajo en las que participe, cumpliendo con hacer la limpieza y orden del área de trabajo al final de su jornada.',
    'Comunicar al jefe inmediato todo evento o situación que ponga o pueda poner en riesgo su seguridad y salud y/o de las instalaciones físicas, debiendo aportar inmediatamente, de ser posible, las medidas correctivas del caso.',
    'Están prohibidas las bromas, juegos bruscos y trabajar bajo el efecto del alcohol o estupefacientes.',
    'Participar en las charlas de 5 minutos en forma madura y responsable prestando atención a las recomendaciones dadas por el expositor y poniéndolas en práctica durante sus actividades del día.',
    'Conocer y aplicar las políticas de Seguridad de nuestra empresa ECOSERMY, así como de la Empresa Cliente.',
    'Participar en la elaboración del Análisis de Trabajo Seguro (ATS), aportando su conocimiento y experiencia para identificar y controlar los riesgos presentes en la operación.',
    'Al ingresar al área de trabajo y como medida básica de prevención de accidentes dentro de nuestras instalaciones, usar siempre el Equipo de Protección Personal (EPPs). Solo en oficinas, unidades móviles y comedores, se puede no usar el EPPs.',
    'Usar la movilidad para trasladarse en forma segura, subiendo y descendiendo de ella sólo en los paraderos y/o zonas autorizadas.',
    'Asistir a los exámenes médicos pre-ocupacionales, anuales y de retiro a los que sean programados. Es requisito indispensable que el trabajador pase su examen de retiro para documentar su estado de salud, dentro de los 30 días calendarios al cese de labores.',
    'Cooperar con su jefe inmediato en la implementación y/o ejecución de las normas de seguridad y estándares de seguridad contenidos en el Reglamento para proteger la seguridad y salud de los trabajadores.',
    'Realizar de forma eficaz las tareas de Seguridad, Salud Ocupacional y Media Ambiente que le hayan sido encomendadas. Entregarlas en las fechas características indicadas.',
    'Mantener la calma durante una emergencia, no correr, colocarse en las zonas de seguridad establecidas y señalizadas, conforme a los ejercicios de evacuación realizados.',
    'Comunicar en forma inmediata los incidentes y accidentes a sus jefes inmediato solicitando ayuda y solicitando a su vez que éste comunique el hecho al número de Emergencias. Todos los incidentes y accidentes deben ser reportados, incluso aquellos que se clasifiquen como leves.',
    'Colaborar con la primera respuesta en caso de accidentes e incidentes, asegurando la zona de accidente e incidentes, comunicando el hecho y solicitando ayuda y dando los primeros auxilios en el caso de estar entrenado.',
    'Utilizar los cilindros para segregar los residuos, según la clasificación de colores determinado para tal fin.',
    'Intervenir y comunicar los riesgos a las personas involucradas cuando detecte una condición o acto sub estándar en el proceso, sin importar la jerarquía de los trabajadores involucrados.',
  ];

  // Dividir en 3 páginas: 1-13, 14-31, 32-38
  const grupo1 = items.slice(0, 13);
  const grupo2 = items.slice(13, 31);
  const grupo3 = items.slice(31);

  const pag7 = `
  <div class="contrato-page">
    ${encabezado(7)}
    <h3>ANEXO N°03<br/>RECOMENDACIONES EN MATERIA DE SEGURIDAD Y SALUD EN EL TRABAJO<br/><u>(Ley N° 29783, Art. 35, inc. c)</u></h3>
    <p>Por medio del presente documento, y en aplicación de las obligaciones contenidas en la Ley N°29783, Ley de Seguridad y Salud en el trabajo, EL EMPLEADOR cumple con adjuntar al contrato de trabajo las presentes recomendaciones generales en materia de Seguridad y Salud en el Trabajo, Políticas de la Empresa <u>Ecosermy</u> y otras directivas de Seguridad y Salud en el Trabajo complementarias. En ese sentido, EL TRABAJADOR se obliga a cumplir rigurosamente las disposiciones que a continuación se indican:</p>
    <ol class="sst-list">
      ${grupo1.map((item, i) => `<li>${item}</li>`).join('')}
    </ol>
  </div>`;

  const pag8 = `
  <div class="contrato-page">
    ${encabezado(8)}
    <ol class="sst-list" start="14">
      ${grupo2.map((item, i) => `<li>${item}</li>`).join('')}
    </ol>
  </div>`;

  const fechaFirmaSST = '31 de marzo del 2026';

  const pag9 = `
  <div class="contrato-page">
    ${encabezado(9)}
    <ol class="sst-list" start="32">
      ${grupo3.map((item, i) => `<li>${item}</li>`).join('')}
    </ol>
    <p style="text-align:right; margin-top:30px;"><span class="highlight">${fechaFirmaSST}</span></p>
    ${firmas(d.nombre_completo, d.dni)}
  </div>`;

  return pag7 + pag8 + pag9;
}

// ── PÁGINA 10: ANEXO 04 ────────────────────────────────────────────────

function paginaAnexo04(d) {
  const fechaFirma = '31 de marzo del 2026';

  return `
  <div class="contrato-page">
    ${encabezado(10)}
    <h3>ANEXO N°04<br/>CARTA DE COMPROMISO<br/>POLÍTICA DE TOLERANCIA CERO AL ALCOHOL Y DROGAS</h3>

    <table style="margin:40px 0 30px 40px; font-size:11pt;">
      <tr><td style="width:80px; padding:6px 0;"><strong>YO</strong></td><td style="padding:6px 10px;">:</td><td><span class="highlight">${d.nombre_completo}</span></td></tr>
      <tr><td style="padding:6px 0;"><strong>DNI Nº</strong></td><td style="padding:6px 10px;">:</td><td><span class="highlight">${d.dni}</span></td></tr>
      <tr><td style="padding:6px 0;"><strong>CARGO</strong></td><td style="padding:6px 10px;">:</td><td><span class="highlight">${d.cargo}</span></td></tr>
    </table>

    <p style="margin-top:30px;"><strong><u>ME COMPROMETO A:</u></strong></p>
    <p>Cumplir fielmente la Política de Tolerancia CERO al Alcohol y Drogas de <u>ECOSERMY</u>.</p>
    <ul class="contrato-list" style="margin-top:20px;">
      <li>De incumplir dicha política, soy consciente de la aplicación de la gestión de consecuencias (falta grave).</li>
      <li>De incumplir el presente compromiso estoy llano a someterme a las medidas correctivas que ECOSERMY demande.</li>
    </ul>

    <p style="text-align:right; margin-top:40px;"><span class="highlight">${fechaFirma}</span></p>

    <div style="text-align:center; margin-top:40px;">
      <div style="width:100px; height:100px; border:1px solid #ccc; margin:0 auto; display:flex; align-items:center; justify-content:center; color:#ccc; font-size:9px;">Huella</div>
    </div>

    ${firmaSoloTrabajador(d.nombre_completo, d.dni)}
  </div>`;
}

// ── EXPORTAR CONTRATO COMPLETO ──────────────────────────────────────────

/**
 * Genera solo el contenido del cuerpo (estilos + páginas) SIN wrapper HTML/HEAD.
 * Usar este para html2pdf.js (se inserta como innerHTML de un div)
 * @param {Object} datos - Datos del empleado
 * @returns {string} Estilos inline + páginas HTML
 */
export function generarContratoCuerpo(datos) {
  const paginas = [
    paginasContrato(datos),
    paginaAnexo01(datos),
    paginaAnexo02(datos),
    paginasAnexo03(datos),
    paginaAnexo04(datos),
  ].join('\n');
  return `${estilos}\n${paginas}`;
}

/**
 * Genera el HTML completo del contrato (DOCTYPE + HTML + HEAD + BODY).
 * Usar para iframe preview y descarga Word.
 * @param {Object} datos - Datos del empleado
 * @returns {string} Documento HTML completo
 */
export function generarContratoHTML(datos) {
  const paginas = [
    paginasContrato(datos),
    paginaAnexo01(datos),
    paginaAnexo02(datos),
    paginasAnexo03(datos),
    paginaAnexo04(datos),
  ].join('\n');
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Contrato - ${datos.nombre_completo}</title>
  ${estilos}
</head>
<body>
${paginas}
</body>
</html>`;
}

// ── ESTILOS WORD ────────────────────────────────────────────────────────

const estilosWord = `
<style>
  @page {
    size: A4;
    margin: 1.5cm 1cm 1.5cm 1.5cm;
    mso-page-orientation: portrait;
    mso-header-margin: 0;
    mso-footer-margin: 0;
  }
  @page Section1 { mso-header-margin:0; mso-footer-margin:0; }
  div.Section1 { page: Section1; }
  body, html {
    margin: 0;
    padding: 0;
    font-family: Calibri, Arial, Helvetica, sans-serif;
    font-size: 9pt;
    line-height: 1.0;
    color: #000;
  }
  table { border-collapse: collapse; }
  p { margin: 0 0 3px 0; text-align: justify; }
  h2 {
    text-align: center;
    font-size: 11pt;
    margin: 6px 0;
    text-decoration: underline;
    font-weight: bold;
  }
  h3 {
    text-align: center;
    font-size: 9pt;
    margin: 6px 0 5px;
    text-decoration: underline;
  }
  .clausula {
    font-weight: bold;
    text-decoration: underline;
    margin: 8px 0 3px;
    font-size: 10pt;
  }
  .indent { padding-left: 20px; }
  .highlight { font-weight: bold; }
  ul.contrato-list { margin: 0 0 8px 0; padding-left: 30px; }
  ul.contrato-list li { margin-bottom: 2px; text-align: justify; }
  ol.sst-list { margin: 0 0 8px 0; padding-left: 20px; }
  ol.sst-list li { margin-bottom: 3px; text-align: justify; line-height: 1.4; }
  .page-break {
    page-break-before: always;
    mso-break-type: section-break;
  }
</style>`;

// ── Encabezado Word ─────────────────────────────────────────────────────

function encabezadoWord(pagina, total = 16) {
  return `
  <table width="100%" border="1" cellpadding="3" cellspacing="0" style="border:2px solid #000; margin-bottom:16px; font-family:Calibri,Arial,sans-serif;">
    <tr>
      <td rowspan="4" width="26%" align="center" valign="middle" style="border:1px solid #000; background:#fff;">
        <img src="${LOGO_ECOSERMY}" alt="ECOSERMY" width="120" style="display:block; margin:0 auto 3px auto;">
        <p style="font-size:6.5pt; font-weight:bold; text-transform:uppercase; letter-spacing:0.2px; color:#000; text-align:center; margin:0;">SISTEMA DE GESTIÓN INTEGRADO</p>
      </td>
      <td width="43%" align="center" valign="middle" style="border:1.5px solid #000; background:#374151; padding:3px 4px;">
        <p style="color:#fff; font-size:9.5pt; font-weight:bold; letter-spacing:2px; text-transform:uppercase; text-align:center; margin:0;">FORMATO</p>
      </td>
      <td width="12%" valign="middle" style="border:1px solid #000; padding:2px 6px;">
        <p style="font-size:8pt; margin:0; text-align:left;">Código</p>
      </td>
      <td width="19%" align="center" valign="middle" style="border:1px solid #000; padding:2px 6px;">
        <p style="font-size:8pt; font-weight:bold; color:#1a6fa8; margin:0; text-align:center;">ECO-FT-RH 26.01</p>
      </td>
    </tr>
    <tr>
      <td rowspan="3" align="center" valign="middle" style="border:1.5px solid #000; padding:2px 6px; background:#fff;">
        <p style="color:#000; font-size:13pt; font-weight:bold; line-height:1.2; text-align:center; margin:0;">CONTRATO DE TRABAJO</p>
        <p style="color:#000; font-size:10pt; font-weight:bold; line-height:1.2; text-align:center; margin:0;">SUJETO A MODALIDAD¹</p>
        <p style="color:#000; font-size:9pt; font-weight:bold; line-height:1.2; text-align:center; margin:1px 0 0 0;">CONTRATO POR SERVICIO ESPECIFICO</p>
      </td>
      <td valign="middle" style="border:1px solid #000; padding:2px 6px;">
        <p style="font-size:8pt; margin:0; text-align:left;">Revisión</p>
      </td>
      <td align="center" valign="middle" style="border:1px solid #000; padding:2px 6px;">
        <p style="font-size:8pt; font-weight:bold; color:#1a6fa8; margin:0; text-align:center;">V02</p>
      </td>
    </tr>
    <tr>
      <td valign="middle" style="border:1px solid #000; padding:2px 6px;">
        <p style="font-size:8pt; margin:0; text-align:left;">Área</p>
      </td>
      <td align="center" valign="middle" style="border:1px solid #000; padding:2px 6px;">
        <p style="font-size:8pt; font-weight:bold; color:#1a6fa8; margin:0; text-align:center;">Corporativo</p>
      </td>
    </tr>
    <tr>
      <td valign="middle" style="border:1px solid #000; padding:2px 6px;">
        <p style="font-size:8pt; margin:0; text-align:left;">Paginas</p>
      </td>
      <td align="center" valign="middle" style="border:1px solid #000; padding:2px 6px;">
        <p style="font-size:8pt; font-weight:bold; color:#1a6fa8; margin:0; text-align:center;">Página ${pagina} de ${total}</p>
      </td>
    </tr>
  </table>`;
}

// ── Firmas Word ─────────────────────────────────────────────────────────

function firmasWord(nombre, dni) {
  return `
  <table width="100%" style="margin-top:60px;">
    <tr>
      <td width="50%" align="center" style="padding-top:40px; border-top:1px solid #000;" valign="top">
        <p style="text-align:center; margin:0;"><strong>JUAN FRANCISCO BERNALDO SABUCO</strong></p>
        <p style="text-align:center; margin:0;">D.N.I. 04019887</p>
        <p style="text-align:center; margin:0;">EL EMPLEADOR</p>
      </td>
      <td width="50%" align="center" style="padding-top:40px; border-top:1px solid #000;" valign="top">
        <p style="text-align:center; margin:0;"><strong>${nombre}</strong></p>
        <p style="text-align:center; margin:0;">D.N.I. N° ${dni}</p>
        <p style="text-align:center; margin:0;">EL TRABAJADOR</p>
      </td>
    </tr>
  </table>`;
}

function firmaSoloTrabajadorWord(nombre, dni) {
  return `
  <table width="250" align="center" style="margin-top:60px; border-top:1px solid #000;">
    <tr>
      <td align="center" style="padding-top:10px;">
        <p style="text-align:center; margin:0;"><strong>${nombre}</strong></p>
        <p style="text-align:center; margin:0;">D.N.I. N° ${dni}</p>
        <p style="text-align:center; margin:0;">EL TRABAJADOR</p>
      </td>
    </tr>
  </table>`;
}

// ── PÁGINAS WORD ────────────────────────────────────────────────────────

function paginasContratoWord(d) {
  const fechaFirma = '31 de marzo del 2026';
  const sueldoLetras = montoALetrasFormato(d.sueldo_base);
  const sueldo = parseFloat(d.sueldo_base || 0).toFixed(2);
  const nombre = d.nombre_completo || `${d.apellidos || ''} ${d.nombres || ''}`.trim();
  const pb = '<br clear="all" style="page-break-before:always; mso-break-type:section-break;" />';

  // ── PÁGINA 1 ──────────────────────────────────────────────────────────
  const pag1 = `
  ${encabezadoWord(1)}
  <h2>CONTRATO DE TRABAJO SUJETO A MODALIDAD POR SERVICIO ESPECÍFICO</h2>
  <p style="text-indent:30px;">Conste por el presente documento, el contrato de trabajo celebrado de una parte:</p>
  <p>(1) Por la <strong>EMPRESA COMUNAL DE SERVICIOS MÚLTIPLES YAULI – ECOSERMY</strong>, con R.U.C. Nº 20516385813, con domicilio fiscal en Av. Ladislao Espinar S/N Sec. Yauli (frente a la piscina natural), Yauli – Junín, debidamente representada por su Presidente el Sr. <strong>Juan Francisco BERNALDO SABUCO</strong> con DNI Nº 04019887, a quien en lo sucesivo se le denominará <strong>EL EMPLEADOR</strong>.</p>
  <p>(2) Y de la otra parte el Sr(a). <strong>${nombre}</strong>, identificado con DNI: <strong>${d.dni}</strong>, con domicilio en ${d.direccion ? `<strong>${d.direccion}</strong>` : ''}${d.distrito ? `, <strong>${d.distrito}</strong>` : ''}${d.provincia ? `, <strong>${d.provincia}</strong>` : ''}${d.departamento ? `, <strong>${d.departamento}</strong>` : ''}, con Celular Nro. <strong>${d.celular}</strong>, y email: <strong>${d.email}</strong>, a quien en adelante se le denominará <strong>EL TRABAJADOR</strong>.</p>
  <p>Bajo el régimen de la <strong>Ley General de Comunidades Campesinas – Ley N°24656</strong>, el <strong>Decreto Supremo N°003-97-TR</strong> (Texto Único Ordenado de la Ley de Productividad y Competitividad Laboral - LPCL) y normas complementarias, en los términos y condiciones siguientes:</p>
  <p class="clausula">CLÁUSULA PRIMERA: ANTECEDENTES Y NATURALEZA JURÍDICA.</p>
  <p><strong>1.1. De la Naturaleza Jurídica de EL EMPLEADOR: </strong><strong>EL EMPLEADOR</strong> deja expresa constancia de que no es una sociedad mercantil tradicional orientada a la acumulación de capital privado. Por el contrario, ECOSERMY es una Empresa Comunal, constituida como el brazo económico, productivo y social de la Comunidad Campesina de Yauli (COCAYA). Su existencia, organización y fines sociales se encuentran tutelados y amparados por el <strong>Artículo 89° de la Constitución Política del Perú</strong>, que garantiza la autonomía organizativa, económica y administrativa de las Comunidades Campesinas, encontrándose regulada estrictamente por la <strong>Ley General de Comunidades Campesinas, Ley N° 24656</strong>. En tal sentido, su objeto social primordial es el desarrollo socioeconómico de sus comuneros.</p>
  <p><strong>1.2. De la Dependencia Estructural y Exclusividad de Servicios: </strong>Se establece como premisa fáctica indiscutible que <strong>EL EMPLEADOR</strong> es una entidad cuya operatividad comercial consiste, única y exclusivamente, en prestar servicios de tercerización, intermediación y ejecución de obras por contrata a favor de empresas mineras titulares. En consecuencia, <strong>EL EMPLEADOR</strong> carece de una demanda productiva propia o autónoma en el mercado abierto. Su necesidad de contratar mano de obra está absolutamente supeditada, condicionada y es directamente proporcional a la adjudicación, existencia y vigencia de contratos comerciales o convenios con dichas empresas mineras nacionales y transnacionales.</p>`;

  // ── PÁGINA 2 ──────────────────────────────────────────────────────────
  const pag2 = `
  ${pb}
  ${encabezadoWord(2)}
  <p><strong>1.3. De la Causa Matriz Derivada: </strong>En virtud de lo expuesto en los numerales precedentes, las partes reconocen que la "causa matriz" que origina la presente contratación es de naturaleza estrictamente derivada. La necesidad de incorporar a <strong>EL TRABAJADOR</strong> existe única y exclusivamente porque <strong>EL EMPLEADOR</strong> mantiene vigente el:</p>
  <p style="padding-left:20px;">1) ${d.descripcion_contrato ? `<strong>${d.descripcion_contrato}</strong>` : ''} suscrito con la empresa Compañia Minera <strong>${d.unidad}</strong>. Por consiguiente, resulta jurídicamente irrefutable que, si dicho contrato comercial matriz se extingue, suspende, recorta o termina por decisión del cliente minero, la necesidad laboral de <strong>EL EMPLEADOR</strong> desaparecerá instantáneamente, debiendo el presente contrato extinguirse de forma ineludible.</p>
  <p><strong>1.4. Declaración Jurada de EL TRABAJADOR: </strong><strong>EL TRABAJADOR</strong> declara bajo juramento ser una persona idónea, calificada y con amplia experiencia para el puesto de <strong>${d.cargo}</strong>. Asimismo, declara que la información, documentación presentada y anexada a su currículum, así como la información que brinda y brindará al inicio y durante la relación laboral, es verdadera, autorizando para tal efecto a <strong>EL EMPLEADOR</strong> a verificarla. En caso de comprobarse falsedad de la información y documentación presentada por <strong>EL TRABAJADOR</strong>, éste incurre en causal de resolución de contrato; y, <strong>EL EMPLEADOR</strong> procederá a resolver el presente contrato de forma inmediata, sin perjuicio de iniciar las acciones legales correspondientes.</p>
  <p class="clausula">CLÁUSULA SEGUNDA: CAUSA OBJETIVA MATRIZ Y OBJETO DE CONTRATACIÓN.</p>
  <p><strong>2.1. De la Modalidad Contractual: </strong>El presente contrato se celebra bajo la modalidad de <strong>CONTRATO DE TRABAJO SUJETO A MODALIDAD POR SERVICIO ESPECÍFICO</strong>, amparado en los <strong>Artículos 63° y 72° del TUO del Decreto Legislativo N° 728</strong>, Ley de Productividad y Competitividad Laboral (D.S. N° 003-97-TR).</p>
  <p><strong>2.2. Causa Objetiva: </strong>La necesidad temporal e insustituible que justifica esta contratación se origina directa y exclusivamente en la ejecución del Contrato</p>
  <p style="padding-left:20px;">1) ${d.descripcion_contrato ? `<strong>${d.descripcion_contrato}</strong>` : ''} suscrito con la empresa Compañia Minera <strong>${d.unidad}</strong>, en adelante "EL CLIENTE". ECOSERMY SRL., en su calidad de Empresa Comunal, carece de demanda laboral permanente propia, estando su operatividad y generación de empleo supeditadas estrictamente a los requerimientos, adjudicación y vigencia de las operaciones de El Cliente.</p>`;

  // ── PÁGINA 3 ──────────────────────────────────────────────────────────
  const pag3 = `
  ${pb}
  ${encabezadoWord(3)}
  <p><strong>2.3. Condición Resolutoria Automática: </strong>Las partes declaran conocer y aceptar libremente que, si el Contrato Comercial o Convenio principal referido en el numeral 2.2 fuera recortado, paralizado, suspendido, resuelto o no renovado por "EL CLIENTE" hacia ECOSERMY, la causa objetiva que origina este contrato laboral con "<strong>EL TRABAJADOR</strong>" desaparecerá de forma inmediata. En dicho escenario, el presente contrato de trabajo quedará extinguido de pleno derecho de forma anticipada, al amparo del inciso "c" del <strong>Artículo 16° de la LPCL</strong>, no generando despido arbitrario, indemnización ni penalidad alguna a favor de <strong>EL TRABAJADOR</strong>.</p>
  <p><strong>2.4. Objeto de la Prestación: </strong><strong>EL TRABAJADOR</strong> es contratado para desempeñarse en el cargo de <strong>${d.cargo}</strong>, ejecutando las labores operativas exclusivas, temporales y accesorias requeridas para la satisfacción del contrato comercial señalado en el numeral 2.2. Dichas labores corresponden a: <strong>${d.concepto || d.categoria || ''}</strong>, y demás actividades asignadas por su jefe inmediato que sean inherentes al cargo y necesarias para el cumplimiento del objeto del contrato.</p>
  <p class="clausula">CLÁUSULA TERCERA: DE LA MODALIDAD CONTRACTUAL, RECONOCIMIENTO DE TEMPORALIDAD Y PLAZO.</p>
  <p><strong>3.1. Naturaleza de la Modalidad: </strong>El presente documento constituye un <strong>Contrato de Trabajo Sujeto a Modalidad para Servicio Específico</strong>, regulado expresamente por el <strong>Artículo 63° y 72° del Texto Único Ordenado del Decreto Legislativo Nro. 728</strong> – Ley de Productividad y Competitividad Laboral (D.S. N° 003-97-TR).</p>
  <p><strong>3.2. Aceptación de la Temporalidad Derivada: </strong>Las partes reconocen expresamente que la temporalidad del presente contrato se encuentra justificada, de manera irrefutable, en la causa objetiva matriz descrita en la cláusula precedente. <strong>EL TRABAJADOR</strong> declara haber sido debidamente informado, y comprende a cabalidad, que su contratación no obedece a una necesidad autónoma o permanente de la Empresa Comunal, sino que está estrictamente subordinada y condicionada al tiempo que resulte necesario para la ejecución del servicio ante EL CLIENTE.</p>
  <p><strong>3.3. Renuncia a Expectativa de Permanencia Indeterminada: </strong>En virtud del Principio de Causalidad, <strong>EL TRABAJADOR</strong> acepta que la existencia de su puesto de trabajo depende de la vigencia del contrato comercial con la empresa minera titular. Por consiguiente, reconoce que la extinción, resolución o suspensión del contrato comercial matriz conllevará inexorablemente a la terminación del presente vínculo laboral, sin que ello configure continuidad de labores, desnaturalización contractual ni despido arbitrario.</p>`;

  // ── PÁGINA 4 ──────────────────────────────────────────────────────────
  const pag4 = `
  ${pb}
  ${encabezadoWord(4)}
  <p><strong>3.4. Plazo y Duración: </strong>En estricta concordancia con la temporalidad derivada reconocida en la presente cláusula, el plazo de vigencia estimativo del presente contrato rige desde el <strong>${formatFechaCorta(d.contrato_inicio || d.fecha_inicio)}</strong> hasta el <strong>${(d.contrato_fin || d.fecha_fin) ? formatFechaCorta(d.contrato_fin || d.fecha_fin) : 'INDEFINIDO'}</strong>, o hasta la finalización de la necesidad temporal y/o extinción del contrato matriz comercial, lo que ocurra primero. El vínculo laboral terminará de pleno derecho en la fecha señalada o al materializarse la condición resolutoria, sin necesidad de comunicación escrita, preaviso, ni pago de indemnización alguna.</p>
  <p class="clausula">CLÁUSULA CUARTA: RÉGIMEN REMUNERATIVO (JORNAL DIARIO O MENSUAL).</p>
  <p><strong>4.1. </strong>En contraprestación, <strong>EL EMPLEADOR</strong> abonará una remuneración bruta mensual de S/. <strong>${sueldo}</strong> <strong>${sueldoLetras}</strong>.</p>
  <p class="clausula">CLÁUSULA QUINTA: RÉGIMEN DE JORNADA ATÍPICA 14x7 Y HORARIOS</p>
  <p><strong>5.1. JORNADA ATÍPICA: </strong>Las partes convienen expresamente en someterse a un régimen de jornada atípica acumulativa de <strong>catorce (14) días continuos de trabajo</strong>, seguidos de <strong>siete (7) días continuos de descanso</strong>, conforme a lo establecido en el D.S. N°008-2002-TR.</p>
  <p><strong>5.2. HORARIO DE TRABAJO Y TIEMPOS DE DESCANSO: </strong>El horario de trabajo se establece desde las <strong>${d.hora_inicio || '07:00'}</strong> horas hasta las <strong>${d.hora_fin || '19:00'}</strong> horas, comprendiendo un periodo de permanencia de doce (12) horas diarias en la unidad operativa.</p>
  <p>Dentro de dicho horario, EL TRABAJADOR gozará de los siguientes periodos de descanso no laborados:</p>
  <ul class="contrato-list">
    <li>Un (01) descanso de una (01) hora y (15) minutos, destinado a su alimentación principal (almuerzo), Y</li>
    <li>Un (01) descanso adicional de 15 MINUTOS por concepto de refrigerio, en la mañana; y Un (01) descanso adicional de 15 MINUTOS por concepto de refrigerio, en la tarde.</li>
  </ul>
  <p>Asimismo, EL TRABAJADOR podrá realizar labores en sobretiempo de manera voluntaria, conforme a la normativa laboral vigente. El horario y la jornada podrán variar según las necesidades operativas del área, las condiciones climáticas o la implementación de horarios de verano e invierno, siempre dentro de los límites establecidos por ley y conforme a lo dispuesto en el Decreto Supremo N.º 004-2006-TR y el Decreto Supremo N.º 011-2006-TR, o las normas que los sustituyan.</p>
  <p><strong>5.3. COMPENSACIÓN Y FERIADOS:</strong></p>
  <ul class="contrato-list">
    <li><strong>Compensación por Jornada Atípica: </strong>La remuneración mensual pactada incluye una compensación global por la jornada atípica 14x7 y sus particularidades.</li>
    <li><strong>Feriados Laborados: </strong>Los días feriados que coincidan con días de trabajo serán remunerados con el recargo del 100% establecido en el Artículo 6° del D.S. N°012-92-TR, el cual se calculará y pagará adicionalmente a la remuneración mensual.</li>
    <li><strong>Carácter Complementario: </strong>El TRABAJADOR reconoce que la compensación por jornada atípica es independiente y complementaria al pago de feriados, no existiendo duplicidad ni compensación entre ambos conceptos.</li>
  </ul>`;

  // ── PÁGINA 5 ──────────────────────────────────────────────────────────
  const pag5 = `
  ${pb}
  ${encabezadoWord(5)}
  <p><strong>5.4. BASE LEGAL: </strong>Este régimen se acoge a lo dispuesto en el <strong>Artículo 5° del D.S. N°008-2002-TR</strong>, que permite la distribución irregular de la jornada hasta el límite máximo de 12 horas diarias, con cálculo de promedio en periodos trimestrales.</p>
  <p><strong>5.4. SOBRETIEMPO: </strong>Estando a que las labores se desarrollan bajo un régimen atípico y acumulativo de 14x7, de conformidad con el artículo 4 del D.S. N.º 007-2002-TR y la jurisprudencia del Tribunal Constitucional, el trabajo en sobretiempo se determinará en función al promedio de horas laboradas en el ciclo completo (días de trabajo más días de descanso). Se considerará hora extra únicamente al exceso que resulte de promediar la jornada semanal de cuarenta y ocho (48) horas o la jornada diaria de ocho (8) horas dentro del periodo respectivo.</p>
  <p>El tiempo dedicado al refrigerio y descansos establecidos en la cláusula 5.2 no se computará para el cálculo del promedio de la jornada. <strong>Asimismo, el trabajo en sobretiempo es voluntario y requiere autorización previa, expresa y por escrito de la jefatura inmediata; caso contrario, no será reconocido ni generará obligación de pago.</strong></p>
  <p class="clausula">CLÁUSULA SEXTA: OBLIGACIONES DE CONFIDENCIALIDAD Y NO COMPETENCIA.</p>
  <p><strong>6.1. </strong><strong>EL TRABAJADOR</strong> se obliga a mantener estricta confidencialidad sobre toda información técnica, comercial, operativa, estratégica, de clientes, proveedores, métodos de trabajo y cualquier dato de <strong>EL EMPLEADOR</strong> o de sus clientes al que tenga acceso. Esta obligación subsistirá por <strong>tres (3) años</strong> posteriores a la terminación del contrato.</p>
  <p><strong>6.2. Protección de Datos: </strong><strong>EL TRABAJADOR</strong> autoriza expresamente a <strong>EL EMPLEADOR</strong> al tratamiento de sus datos personales, inclusive de carácter sensible (como resultados de exámenes médicos), para los fines de la relación laboral, y para compartirlos con sus empresas clientes cuando sea necesario, de conformidad con la <strong>Ley N°29733 - Ley de Protección de Datos Personales</strong>.</p>
  <p><strong>6.3. No Competencia: </strong>Durante la vigencia del contrato, <strong>EL TRABAJADOR</strong> se abstendrá de prestar servicios, directa o indirectamente, a empresas competidoras de <strong>EL EMPLEADOR</strong> en el sector minero y de construcción.</p>
  <p class="clausula">CLÁUSULA SÉPTIMA: PROPIEDAD INTELECTUAL E INNOVACIONES.</p>
  <p>Cualquier invento, innovación, mejora de proceso, desarrollo técnico o creación intelectual que <strong>EL TRABAJADOR</strong> realice con ocasión de su trabajo, será propiedad exclusiva de <strong>EL EMPLEADOR</strong>, quien podrá patentarlo o utilizarlo libremente, sin obligación de compensación adicional alguna, conforme al <strong>Artículo 50° de la LPCL</strong>.</p>
  <p class="clausula">CLÁUSULA OCTAVA: TERMINACIÓN AUTOMÁTICA Y RESOLUCIÓN.</p>
  <p><strong>8.1. Terminación Automática: </strong>El presente contrato se extinguirá automáticamente, sin responsabilidad indemnizatoria para <strong>EL EMPLEADOR</strong>, por la culminación de la obra o servicio específico, por la terminación, resolución o anulación del contrato principal con la empresa cliente, o por la finalización de la necesidad temporal propia que dio origen al contrato.</p>
  <p><strong>8.2. Resolución por Causa Imputable al Trabajador: </strong>Constituyen causas suficientes para la resolución del contrato sin indemnización, entre otras: la falsedad documentaria o declarativa, el incumplimiento grave de sus obligaciones, el incumplimiento reiterado de las normas de seguridad y salud en el trabajo, y el incumplimiento de las obligaciones de confidencialidad.</p>`;

  // ── PÁGINA 6 ──────────────────────────────────────────────────────────
  const pag6 = `
  ${pb}
  ${encabezadoWord(6)}
  <p class="clausula">CLÁUSULA NOVENA: AUTORIZACIÓN DE DESCUENTOS Y RESPONSABILIDAD PATRIMONIAL.</p>
  <p><strong>9.1. De la Responsabilidad: </strong><strong>EL TRABAJADOR</strong> asume responsabilidad económica por la pérdida, extravío o deterioro -distinto al desgaste natural por el uso- de las herramientas, equipos de protección personal (EPP), fotochecks, manuales y cualquier otro bien entregado por <strong>EL EMPLEADOR</strong> para el desempeño de sus funciones, conforme se detalle en el ANEXO 05 (Acta de Entrega y Recepción).</p>
  <p><strong>9.2. Autorización Expresa de Descuento: </strong>En virtud de lo dispuesto por el <strong>Artículo 40° del D.S. N° 001-97-TR (Ley de CTS)</strong> y el Principio de Autonomía de la Voluntad, <strong>EL TRABAJADOR</strong> autoriza a <strong>EL EMPLEADOR</strong> de manera libre, voluntaria e irrevocable a descontar de sus remuneraciones mensuales y/o de sus beneficios sociales (gratificaciones, vacaciones truncas, bonificaciones y/o CTS), el valor de reposición de los bienes señalados en el numeral anterior que no sean devueltos al término del vínculo laboral o que presenten daños por negligencia comprobada.</p>
  <p><strong>9.3. Multas y Penalidades: </strong>Asimismo, <strong>EL TRABAJADOR</strong> autoriza el descuento de aquellos montos derivados de multas de tránsito o sanciones administrativas impuestas a la unidad vehicular a su cargo o a <strong>EL EMPLEADOR</strong>, siempre que se acredite mediante el informe correspondiente que dicha infracción fue consecuencia de la inobservancia de las normas de tránsito o reglamentos internos por parte de <strong>EL TRABAJADOR</strong>.</p>
  <p><strong>9.4. Límites del Descuento: </strong>Los descuentos referidos se realizarán respetando los límites legales de inembargabilidad de las remuneraciones, salvo en el caso de la liquidación final de beneficios sociales, donde se aplicará sobre el saldo neto disponible conforme a la autorización aquí otorgada.</p>
  <p class="clausula">CLÁUSULA DÉCIMO: NOTIFICACIONES ELECTRÓNICAS.</p>
  <p><strong>10.1. </strong>Las partes acuerdan expresamente que todas las comunicaciones, notificaciones, citaciones y/o remisión de documentos (incluyendo boletas de pago, liquidaciones y comunicaciones de fin de vínculo) derivadas de la presente relación laboral, tendrán plena validez legal cuando sean cursadas a través de los siguientes medios electrónicos proporcionados por <strong>EL TRABAJADOR</strong> en el encabezado y en su Declaración Jurada de Datos:</p>
  <ul class="contrato-list">
    <li><strong>Correo Electrónico: </strong><strong>${d.email}</strong></li>
    <li><strong>Mensajería Instantánea (WhatsApp): </strong><strong>${d.celular}</strong></li>
  </ul>
  <p><strong>10.2. </strong><strong>EL TRABAJADOR</strong> reconoce que el acceso a dichos medios es de su uso personal y exclusivo, por lo que las notificaciones se entenderán válidamente efectuadas en la fecha de envío del correo electrónico o de la confirmación de recepción/entrega en la aplicación de mensajería (doble check), sin perjuicio de la confirmación de lectura.</p>
  <p><strong>10.3. </strong>Es obligación de <strong>EL TRABAJADOR</strong> mantener activos dichos canales y comunicar por escrito cualquier variación de estos en un plazo no mayor a 24 horas de ocurrido el cambio. El incumplimiento de esta obligación hará que las notificaciones enviadas a los medios anteriores sigan surtiendo plenos efectos legales.</p>`;

  // ── PÁGINA 7 ──────────────────────────────────────────────────────────
  const pag7 = `
  ${pb}
  ${encabezadoWord(7)}
  <p class="clausula">CLÁUSULA DÉCIMO PRIMERO: SALUD OCUPACIONAL Y EMO.</p>
  <p><strong>11.1. </strong><strong>EL TRABAJADOR</strong> declara bajo juramento gozar de óptima salud física y mental para el desempeño de las labores propias de su cargo, las cuales conoce y acepta.</p>
  <p><strong>11.2. </strong>Es obligación de <strong>EL TRABAJADOR</strong> someterse a los Exámenes Médicos Ocupacionales (EMO) de ingreso, periódicos y de retiro, así como a las pruebas de descarte de alcohol y drogas que <strong>EL EMPLEADOR</strong> o EL CLIENTE dispongan.</p>
  <p><strong>11.3. </strong>El ocultamiento de enfermedades preexistentes o lesiones anteriores a la contratación que impidan el normal desarrollo de sus funciones, será considerado falta grave por quebrantamiento de la buena fe laboral, facultando a <strong>EL EMPLEADOR</strong> a resolver el contrato sin responsabilidad.</p>
  <p class="clausula">CLÁUSULA DÉCIMO SEGUNDO: RESPONSABILIDAD PERSONAL.</p>
  <p><strong>12.1. </strong><strong>EL TRABAJADOR</strong> es responsable administrativo, civil y penalmente por los daños que cause a terceros, a la propiedad de <strong>EL EMPLEADOR</strong> o de EL CLIENTE, derivados de la conducción negligente, imprudente o por inobservancia de las normas de seguridad vial y reglamentos mineros.</p>
  <p><strong>12.2. </strong><strong>EL TRABAJADOR</strong> se compromete a reportar inmediatamente cualquier incidente o accidente, por mínimo que sea. El reporte tardío o la omisión de este será causal de sanción disciplinaria severa.</p>
  <p class="clausula">CLÁUSULA DÉCIMO TERCERO: ANTICORRUPCIÓN Y ÉTICA.</p>
  <p><strong>13.1. </strong><strong>EL TRABAJADOR</strong> se compromete a actuar bajo principios de integridad y ética, prohibiéndosele solicitar, aceptar u ofrecer cualquier tipo de pago indebido, dádiva o beneficio a favor de funcionarios de EL CLIENTE o de <strong>EL EMPLEADOR</strong>.</p>
  <p><strong>13.2. </strong>El incumplimiento de los lineamientos éticos o la participación en actos de corrupción debidamente comprobados, dará lugar al despido inmediato y a la denuncia penal correspondiente bajo los alcances del <strong>Decreto Legislativo N° 1352</strong> y normas conexas.</p>
  <p class="clausula">CLÁUSULA DÉCIMO CUARTA: DEBERES DEL TRABAJADOR Y FACULTAD DISCIPLINARIA.</p>
  <p><strong>15.1. Cumplimiento Normativo: </strong><strong>EL TRABAJADOR</strong> se obliga a cumplir sus funciones con lealtad, eficiencia y probidad, sujetándose estrictamente a las disposiciones del Reglamento Interno de Trabajo (RIT), el Reglamento de Seguridad y Salud en el Trabajo (RISST), y las directivas específicas emitidas por <strong>EL EMPLEADOR</strong> o EL CLIENTE minero.</p>
  <p><strong>15.2. Deberes Críticos: </strong>Sin perjuicio de lo establecido en el RIT, son deberes esenciales de <strong>EL TRABAJADOR</strong>:</p>
  <ol type="a" class="contrato-list" style="padding-left:40px;">
    <li>Cuidar y mantener en buen estado las unidades vehiculares (volquetes) y equipos asignados.</li>
    <li>Reportar inmediatamente cualquier falla mecánica o incidente de seguridad.</li>
    <li>Respetar los estándares de velocidad y seguridad vial de la unidad minera.</li>
    <li>Someterse a los controles de fatiga y somnolencia establecidos.</li>
  </ol>
  <p><strong>15.3. Reconocimiento de Sanciones: </strong><strong>EL TRABAJADOR</strong> declara conocer que el incumplimiento de estos deberes, así como de las prohibiciones contenidas en el RIT, constituye falta grave susceptible de sanción disciplinaria, la cual puede oscilar desde una amonestación hasta el despido, según la gravedad de la falta y lo previsto en el <strong>Artículo 25° de la LPCL</strong>.</p>`;

  // ── PÁGINA 8 ──────────────────────────────────────────────────────────
  const pag8 = `
  ${pb}
  ${encabezadoWord(8)}
  <p class="clausula">CLÁUSULA DÉCIMO CUARTA: JURISDICCIÓN Y DOMICILIO.</p>
  <p>Para cualquier controversia derivada del presente contrato, las partes se someten a la jurisdicción de los Jueces y Salas Especializadas de <strong>La Oroya</strong>, renunciando a cualquier otro fuero o jurisdicción. Se establecen como domicilios los consignados en el encabezado.</p>
  <p style="font-weight:bold; margin:8px 0 3px;">DISPOSICIONES COMPLEMENTARIAS:</p>
  <p>En todo lo no previsto en el presente contrato, se aplicarán las disposiciones del <strong>D.S. N°003-97-TR (LPCL)</strong>, la <strong>Ley N°29783 - Ley de Seguridad y Salud en el Trabajo</strong>, el <strong>Reglamento Interno de Trabajo</strong> y el <strong>Reglamento de Seguridad y Salud</strong> de <strong>EL EMPLEADOR</strong>, los cuales <strong>EL TRABAJADOR</strong> declara conocer y aceptar.</p>
  <p><strong>ANEXOS OBLIGATORIOS (Forman parte integral del contrato):</strong></p>
  <ul class="contrato-list">
    <li>ANEXO 01: Régimen de Jornada Acumulativa 14x7 (Detallado).</li>
    <li>ANEXO 02: Política de Confidencialidad y Protección de Datos.</li>
    <li>ANEXO 03: Política de Seguridad y Salud en el Trabajo (SST).</li>
    <li>ANEXO 04: Carta de Compromiso Política de Cero Alcohol y Drogas.</li>
    <li>ANEXO 05: Acta de Entrega, Recepción y Compromiso de Devolución de Equipos de Protección Personal (EPP) e Implementos de Seguridad.</li>
  </ul>
  <p>En señal de conformidad, las partes firman el presente contrato en dos ejemplares del mismo tenor y a un solo efecto, en el Distrito de Yauli, a los <strong>${fechaFirma}</strong></p>
  ${firmasWord(nombre, d.dni)}`;

  return pag1 + pag2 + pag3 + pag4 + pag5 + pag6 + pag7 + pag8;
}

function paginaAnexo01Word(d) {
  const pb = '<br clear="all" style="page-break-before:always; mso-break-type:section-break;" />';
  return `
  ${pb}
  ${encabezadoWord(9)}
  <h3>ANEXO Nº01<br/>CONVENIO INDIVIDUAL PARA EL ESTABLECIMIENTO DE<br/>RÉGIMEN ACUMULATIVO DE JORNADA DE TRABAJO Y DESCANSO</h3>
  <p>Por el presente documento las partes del "CONTRATO DE TRABAJO SUJETO A MODALIDAD POR SERVICIO ESPECIFICO", que celebran de una parte EMPRESA COMUNAL DE SERVICIOS MÚLTIPLES YAULI - ECOSERMY, con RUC Nº20516385813, debidamente representada por su presidente el Sr. Juan Francisco BERNALDO SABUCO, con DNI Nº04019887, a quien en adelante se le denominará EL EMPLEADOR; y de la otra parte la Sr(a). <span class="highlight">${d.nombre_completo}</span> con DNI Nº <span class="highlight">${d.dni}</span>, a quien en adelante se le denominará EL TRABAJADOR; en razón de la naturaleza de la Empresa; las partes convienen de manera expresa y voluntaria, en aplicación de lo dispuesto en el Convenio Internacional de Trabajo N°1 de la OIT, Decreto Legislativo N°854 modificado por Ley N°27671, D. S. N°008-2002-TR, y complementarias, establecer un Régimen Alternativo de Acumulación de Jornada de Trabajo Atípico y Descanso, mediante el cual queda establecido que:</p>
  <p><strong>PRIMERO:</strong> EL TRABAJADOR prestará servicios en el centro de trabajo según régimen laboral establecido por nuestro cliente, de trabajo continúo seguido por de descanso continuo. El periodo de labores incluirá los días sábados, domingos y feriados, asimismo queda convenido que el periodo acumulativo en promedio no excederá de las horas de trabajo establecidos por Ley dentro del horario establecido en EL EMPLEADOR: <u>Turno día</u> de 07:00 a 12:00 horas y de 13:00 a 19:00 horas, el refrigerio se tomará de 12:00 a 13:00 horas; y <u>Turno noche</u> de 19:00 a 7:00 horas, el descanso se tomará de una hora en coordinación con el Supervisor encargado.<br/>Este horario podrá ser modificado de acuerdo a las necesidades de EL EMPLEADOR, sin necesidad de sustentar estas necesidades ante EL TRABAJADOR.</p>
  <p><strong>SEGUNDO:</strong> EL TRABAJADOR para el desarrollo de sus actividades privadas y familiares tomará su periodo acumulativo de descanso fuera de la Unidad de Trabajo.</p>
  <p><strong>TERCERA:</strong> En caso se produzcan faltas injustificadas, sanciones de suspensión, permisos sin goce de haberes o cualquier otra falta que a criterio de suspensión no se encuentra justificado, el pago se efectuará sobre los días efectivamente laborados y la aplicación del descuento proporcional.</p>
  <p><strong>CUARTA:</strong> Queda expresamente convenido que EL EMPLEADOR podrá modificar el convenio en función a sus necesidades operativas o administrativas, dejándose constancia que la modificación que pudiera efectuarse no afecte los derechos de EL TRABAJADOR a la jornada máxima de Ley, ni a los descansos semanales obligatorios establecido por ley.</p>
  <p><strong>QUINTO:</strong> EL TRABAJADOR declara expresamente conocer las implicancias del Régimen Acumulativo de Jornada de Trabajo y Descanso que se establece mediante el presente Convenio, igualmente reconoce expresamente que no se vulnera su derecho de la Jornada Máxima Legal y a su descanso semanal obligatorio.</p>
  <p>Como muestra de conformidad con todas las cláusulas del presente convenio firman las partes, por duplicado a <span class="highlight">${formatFecha(d.contrato_inicio)}</span></p>
  ${firmasWord(d.nombre_completo, d.dni)}`;
}

function paginaAnexo02Word(d) {
  const pb = '<br clear="all" style="page-break-before:always; mso-break-type:section-break;" />';
  return `
  ${pb}
  ${encabezadoWord(10)}
  <h3>ANEXO Nº02<br/>POLÍTICA DE CONFIDENCIALIDAD Y PROTECCIÓN DE DATOS</h3>
  <p style="margin-top:30px;">Yo, <span class="highlight">${d.nombre_completo}</span>, identificado con DNI N° <span class="highlight">${d.dni}</span> en mi calidad de TRABAJADOR de ECOSERMY, DECLARO:</p>
  <p style="margin-top:30px;"><strong>OBLIGACIÓN DE CONFIDENCIALIDAD:</strong> Me comprometo a mantener absoluta reserva sobre toda información, documentación, datos, procedimientos, métodos de trabajo, estrategias comerciales, listas de clientes, información técnica y cualquier otro dato al que tenga acceso durante mi relación laboral.</p>
  <p style="margin-top:20px;"><strong>PROHIBICIÓN DE DIVULGACIÓN:</strong> No revelaré, compartiré, utilizaré en provecho propio o de terceros, ni divulgaré de ninguna forma información confidencial del EMPLEADOR o de sus clientes.</p>
  <p style="margin-top:20px;"><strong>PROTECCIÓN DE DATOS:</strong> Autorizo al EMPLEADOR al tratamiento de mis datos personales, incluidos datos sensibles (resultados médicos), para fines laborales y para compartirlos con clientes cuando sea necesario, conforme a la Ley N°29733.</p>
  <p style="margin-top:20px;"><strong>DURACIÓN:</strong> Esta obligación subsiste por TRES (3) AÑOS posteriores a la terminación de mi contrato.</p>
  <p style="margin-top:20px;"><strong>CONSECUENCIAS:</strong> El incumplimiento de esta obligación constituye falta grave y faculta al EMPLEADOR a tomar acciones legales, incluida la demanda por daños y perjuicios.</p>
  ${firmaSoloTrabajadorWord(d.nombre_completo, d.dni)}`;
}

function paginasAnexo03Word(d) {
  const pb = '<br clear="all" style="page-break-before:always; mso-break-type:section-break;" />';
  const items = [
    'Cumplir permanentemente con las normas de seguridad establecidas en el Reglamento Interno de Seguridad y Salud Ocupacional en el Trabajo.',
    'Conocer y aplicar su Derecho de Negativa al Trabajo Peligroso, cuando un trabajo sea exigido en condiciones que no son las adecuadas.',
    'Conocer y mostrar participación en el cumplimiento a los objetivos de Seguridad planteados por nuestra empresa ECOSERMY.',
    'No fumar dentro de las instalaciones de ECOSERMY y en el área de trabajo en cumplimiento de la Ley y como medida de control básica para prevenir incendios.',
    'Estar siempre alerta y consciente de la tarea a realizar. Mantener el estado de alerta y cuidarse así mismo concentrándose en la tarea, evitando distracciones, identificando y controlando los peligros en su entorno, llenando el IPERC y/o ATS.',
    'Repasar y Comprender los formatos que le hayan sido entregados en función de cumplir con nuestro Programa Anual de Seguridad y demás reglamentos. Ante cualquier duda, siempre tomar la premisa de consultar.',
    'Conducir los vehículos en forma segura evitando distraerse hablando por celular, respetando los límites de velocidad, parando completamente en los cruces de vías de tránsito de vehículos.',
    'Usar la maquinaria de movimiento de carga de acuerdo a las especificaciones del fabricante respetando los límites de velocidad y los límites de carga establecidos.',
    'Usar sólo herramientas originales, en buen estado de conservación y de acuerdo a las especificaciones del fabricante. Mantener una lista de las herramientas que usa en el trabajo y revisarlas periódicamente para garantizar su buen estado. Solicite el cambio cuando lo requiera.',
    'Usar equipo de protección personal original y autorizada por el área de seguridad de ECOSERMY, y de ser necesario, rectificado por la Empresa Cliente.',
    'Resguardar el equipo de protección para mantenerlo en buen estado. Revisar el equipo de protección personal en forma diaria en busca de daños. Solicitar el cambio de su equipo de protección cuando detecte algún daño.',
    'Respetar las buenas prácticas para el uso y almacenamiento de productos químicos: usar el equipo de protección estándar que incluye lentes de seguridad, protección respiratoria de media cara con cartuchos adecuados para el producto químico a utilizar y guantes de nitrilo; rotular los envases de los productos químicos con su nombre comercial, código de las naciones unidas y rombo de la NFPA; mantener los recipientes siempre cerrados para evitar derrames; segregar los productos químicos, separando los productos inflamables de los oxidantes; controlar los derrames de los productos químicos en forma inmediata y segura para las personas, el medio ambiente y siguiendo las instrucciones de la hoja de seguridad del producto (MSDS).',
    'Cumplir con las recomendaciones de seguridad de los avisos publicados en las instalaciones de ECOSERMY y en las áreas de trabajo (señalización preventiva de seguridad).',
    'Respetar las zonas de seguridad en caso de sismo, accesos a extintores y equipos contraincendios, los cuales deben estar siempre despejadas.',
    'Cumplir con los permisos de trabajos especiales de alto riesgo PETAR como, por ejemplo: los trabajos en altura, "todo el personal que realice una actividad a más de 1.8 metros debe usar arnés de seguridad"; trabajos en caliente, "se debe contar con un extintor y despejar la zona de material inflamable o combustible".',
    'Dar alerta en las maniobras de izaje de geo sintéticos, objetos pesados y asegurar la zona de trabajo para evitar que una persona pase debajo de la carga suspendida.',
    'Controlar el uso de escaleras para ascender a otros niveles ya que el mal uso de los mismos puede generar caídas y accidentes incapacitantes y/o mortales.',
    'No emprender ningún trabajo y/o actividad para el cual no ha recibido entrenamiento o que pueda poner en peligro tanto a la persona que realiza la actividad como a sus compañeros de trabajo o las instalaciones.',
    'Promover el trabajo seguro del equipo de trabajo, no interfiriendo en sus actividades salvo que observe incumplimiento de las normas de seguridad en cuyo caso deberá solicitar paralización del trabajo y comunicar de inmediato a su supervisor de seguridad y al de operaciones de ECOSERMY. Toda instrucción de trabajo operativa debe ser dada por su propio supervisor y con conocimiento del de seguridad.',
    'Asistir y participar activamente en las inducciones, charlas o cursos de capacitación y/o entrenamiento sobre Seguridad y Salud Ocupacional en el trabajo, Medio Ambiente, Responsabilidad Social y Calidad a las que sea convocado.',
    'Ningún trabajador intervendrá, cambiará, desplazará, dañará los dispositivos de seguridad destinados a su protección, o la de terceros, ni cambiará los métodos o procedimientos adoptados.',
    'Cooperar y participar en el proceso de investigación de los accidentes de trabajo y las enfermedades ocupacionales cuando se requiera.',
    'Mantener las condiciones de orden y limpieza en todos los lugares y actividades de trabajo en las que participe, cumpliendo con hacer la limpieza y orden del área de trabajo al final de su jornada.',
    'Comunicar al jefe inmediato todo evento o situación que ponga o pueda poner en riesgo su seguridad y salud y/o de las instalaciones físicas, debiendo aportar inmediatamente, de ser posible, las medidas correctivas del caso.',
    'Están prohibidas las bromas, juegos bruscos y trabajar bajo el efecto del alcohol o estupefacientes.',
    'Participar en las charlas de 5 minutos en forma madura y responsable prestando atención a las recomendaciones dadas por el expositor y poniéndolas en práctica durante sus actividades del día.',
    'Conocer y aplicar las políticas de Seguridad de nuestra empresa ECOSERMY, así como de la Empresa Cliente.',
    'Participar en la elaboración del Análisis de Trabajo Seguro (ATS), aportando su conocimiento y experiencia para identificar y controlar los riesgos presentes en la operación.',
    'Al ingresar al área de trabajo y como medida básica de prevención de accidentes dentro de nuestras instalaciones, usar siempre el Equipo de Protección Personal (EPPs). Solo en oficinas, unidades móviles y comedores, se puede no usar el EPPs.',
    'Usar la movilidad para trasladarse en forma segura, subiendo y descendiendo de ella sólo en los paraderos y/o zonas autorizadas.',
    'Asistir a los exámenes médicos pre-ocupacionales, anuales y de retiro a los que sean programados. Es requisito indispensable que el trabajador pase su examen de retiro para documentar su estado de salud, dentro de los 30 días calendarios al cese de labores.',
    'Cooperar con su jefe inmediato en la implementación y/o ejecución de las normas de seguridad y estándares de seguridad contenidos en el Reglamento para proteger la seguridad y salud de los trabajadores.',
    'Realizar de forma eficaz las tareas de Seguridad, Salud Ocupacional y Media Ambiente que le hayan sido encomendadas. Entregarlas en las fechas características indicadas.',
    'Mantener la calma durante una emergencia, no correr, colocarse en las zonas de seguridad establecidas y señalizadas, conforme a los ejercicios de evacuación realizados.',
    'Comunicar en forma inmediata los incidentes y accidentes a sus jefes inmediato solicitando ayuda y solicitando a su vez que éste comunique el hecho al número de Emergencias. Todos los incidentes y accidentes deben ser reportados, incluso aquellos que se clasifiquen como leves.',
    'Colaborar con la primera respuesta en caso de accidentes e incidentes, asegurando la zona de accidente e incidentes, comunicando el hecho y solicitando ayuda y dando los primeros auxilios en el caso de estar entrenado.',
    'Utilizar los cilindros para segregar los residuos, según la clasificación de colores determinado para tal fin.',
    'Intervenir y comunicar los riesgos a las personas involucradas cuando detecte una condición o acto sub estándar en el proceso, sin importar la jerarquía de los trabajadores involucrados.',
  ];

  const grupo1 = items.slice(0, 11);   // ítems 1-11
  const grupo2 = items.slice(11, 31);  // ítems 12-31
  const grupo3a = items.slice(31, 36); // ítems 32-36
  const grupo3b = items.slice(36);     // ítems 37-38
  const fechaFirmaSST = '31 de marzo del 2026';

  const pag11 = `
  ${pb}
  ${encabezadoWord(11)}
  <h3>ANEXO N°03<br/>RECOMENDACIONES EN MATERIA DE SEGURIDAD Y SALUD EN EL TRABAJO<br/><u>(Ley N° 29783, Art. 35, inc. c)</u></h3>
  <p>Por medio del presente documento, y en aplicación de las obligaciones contenidas en la Ley N°29783, Ley de Seguridad y Salud en el trabajo, EL EMPLEADOR cumple con adjuntar al contrato de trabajo las presentes recomendaciones generales en materia de Seguridad y Salud en el Trabajo, Políticas de la Empresa <u>Ecosermy</u> y otras directivas de Seguridad y Salud en el Trabajo complementarias. En ese sentido, EL TRABAJADOR se obliga a cumplir rigurosamente las disposiciones que a continuación se indican:</p>
  <ol class="sst-list">
    ${grupo1.map(item => `<li>${item}</li>`).join('')}
  </ol>`;

  const pag12 = `
  ${pb}
  ${encabezadoWord(12)}
  <ol class="sst-list" start="12">
    ${grupo2.map(item => `<li>${item}</li>`).join('')}
  </ol>`;

  const pag13 = `
  ${pb}
  ${encabezadoWord(13)}
  <ol class="sst-list" start="32">
    ${grupo3a.map(item => `<li>${item}</li>`).join('')}
  </ol>`;

  const pag14 = `
  ${pb}
  ${encabezadoWord(14)}
  <ol class="sst-list" start="37">
    ${grupo3b.map(item => `<li>${item}</li>`).join('')}
  </ol>
  <p style="text-align:right; margin-top:30px;"><strong>${fechaFirmaSST}</strong></p>
  ${firmasWord(d.nombre_completo, d.dni)}`;

  return pag11 + pag12 + pag13 + pag14;
}

function paginaAnexo04Word(d) {
  const pb = '<br clear="all" style="page-break-before:always; mso-break-type:section-break;" />';
  const fechaFirma = '31 de marzo del 2026';

  return `
  ${pb}
  ${encabezadoWord(15)}
  <h3>ANEXO N°04<br/>CARTA DE COMPROMISO<br/>POLÍTICA DE TOLERANCIA CERO AL ALCOHOL Y DROGAS</h3>
  <table style="margin:40px 0 30px 40px; font-size:11pt;" cellpadding="4">
    <tr><td width="80" style="padding:6px 0;"><strong>YO</strong></td><td style="padding:6px 10px;">:</td><td><span class="highlight">${d.nombre_completo}</span></td></tr>
    <tr><td style="padding:6px 0;"><strong>DNI Nº</strong></td><td style="padding:6px 10px;">:</td><td><span class="highlight">${d.dni}</span></td></tr>
    <tr><td style="padding:6px 0;"><strong>CARGO</strong></td><td style="padding:6px 10px;">:</td><td><span class="highlight">${d.cargo}</span></td></tr>
  </table>
  <p style="margin-top:30px;"><strong><u>ME COMPROMETO A:</u></strong></p>
  <p>Cumplir fielmente la Política de Tolerancia CERO al Alcohol y Drogas de <u>ECOSERMY</u>.</p>
  <ul class="contrato-list" style="margin-top:20px;">
    <li>De incumplir dicha política, soy consciente de la aplicación de la gestión de consecuencias (falta grave).</li>
    <li>De incumplir el presente compromiso estoy llano a someterme a las medidas correctivas que ECOSERMY demande.</li>
  </ul>
  <p style="text-align:right; margin-top:40px;"><span class="highlight">${fechaFirma}</span></p>
  <table width="100" align="center" style="margin-top:40px; border:1px solid #ccc;">
    <tr><td align="center" style="height:100px; color:#ccc; font-size:9px;">Huella</td></tr>
  </table>
  ${firmaSoloTrabajadorWord(d.nombre_completo, d.dni)}`;
}

function paginaAnexo05Word(d) {
  const pb = '<br clear="all" style="page-break-before:always; mso-break-type:section-break;" />';
  const fechaFirma = '31 de marzo del 2026';
  const nombre = d.nombre_completo || `${d.apellidos || ''} ${d.nombres || ''}`.trim();

  return `
  ${pb}
  ${encabezadoWord(16)}
  <h3>ANEXO N°05<br/>ACTA DE ENTREGA, RECEPCIÓN Y COMPROMISO DE DEVOLUCIÓN DE<br/>EQUIPOS DE PROTECCIÓN PERSONAL (EPP) E IMPLEMENTOS DE SEGURIDAD</h3>
  <p><strong>1. DATOS DEL TRABAJADOR:</strong></p>
  <table style="margin-left:20px; margin-bottom:10px;" cellpadding="2">
    <tr><td width="140"><strong>Apellidos y Nombres</strong></td><td width="10">:</td><td>${nombre}</td></tr>
    <tr><td><strong>DNI</strong></td><td>:</td><td>${d.dni}</td></tr>
    <tr><td><strong>Cargo</strong></td><td>:</td><td>${d.cargo}</td></tr>
    <tr><td><strong>Proyecto/Unidad</strong></td><td>:</td><td>${d.unidad || ''}</td></tr>
  </table>
  <p><strong>2. DECLARACIÓN DE RECEPCIÓN: </strong>Por la presente, el trabajador declara haber recibido de parte de la EMPRESA COMUNAL DE SERVICIOS MÚLTIPLES YAULI – ECOSERMY, los Equipos de Protección Personal (EPP) e implementos de seguridad que se detallan a continuación, en estado NUEVO y en perfectas condiciones de operatividad:</p>
  <table width="100%" border="1" cellpadding="3" cellspacing="0" style="border-collapse:collapse; margin:8px 0 10px 0;">
    <tr style="background:#eee;">
      <td width="8%" align="center" style="border:1px solid #000;"><strong>ÍTEM</strong></td>
      <td width="47%" align="center" style="border:1px solid #000;"><strong>DESCRIPCIÓN DEL EQUIPO / HERRAMIENTA</strong></td>
      <td width="13%" align="center" style="border:1px solid #000;"><strong>CANTIDAD</strong></td>
      <td width="13%" align="center" style="border:1px solid #000;"><strong>ESTADO</strong></td>
      <td width="19%" align="center" style="border:1px solid #000;"><strong>VALOR REF. (S/.)</strong></td>
    </tr>
    <tr><td align="center" style="border:1px solid #000;">01</td><td style="border:1px solid #000;">Casco de seguridad con barbiquejo</td><td align="center" style="border:1px solid #000;">01</td><td align="center" style="border:1px solid #000;">Nuevo</td><td style="border:1px solid #000;"></td></tr>
    <tr><td align="center" style="border:1px solid #000;">02</td><td style="border:1px solid #000;">Zapatos de seguridad con punta de acero</td><td align="center" style="border:1px solid #000;">01 par</td><td align="center" style="border:1px solid #000;">Nuevo</td><td style="border:1px solid #000;"></td></tr>
    <tr><td align="center" style="border:1px solid #000;">03</td><td style="border:1px solid #000;">Lentes de seguridad (Claros/Oscuros)</td><td align="center" style="border:1px solid #000;">01</td><td align="center" style="border:1px solid #000;">Nuevo</td><td style="border:1px solid #000;"></td></tr>
    <tr><td align="center" style="border:1px solid #000;">04</td><td style="border:1px solid #000;">Chaleco reflectivo con logo ECOSERMY</td><td align="center" style="border:1px solid #000;">01</td><td align="center" style="border:1px solid #000;">Nuevo</td><td style="border:1px solid #000;"></td></tr>
    <tr><td align="center" style="border:1px solid #000;">05</td><td style="border:1px solid #000;">Mameluco térmico / Ropa de trabajo</td><td align="center" style="border:1px solid #000;">02</td><td align="center" style="border:1px solid #000;">Nuevo</td><td style="border:1px solid #000;"></td></tr>
    <tr><td align="center" style="border:1px solid #000;">06</td><td style="border:1px solid #000;">Protectores auditivos (Tapones/Orejeras)</td><td align="center" style="border:1px solid #000;">01</td><td align="center" style="border:1px solid #000;">Nuevo</td><td style="border:1px solid #000;"></td></tr>
    <tr><td align="center" style="border:1px solid #000;">07</td><td style="border:1px solid #000;">Fotocheck de identificación / Fotocheck Mina</td><td align="center" style="border:1px solid #000;">01</td><td align="center" style="border:1px solid #000;">Nuevo</td><td style="border:1px solid #000;"></td></tr>
    <tr><td align="center" style="border:1px solid #000;">08</td><td style="border:1px solid #000;"><em>Otros: Radios, Herramientas, etc.</em></td><td align="center" style="border:1px solid #000;"></td><td align="center" style="border:1px solid #000;"></td><td style="border:1px solid #000;"></td></tr>
  </table>
  <p><strong>3. COMPROMISOS DEL TRABAJADOR: </strong>El trabajador, al firmar el presente anexo, reconoce y acepta las siguientes obligaciones:</p>
  <ul class="contrato-list">
    <li><strong>Uso Obligatorio: </strong>Utilizar los EPP de forma permanente y correcta durante su jornada laboral, conforme a la Ley N° 29783 y el RISST.</li>
    <li><strong>Cuidado y Conservación: </strong>Mantener los equipos en buen estado, siendo responsable por su pérdida, extravío o deterioro por uso negligente.</li>
    <li><strong>Reporte de Daños: </strong>Informar inmediatamente a su supervisor en caso de que un EPP sufra un daño que comprometa la seguridad, para su reposición.</li>
    <li><strong>Devolución: </strong>Devolver la totalidad de los equipos e implementos al término del vínculo laboral, o cuando se le asigne un nuevo kit por renovación.</li>
  </ul>
  <p><strong>4. AUTORIZACIÓN EXPRESA DE DESCUENTO (CLÁUSULA DE RESGUARDO): </strong>En concordancia con la Cláusula Novena del Contrato de Trabajo, el trabajador autoriza de manera irrevocable a ECOSERMY a descontar de su remuneración mensual o, preferentemente, de su Liquidación de Beneficios Sociales (CTS, vacaciones, gratificaciones), el valor de reposición de los equipos detallados en el cuadro anterior que no sean devueltos al cese de la relación laboral o que presenten daños irreparables por negligencia comprobada.</p>
  <p><strong>5. VALIDEZ PROBATORIA: </strong>El trabajador reconoce que la entrega de estos equipos es gratuita para el desempeño de sus labores, pero su reposición por pérdida es de su entera cuenta y costo. El presente documento constituye prueba suficiente de la entrega de los EPP para fines de las auditorías de seguridad del CLIENTE MINERO y de la Autoridad Administrativa de Trabajo.</p>
  <p>En señal de conformidad, se firma la presente Acta en el Distrito de Yauli, a los <strong>${fechaFirma}</strong></p>
  <table width="250" align="center" style="margin-top:40px;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
          <tr>
            <td style="border-top:1px solid #000; padding-top:10px;" align="center">
              <p style="text-align:center; margin:0;"><strong>${nombre}</strong></p>
              <p style="text-align:center; margin:0;">D.N.I. N° ${d.dni}</p>
              <p style="text-align:center; margin:0;">EL TRABAJADOR</p>
            </td>
            <td style="padding-left:10px; vertical-align:top;">
              <table border="1" cellpadding="0" cellspacing="0" style="border:1px solid #000; width:44px; height:50px;">
                <tr><td align="center" valign="middle" style="color:#ccc; font-size:7px;">Huella</td></tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}

/**
 * Genera HTML optimizado para exportar a Word (.doc).
 * Usa namespaces XML de Office, estilos mso-*, y page breaks compatibles con Word.
 * @param {Object} datos - Datos del empleado
 * @returns {string} HTML Word-compatible completo
 */
export function generarContratoWord(datos) {
  const paginas = [
    paginasContratoWord(datos),
    paginaAnexo01Word(datos),
    paginaAnexo02Word(datos),
    paginasAnexo03Word(datos),
    paginaAnexo04Word(datos),
    paginaAnexo05Word(datos),
  ].join('\n');

  return `<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <meta name="ProgId" content="Word.Document">
  <meta name="Generator" content="Microsoft Word 15">
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:SpellingState>Clean</w:SpellingState>
      <w:GrammarState>Clean</w:GrammarState>
      <w:DoNotOptimizeForBrowser/>
      <w:AllowPNG/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  ${estilosWord}
</head>
<body lang="ES-PE" style="tab-interval:35.4pt">
<div class="Section1">
${paginas}
</div>
</body>
</html>`;
}

export default generarContratoHTML;
