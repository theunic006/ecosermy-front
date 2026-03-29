/**
 * Plantilla de Contrato ECOSERMY — pdfmake
 * Encabezado automático en cada página. Sin problemas de páginas en blanco.
 */
import { LOGO_ECOSERMY } from './logoBase64';
import { montoALetrasFormato } from './numberToWords';

// ── Helpers de fecha ──────────────────────────────────────────────────────

function formatFecha(fecha) {
  if (!fecha) return '_______________';
  const d = new Date(fecha + 'T00:00:00');
  const meses = ['enero','febrero','marzo','abril','mayo','junio',
    'julio','agosto','septiembre','octubre','noviembre','diciembre'];
  return `${d.getDate()} de ${meses[d.getMonth()]} del ${d.getFullYear()}`;
}

function formatFechaCorta(fecha) {
  if (!fecha) return '___/___/______';
  const d = new Date(fecha + 'T00:00:00');
  return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`;
}

// ── Helpers de contenido ──────────────────────────────────────────────────

/** Texto en negrita (highlight) */
const hl = (v) => ({ text: String(v ?? ''), bold: true });

/** Párrafo justificado con margen inferior */
const par = (content, extras = {}) => ({
  text: content,
  margin: [0, 0, 0, 8],
  alignment: 'justify',
  ...extras,
});

/** Encabezado de cláusula (negrita + subrayado) */
const cla = (text, extras = {}) => ({
  text,
  bold: true,
  decoration: 'underline',
  fontSize: 11,
  margin: [0, 14, 0, 6],
  ...extras,
});

// ── Encabezado de página (se repite en cada hoja) ─────────────────────────

function makeHeader(currentPage, pageCount) {
  return {
    margin: [70, 16, 57, 0],
    table: {
      widths: [118, '*', 54, 88],
      heights: [11, 11, 11, 11],
      body: [
        [
          {
            rowSpan: 4,
            stack: [
              { image: LOGO_ECOSERMY, width: 58, alignment: 'center' },
              { text: 'SISTEMA DE GESTIÓN INTEGRADO', fontSize: 5, bold: true, alignment: 'center', lineHeight: 1, margin: [0, 0.5, 0, 0] },
            ],
            margin: [2, 0, 2, 0],
          },
          { text: 'FORMATO', fontSize: 8, bold: true, alignment: 'center', fillColor: '#374151', color: '#FFFFFF', lineHeight: 1, margin: [1, 0, 1, 0] },
          { text: 'Código', fontSize: 6.5, lineHeight: 1, margin: [3, 0, 3, 0] },
          { text: 'ECO-FT-RH 26.01', fontSize: 6.5, bold: true, color: '#1a6fa8', alignment: 'center', lineHeight: 1, margin: [3, 0, 3, 0] },
        ],
        [
          {},
          {
            rowSpan: 3,
            stack: [
              { text: 'CONTRATO DE TRABAJO', fontSize: 10, bold: true, alignment: 'center', lineHeight: 1, margin: [0, 0, 0, 0] },
              { text: 'SUJETO A MODALIDAD¹', fontSize: 8, bold: true, alignment: 'center', lineHeight: 1, margin: [0, 0, 0, 0] },
              { text: 'CONTRATO POR SERVICIO ESPECIFICO', fontSize: 6.5, bold: true, alignment: 'center', lineHeight: 1 },
            ],
            margin: [4, 0, 4, 0],
          },
          { text: 'Revisión', fontSize: 6.5, lineHeight: 1, margin: [3, 0, 3, 0] },
          { text: 'V02', fontSize: 6.5, bold: true, color: '#1a6fa8', alignment: 'center', lineHeight: 1, margin: [3, 0, 3, 0] },
        ],
        [
          {},
          {},
          { text: 'Área', fontSize: 6.5, lineHeight: 1, margin: [3, 0, 3, 0] },
          { text: 'Corporativo', fontSize: 6.5, bold: true, color: '#1a6fa8', alignment: 'center', lineHeight: 1, margin: [3, 0, 3, 0] },
        ],
        [
          {},
          {},
          { text: 'Páginas', fontSize: 6.5, lineHeight: 1, margin: [3, 0, 3, 0] },
          { text: `Página ${currentPage} de ${pageCount}`, fontSize: 6.5, bold: true, color: '#1a6fa8', alignment: 'center', lineHeight: 1, margin: [3, 0, 3, 0] },
        ],
      ],
    },
    layout: {
      hLineWidth: () => 0.75,
      vLineWidth: () => 0.75,
      hLineColor: () => '#000000',
      vLineColor: () => '#000000',
      paddingTop: () => 1,
      paddingBottom: () => 1,
      paddingLeft: () => 0,
      paddingRight: () => 0,
    },
  };
}

// ── Bloques de firmas ─────────────────────────────────────────────────────

function firmasBoth(nombre, dni) {
  return {
    margin: [0, 50, 0, 0],
    table: {
      widths: ['*', '*'],
      body: [[
        {
          border: [false, true, false, false],
          stack: [
            { text: 'JUAN FRANCISCO BERNALDO SABUCO', bold: true, alignment: 'center' },
            { text: 'D.N.I. 04019887', alignment: 'center' },
            { text: 'EL EMPLEADOR', alignment: 'center' },
          ],
          margin: [10, 6, 10, 0],
        },
        {
          border: [false, true, false, false],
          stack: [
            { text: nombre, bold: true, alignment: 'center' },
            { text: `D.N.I. N° ${dni}`, alignment: 'center' },
            { text: 'EL TRABAJADOR', alignment: 'center' },
          ],
          margin: [10, 6, 10, 0],
        },
      ]],
    },
  };
}

function firmaSolo(nombre, dni) {
  return {
    margin: [0, 50, 0, 0],
    table: {
      widths: ['*', 180, '*'],
      body: [[
        { border: [false, false, false, false], text: '' },
        {
          border: [false, true, false, false],
          stack: [
            { text: nombre, bold: true, alignment: 'center' },
            { text: `D.N.I. N° ${dni}`, alignment: 'center' },
            { text: 'EL TRABAJADOR', alignment: 'center' },
          ],
          margin: [10, 6, 10, 0],
        },
        { border: [false, false, false, false], text: '' },
      ]],
    },
  };
}

// ── Contenido completo del documento (10 páginas) ─────────────────────────

function buildContent(d) {
  const fechaFirma  = d.fecha_firma || formatFecha(new Date().toISOString().split('T')[0]);
  const sueldoLetras = montoALetrasFormato(d.sueldo_base);
  const sueldo       = parseFloat(d.sueldo_base || 0).toFixed(2);

  /* ── ítems Anexo 03 ── */
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

  const grupo1 = items.slice(0, 11);   // página 7: ítems 1-11
  const grupo2 = items.slice(11, 31);  // página 8: ítems 12-31
  const grupo3 = items.slice(31);      // página 9: ítems 32-38

  return [

    // ═══════════════════════════════════════════════════════════════
    // PÁGINA 1: Título + Cláusulas 1-2 (inicio)
    // ═══════════════════════════════════════════════════════════════
    {
      text: 'CONTRATO DE TRABAJO SUJETO A MODALIDAD POR SERVICIO ESPECÍFICO',
      bold: true, decoration: 'underline', alignment: 'center', fontSize: 12,
      margin: [0, 10, 0, 10],
    },
    par([
      '      Conste por el presente documento, el contrato de trabajo celebrado de una parte: ',
      { text: 'EMPRESA COMUNAL DE SERVICIOS MÚLTIPLES YAULI – ECOSERMY', bold: true },
      ', con R.U.C. N° 20516385813, con domicilio fiscal en Av. Ladislao Espinar S/N Sec. Yauli (frente a la piscina natural), Yauli – Junín, debidamente representada por su ',
      { text: 'Presidente', decoration: 'underline' },
      ' el ',
      { text: 'Sr. Juan Francisco BERNALDO SABUCO', bold: true },
      ' con DNI N° 04019887, a quien en lo sucesivo se le denominará ',
      { text: 'EL EMPLEADOR', bold: true },
      '; y de la otra parte el Sr(a). ',
      hl(d.nombre_completo),
      ', identificado con DNI: ',
      hl(d.dni),
      ', con domicilio en ',
      hl(d.direccion),
      ', con ',
      hl(d.codigo_trabajador),
      ', a quien en adelante se le denominará ',
      { text: 'EL TRABAJADOR', bold: true },
      '; bajo el régimen de la Ley General de Comunidades Campesinas – Ley N°24656, el Decreto Supremo N°003-97-TR (Texto Único Ordenado de la Ley de Productividad y Competitividad Laboral - LPCL) y normas complementarias, en los términos y condiciones siguientes:',
    ]),
    cla('CLÁUSULA PRIMERA: ANTECEDENTES Y NATURALEZA JURÍDICA'),
    par([{ text: 'EL EMPLEADOR', bold: true }, ' es una empresa de régimen comunal, regulada por la Ley General de Comunidades Campesinas, especializada en servicios de contratista minero y obras civiles, que desarrolla múltiples frentes de trabajo, tanto bajo la modalidad de tercerización para empresas mineras como para la ejecución de obras y servicios propios.']),
    par([{ text: 'EL TRABAJADOR', bold: true }, ' declara bajo juramento ser persona idónea, calificada y con amplia experiencia para el puesto de ', hl(d.cargo), ', asumiendo la veracidad de toda la información y documentación presentada. La falsedad de la misma constituirá causal de resolución contractual inmediata, sin perjuicio de las acciones legales a que hubiere lugar.']),
    cla('CLÁUSULA SEGUNDA: CAUSAL OBJETIVA Y OBJETO DEL CONTRATO'),
    par(['La presente contratación se celebra al amparo del ', { text: 'Artículo 56°', bold: true }, ' del D.S. N°003-97-TR (Ley de ', { text: 'Productividad y Competitividad Laboral', decoration: 'underline' }, '), por la necesidad temporal de atender la ejecución de ', { text: 'obras determinadas, servicios específicos y necesidades coyunturales del mercado', bold: true }, ', propias de la actividad empresarial de ', { text: 'EL EMPLEADOR', bold: true }, '.']),
    par([{ text: 'EL OBJETO', bold: true }, ' de este contrato es la prestación de servicios para la ejecución de las labores de ', hl(d.categoria), ' que requieran ser desarrolladas en cualquiera de los múltiples frentes de trabajo de ', { text: 'EL EMPLEADOR', bold: true }, ', los cuales incluyen, mas no se limitan a:']),
    par([{ text: 'a) ', bold: true }, { text: 'Servicios de Tercerización: ', bold: true }, 'Derivados de los contratos de servicios suscritos por ', { text: 'EL EMPLEADOR', bold: true }, ' con empresas del sector minero e industrial, tales como, ', hl(`U.M. ${d.unidad}`), ', y/o cualquier otra empresa cliente con la que se suscriba contrato.']),
    par([{ text: 'b) ', bold: true }, { text: 'Obras y Servicios Propios: ', bold: true }, 'Para el desarrollo de proyectos, mantenimiento, ampliación o ejecución de obras de la propia empresa ECOSERMY.']),
    par([{ text: 'c) ', bold: true }, { text: 'Necesidades Coyunturales: ', bold: true }, 'Para atender picos de producción, demandas temporales de servicios o cualquier otra necesidad transitoria de la cartera de proyectos de ', { text: 'EL EMPLEADOR', bold: true }, '.']),
    par(['La duración del presente contrato estará sujeta a la ', { text: 'vigencia de los contratos con los clientes finales, la culminación de las obras o servicios asignados, o la finalización de la necesidad temporal', bold: true }, ' que dio origen a la contratación, lo que ocurra primero.'],),

    // ═══════════════════════════════════════════════════════════════
    // PÁGINA 2: fin Cláusula 2 + Cláusulas 3, 4, 5 (5.1-5.3)
    // ═══════════════════════════════════════════════════════════════
    
    cla('CLÁUSULA TERCERA: PLAZO Y DURACIÓN'),
    par(['El plazo de duración del presente contrato es desde el ', hl(formatFechaCorta(d.contrato_inicio)), ' hasta el ', hl(d.contrato_fin ? formatFechaCorta(d.contrato_fin) : 'INDEFINIDO'), ' o hasta la finalización de la necesidad temporal objeto de este contrato, lo que ocurra primero. El vínculo laboral terminará de pleno derecho en la fecha señalada, sin necesidad de preaviso, comunicación escrita ni pago de indemnización alguna, por aplicación de la causal objetiva.']),
    par(['Si la obra o servicio específico culmina antes de la fecha prevista, el contrato se dará por terminado automáticamente. ', { text: 'EL EMPLEADOR', bold: true }, ' solo estará obligado al pago de las remuneraciones y beneficios legales devengados hasta la fecha del cese efectivo.']),
    cla('CLÁUSULA CUARTA: RÉGIMEN REMUNERATIVO (JORNAL DIARIO O MENSUAL)'),
    par([{ text: 'RÉGIMEN MENSUAL', bold: true, decoration: 'underline' }]),
    par(['4.1. En contraprestación, ', { text: 'EL EMPLEADOR', bold: true }, ' abonará una remuneración bruta mensual de S/ ', hl(sueldo), ' ', hl(sueldoLetras), '.']),
    par([{ text: '4.2. MONTO POR BENEFICIO ECONÓMICO NO REMUNERATIVO POR OTRAS CONDICIONES', bold: true }]),
    par(['De conformidad con los conceptos no remunerativos que prevé el art. 7º del TUO de la Ley de Productividad y Competitividad Laboral, ', { text: 'EL EMPLEADOR', bold: true }, ' abonará a ', { text: 'EL TRABAJADOR', bold: true }, ' la suma de S/.200 (doscientos soles 00/100 SOLES) mensuales, bajo el concepto de "Beneficio económico por otras Condiciones", cuyo otorgamiento obedece a criterios internos y liberalidad del empleador y no constituye remuneración en los términos previstos por el artículo 6 del TUO de la Ley de Productividad y Competitividad Laboral.'], { margin: [20, 0, 0, 8] }),
    par('En tal sentido:', { margin: [20, 0, 0, 6] }),
    par('a) Dicho monto no será base de cálculo para beneficios sociales (gratificaciones, CTS, vacaciones, u otros).', { margin: [20, 0, 0, 4] }),
    par('b) No estará afecto a aportes previsionales (AFP U ONP), ni a EsSalud.', { margin: [20, 0, 0, 4] }),
    par('c) Sin embargo, será considerado como ingreso anual computable para efectos del Impuesto a la Renta de Quinta Categoría, en caso corresponda.', { margin: [20, 0, 0, 8] }),
    cla('CLÁUSULA QUINTA: RÉGIMEN DE JORNADA ATÍPICA 14x7 Y HORARIOS'),
    par([{ text: '5.1. JORNADA ATÍPICA: ', bold: true }, 'Las partes convienen expresamente en someterse a un régimen de jornada atípica acumulativa de ', { text: 'catorce (14) días continuos de trabajo', bold: true }, ', seguidos de ', { text: 'siete (7) días continuos de descanso', bold: true }, ', conforme a lo establecido en el D.S. N°008-2002-TR.']),
    par([{ text: '5.2. HORARIO ESTABLECIDO: ', bold: true }, 'El horario de trabajo se establecerá de la siguiente manera: ingreso a las 7:00 horas, salida a las 19:00 horas, con una hora de refrigerio entre las 12:00 y 13:00 horas, resultando en una jornada efectiva diaria de 11 horas y una jornada semanal promedio de 77 horas.']),
    par([{ text: '5.3. COMPENSACIÓN Y FERIADOS:', bold: true }]),
    {
      ul: [
        { text: [{ text: 'Compensación por Jornada Atípica: ', bold: true }, 'La remuneración mensual pactada incluye una compensación global por la jornada atípica 14x7 y sus particularidades.'] },
        { text: [{ text: 'Feriados Laborados: ', bold: true }, 'Los días feriados que coincidan con días de trabajo serán remunerados con el recargo del 100% establecido en el Artículo 6° del D.S. N°012-92-TR, el cual se calculará y pagará adicionalmente a la remuneración mensual.'] },
        { text: [{ text: 'Carácter Complementario: ', bold: true }, 'El TRABAJADOR reconoce que la compensación por jornada atípica es independiente y complementaria al pago de feriados, no existiendo duplicidad ni compensación entre ambos conceptos.'] },
      ],
      margin: [0, 0, 0, 8],
    },

    // ═══════════════════════════════════════════════════════════════
    // PÁGINA 3: Cláusulas 5.4-5.5 + 6, 7, 8, 9
    // ═══════════════════════════════════════════════════════════════
    par([{ text: '5.4. BASE LEGAL: ', bold: true }, 'Este régimen se acoge a lo dispuesto en el ', { text: 'Artículo 5° del D.S. N°008-2002-TR', bold: true }, ', que permite la distribución irregular de la jornada hasta el límite máximo de 12 horas diarias, con cálculo de promedio en periodos trimestrales.']),
    par([{ text: '5.5. FACULTADES DEL EMPLEADOR: ', bold: true }, { text: 'EL EMPLEADOR podrá modificar los horarios y turnos según necesidades operativas, garantizando siempre el descanso mínimo de 12 horas entre jornadas.', decoration: 'underline' }]),
    cla('CLÁUSULA SEXTA: LUGAR DE PRESTACIÓN DE SERVICIOS'),
    par([{ text: 'EL TRABAJADOR', bold: true }, ' prestará sus servicios en las instalaciones de ', { text: 'EL EMPLEADOR', bold: true }, ', en las unidades operativas de sus clientes, o en cualquier otro frente de trabajo, proyecto u obra que ', { text: 'EL EMPLEADOR', bold: true }, ' determine, pudiendo ser reasignado entre ellos según las necesidades del servicio.']),
    cla('CLÁUSULA SÉPTIMA: OBLIGACIONES DE CONFIDENCIALIDAD Y NO COMPETENCIA'),
    par([{ text: '7.1. ', bold: true }, { text: 'EL TRABAJADOR', bold: true }, ' se obliga a mantener estricta confidencialidad sobre toda información técnica, comercial, operativa, estratégica, de clientes, proveedores, métodos de trabajo y cualquier dato de ', { text: 'EL EMPLEADOR', bold: true }, ' o de sus clientes al que tenga acceso. Esta obligación subsistirá por ', { text: 'tres (3) años', bold: true }, ' posteriores a la terminación del contrato.']),
    par([{ text: '7.2. Protección de Datos: ', bold: true }, { text: 'EL TRABAJADOR', bold: true }, ' autoriza expresamente a ', { text: 'EL EMPLEADOR', bold: true }, ' al tratamiento de sus datos personales, inclusive de carácter sensible (como resultados de exámenes médicos), para los fines de la relación laboral, y para compartirlos con sus empresas clientes cuando sea necesario, de conformidad con la ', { text: 'Ley N°29733 - Ley de Protección de Datos Personales', bold: true }, '.']),
    par([{ text: '7.3. No Competencia: ', bold: true }, 'Durante la vigencia del contrato, ', { text: 'EL TRABAJADOR', bold: true }, ' se abstendrá de prestar servicios, directa o indirectamente, a empresas competidoras de ', { text: 'EL EMPLEADOR', bold: true }, ' en el sector minero y de construcción.']),
    cla('CLÁUSULA OCTAVA: PROPIEDAD INTELECTUAL E INNOVACIONES'),
    par(['Cualquier invento, innovación, mejora de proceso, desarrollo técnico o creación intelectual que ', { text: 'EL TRABAJADOR', bold: true }, ' realice con ocasión de su trabajo, será propiedad exclusiva de ', { text: 'EL EMPLEADOR', bold: true }, ', quien podrá patentarlo o utilizarlo libremente, sin obligación de compensación adicional alguna, conforme al ', { text: 'Artículo 50° de la LPCL', bold: true }, '.']),
    cla('CLÁUSULA NOVENA: TERMINACIÓN AUTOMÁTICA Y RESOLUCIÓN'),
    par([{ text: '9.1. Terminación Automática: ', bold: true }, 'El presente contrato se extinguirá automáticamente, sin responsabilidad indemnizatoria para ', { text: 'EL EMPLEADOR', bold: true }, ', por la culminación de la obra o servicio específico, por la terminación, resolución o anulación del contrato principal con la empresa cliente, o por la finalización de la necesidad temporal propia que dio origen al contrato.']),
    par([{ text: '9.2. Resolución por Causa Imputable al Trabajador: ', bold: true }, 'Constituyen causas suficientes para la resolución del contrato sin indemnización, entre otras: la falsedad documentaria o declarativa, el incumplimiento grave de sus obligaciones, el incumplimiento reiterado de las normas de seguridad y salud en el trabajo, y el incumplimiento de las obligaciones de confidencialidad.']),

    // ═══════════════════════════════════════════════════════════════
    // PÁGINA 4: Cláusulas 10-11 + Disposiciones + Firmas
    // ═══════════════════════════════════════════════════════════════
    cla('CLÁUSULA DÉCIMA: DESCUENTOS AUTORIZADOS'),
    par(['Las partes acuerdan que ', { text: 'EL EMPLEADOR', bold: true }, ' podrá descontar de las remuneraciones o beneficios sociales de ', { text: 'EL TRABAJADOR', bold: true }, ', hasta el límite permitido por la ley (Artículo 26° de la Constitución y Ley N°9463), los siguientes conceptos:']),
    par('a) El valor de las herramientas, equipos o materiales perdidos o dañados por su culpa.'),
    par(['b) Las multas o penalidades que imponga el cliente final como consecuencia directa de una falta inexcusable de ', { text: 'EL TRABAJADOR', bold: true }, '.']),
    cla('CLÁUSULA DÉCIMO PRIMERA: JURISDICCIÓN Y DOMICILIO'),
    par(['      Para cualquier controversia derivada del presente contrato, las partes se someten a la jurisdicción de los Jueces y Salas Especializadas de ', { text: 'La Oroya', bold: true }, ', renunciando a cualquier otro fuero o jurisdicción. Se establecen como domicilios los consignados en el encabezado.']),
    { text: 'DISPOSICIONES COMPLEMENTARIAS', bold: true, fontSize: 11, margin: [0, 14, 0, 6] },
    par(['En todo lo no previsto en el presente contrato, se aplicarán las disposiciones del ', { text: 'D.S. N°003-97-TR (LPCL)', bold: true }, ', la ', { text: 'Ley N°29783 - Ley de Seguridad y Salud en el Trabajo', bold: true }, ', el ', { text: 'Reglamento Interno de Trabajo', bold: true }, ' y el ', { text: 'Reglamento de Seguridad y Salud', bold: true }, ' de ', { text: 'EL EMPLEADOR', bold: true }, ', los cuales ', { text: 'EL TRABAJADOR', bold: true }, ' declara conocer y aceptar.']),
    par([{ text: 'ANEXOS OBLIGATORIOS (Forman parte integral del contrato):', bold: true }]),
    {
      ul: [
        'ANEXO 01: Régimen de Jornada Acumulativa 14x7 (Detallado).',
        'ANEXO 02: Política de Confidencialidad y Protección de Datos.',
        'ANEXO 03: Política de Seguridad y Salud en el Trabajo (SST).',
        'ANEXO 04: Carta de Compromiso Política de Cero Alcohol y Drogas.',
      ],
      margin: [0, 0, 0, 10],
    },
    par(['En señal de conformidad, las partes firman el presente contrato en dos ejemplares del mismo tenor y a un solo efecto, en la ciudad de Yauli, ', hl(`a los ${fechaFirma}`)]),
    firmasBoth(d.nombre_completo, d.dni),

    // ═══════════════════════════════════════════════════════════════
    // PÁGINA 5: ANEXO 01
    // ═══════════════════════════════════════════════════════════════
    {
      text: 'ANEXO Nº01\nCONVENIO INDIVIDUAL PARA EL ESTABLECIMIENTO DE\nRÉGIMEN ACUMULATIVO DE JORNADA DE TRABAJO Y DESCANSO',
      decoration: 'underline', alignment: 'center', fontSize: 11,
      margin: [0, 10, 0, 10], pageBreak: 'before',
    },
    par(['Por el presente documento las partes del "CONTRATO DE TRABAJO SUJETO A MODALIDAD POR SERVICIO ESPECIFICO", que celebran de una parte EMPRESA COMUNAL DE SERVICIOS MÚLTIPLES YAULI - ECOSERMY, con RUC Nº20516385813, debidamente representada por su presidente el Sr. Juan Francisco BERNALDO SABUCO, con DNI Nº04019887, a quien en adelante se le denominará EL EMPLEADOR; y de la otra parte la Sr(a). ', hl(d.nombre_completo), ' con DNI Nº ', hl(d.dni), ', a quien en adelante se le denominará EL TRABAJADOR; en razón de la naturaleza de la Empresa; las partes convienen de manera expresa y voluntaria, en aplicación de lo dispuesto en el Convenio Internacional de Trabajo N°1 de la OIT, Decreto Legislativo N°854 modificado por Ley N°27671, D. S. N°008-2002-TR, y complementarias, establecer un Régimen Alternativo de Acumulación de Jornada de Trabajo Atípico y Descanso, mediante el cual queda establecido que:']),
    par([{ text: 'PRIMERO: ', bold: true }, 'EL TRABAJADOR prestará servicios en el centro de trabajo según régimen laboral establecido por nuestro cliente, de trabajo continúo seguido por de descanso continuo. El periodo de labores incluirá los días sábados, domingos y feriados, asimismo queda convenido que el periodo acumulativo en promedio no excederá de las horas de trabajo establecidos por Ley dentro del horario establecido en EL EMPLEADOR: ', { text: 'Turno día', decoration: 'underline' }, ' de 07:00 a 12:00 horas y de 13:00 a 19:00 horas, el refrigerio se tomará de 12:00 a 13:00 horas; y ', { text: 'Turno noche', decoration: 'underline' }, ' de 19:00 a 7:00 horas, el descanso se tomará de una hora en coordinación con el Supervisor encargado. Este horario podrá ser modificado de acuerdo a las necesidades de EL EMPLEADOR, sin necesidad de sustentar estas necesidades ante EL TRABAJADOR.']),
    par([{ text: 'SEGUNDO: ', bold: true }, 'EL TRABAJADOR para el desarrollo de sus actividades privadas y familiares tomará su periodo acumulativo de descanso fuera de la Unidad de Trabajo.']),
    par([{ text: 'TERCERA: ', bold: true }, 'En caso se produzcan faltas injustificadas, sanciones de suspensión, permisos sin goce de haberes o cualquier otra falta que a criterio de suspensión no se encuentra justificado, el pago se efectuará sobre los días efectivamente laborados y la aplicación del descuento proporcional.']),
    par([{ text: 'CUARTA: ', bold: true }, 'Queda expresamente convenido que EL EMPLEADOR podrá modificar el convenio en función a sus necesidades operativas o administrativas, dejándose constancia que la modificación que pudiera efectuarse no afecte los derechos de EL TRABAJADOR a la jornada máxima de Ley, ni a los descansos semanales obligatorios establecido por ley.']),
    par([{ text: 'QUINTO: ', bold: true }, 'EL TRABAJADOR declara expresamente conocer las implicancias del Régimen Acumulativo de Jornada de Trabajo y Descanso que se establece mediante el presente Convenio, igualmente reconoce expresamente que no se vulnera su derecho de la Jornada Máxima Legal y a su descanso semanal obligatorio.']),
    par(['Como muestra de conformidad con todas las cláusulas del presente convenio firman las partes, por duplicado a ', hl(formatFecha(d.contrato_inicio))]),
    firmasBoth(d.nombre_completo, d.dni),

    // ═══════════════════════════════════════════════════════════════
    // PÁGINA 6: ANEXO 02
    // ═══════════════════════════════════════════════════════════════
    {
      text: 'ANEXO Nº02\nPOLÍTICA DE CONFIDENCIALIDAD Y PROTECCIÓN DE DATOS',
      decoration: 'underline', alignment: 'center', fontSize: 11,
      margin: [0, 10, 0, 10], pageBreak: 'before',
    },
    par(['Yo, ', hl(d.nombre_completo), ', identificado con DNI N° ', hl(d.dni), ' en mi calidad de TRABAJADOR de ECOSERMY, DECLARO:'], { margin: [0, 30, 0, 30] }),
    par([{ text: 'OBLIGACIÓN DE CONFIDENCIALIDAD: ', bold: true }, 'Me comprometo a mantener absoluta reserva sobre toda información, documentación, datos, procedimientos, métodos de trabajo, estrategias comerciales, listas de clientes, información técnica y cualquier otro dato al que tenga acceso durante mi relación laboral.'], { margin: [0, 0, 0, 20] }),
    par([{ text: 'PROHIBICIÓN DE DIVULGACIÓN: ', bold: true }, 'No revelaré, compartiré, utilizaré en provecho propio o de terceros, ni divulgaré de ninguna forma información confidencial del EMPLEADOR o de sus clientes.'], { margin: [0, 0, 0, 20] }),
    par([{ text: 'PROTECCIÓN DE DATOS: ', bold: true }, 'Autorizo al EMPLEADOR al tratamiento de mis datos personales, incluidos datos sensibles (resultados médicos), para fines laborales y para compartirlos con clientes cuando sea necesario, conforme a la Ley N°29733.'], { margin: [0, 0, 0, 20] }),
    par([{ text: 'DURACIÓN: ', bold: true }, 'Esta obligación subsiste por TRES (3) AÑOS posteriores a la terminación de mi contrato.'], { margin: [0, 0, 0, 20] }),
    par([{ text: 'CONSECUENCIAS: ', bold: true }, 'El incumplimiento de esta obligación constituye falta grave y faculta al EMPLEADOR a tomar acciones legales, incluida la demanda por daños y perjuicios.'], { margin: [0, 0, 0, 20] }),
    firmaSolo(d.nombre_completo, d.dni),

    // ═══════════════════════════════════════════════════════════════
    // PÁGINA 7: ANEXO 03 — ítems 1-13
    // ═══════════════════════════════════════════════════════════════
    {
      text: 'ANEXO N°03\nRECOMENDACIONES EN MATERIA DE SEGURIDAD Y SALUD EN EL TRABAJO\n(Ley N° 29783, Art. 35, inc. c)',
      decoration: 'underline', alignment: 'center', fontSize: 11,
      margin: [0, 10, 0, 8], pageBreak: 'before',
    },
    par('Por medio del presente documento, y en aplicación de las obligaciones contenidas en la Ley N°29783, Ley de Seguridad y Salud en el trabajo, EL EMPLEADOR cumple con adjuntar al contrato de trabajo las presentes recomendaciones generales en materia de Seguridad y Salud en el Trabajo, Políticas de la Empresa ECOSERMY y otras directivas de Seguridad y Salud en el Trabajo complementarias. En ese sentido, EL TRABAJADOR se obliga a cumplir rigurosamente las disposiciones que a continuación se indican:'),
    { ol: grupo1, start: 1, margin: [0, 0, 0, 8], lineHeight: 1.4 },

    // ═══════════════════════════════════════════════════════════════
    // PÁGINA 8: ANEXO 03 — ítems 14-31
    // ═══════════════════════════════════════════════════════════════
    { ol: grupo2, start: 12, margin: [0, 0, 0, 8], lineHeight: 1.4, pageBreak: 'before' },

    // ═══════════════════════════════════════════════════════════════
    // PÁGINA 9: ANEXO 03 — ítems 32-38 + fecha + firmas
    // ═══════════════════════════════════════════════════════════════
    { ol: grupo3, start: 32, margin: [0, 0, 0, 8], lineHeight: 1.4 },
    { text: formatFecha(d.contrato_inicio), bold: true, alignment: 'right', margin: [0, 30, 0, 0] },
    firmasBoth(d.nombre_completo, d.dni),

    // ═══════════════════════════════════════════════════════════════
    // PÁGINA 10: ANEXO 04
    // ═══════════════════════════════════════════════════════════════
    {
      text: 'ANEXO N°04\nCARTA DE COMPROMISO\nPOLÍTICA DE TOLERANCIA CERO AL ALCOHOL Y DROGAS',
      decoration: 'underline', alignment: 'center', fontSize: 11,
      margin: [0, 10, 0, 10], pageBreak: 'before',
    },
    {
      margin: [40, 20, 0, 30],
      layout: 'noBorders',
      table: {
        widths: [70, 10, '*'],
        body: [
          [{ text: 'YO', bold: true, margin: [0, 5, 0, 5] }, { text: ':', margin: [0, 5, 0, 5] }, { text: d.nombre_completo, bold: true, margin: [0, 5, 0, 5] }],
          [{ text: 'DNI Nº', bold: true, margin: [0, 5, 0, 5] }, { text: ':', margin: [0, 5, 0, 5] }, { text: d.dni, bold: true, margin: [0, 5, 0, 5] }],
          [{ text: 'CARGO', bold: true, margin: [0, 5, 0, 5] }, { text: ':', margin: [0, 5, 0, 5] }, { text: d.cargo, bold: true, margin: [0, 5, 0, 5] }],
        ],
      },
    },
    par([{ text: 'ME COMPROMETO A:', bold: true, decoration: 'underline' }]),
    par('Cumplir fielmente la Política de Tolerancia CERO al Alcohol y Drogas de ECOSERMY.'),
    {
      ul: [
        'De incumplir dicha política, soy consciente de la aplicación de la gestión de consecuencias (falta grave).',
        'De incumplir el presente compromiso estoy llano a someterme a las medidas correctivas que ECOSERMY demande.',
      ],
      margin: [0, 0, 0, 10],
    },
    { text: d.fecha_firma || formatFecha(d.contrato_inicio || new Date().toISOString().split('T')[0]), bold: true, alignment: 'right', margin: [0, 30, 0, 0] },
    {
      alignment: 'center',
      margin: [0, 20, 0, 0],
      table: {
        widths: ['*', 100, '*'],
        body: [[
          { border: [false, false, false, false], text: '' },
          { text: 'Huella', fontSize: 9, color: '#cccccc', alignment: 'center', margin: [0, 40, 0, 40] },
          { border: [false, false, false, false], text: '' },
        ]],
      },
    },
    firmaSolo(d.nombre_completo, d.dni),
  ];
}

// ── Función exportada ─────────────────────────────────────────────────────

/**
 * Genera y descarga el contrato en PDF usando pdfmake.
 * Sin problemas de páginas en blanco. Encabezado automático en cada página.
 *
 * @param {Object} datos  - Datos del empleado/contrato
 * @param {string} filename - Nombre del archivo a descargar
 */
export async function generarContratoPDFMake(datos, filename = 'Contrato.pdf') {
  const pdfMakeModule = await import('pdfmake');
  const pdfMake = pdfMakeModule.default ?? pdfMakeModule;

  const vfsFonts = await import('pdfmake/build/vfs_fonts.js');
  const vfsRaw = vfsFonts.default ?? vfsFonts;
  pdfMake.vfs = vfsRaw?.pdfMake?.vfs ?? vfsRaw?.vfs ?? vfsRaw;

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [70, 84, 57, 43],
    header: makeHeader,
    content: buildContent(datos),
    defaultStyle: {
      fontSize: 11,
      lineHeight: 1.5,
      alignment: 'justify',
    },
  };

  // download() dispara la descarga internamente con su propio worker.
  // No usamos callback ni Promise porque el worker de pdfmake no garantiza
  // llamar al callback en entornos Vite/Docker → botón quedaba bloqueado.
  pdfMake.createPdf(docDefinition).download(filename);
  // Resolvemos de inmediato para liberar el botón; la descarga sigue en curso.
  return Promise.resolve();
}
