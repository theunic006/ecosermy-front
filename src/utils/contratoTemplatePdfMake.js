/**
 * Plantilla de Contrato ECOSERMY — pdfmake
 * Encabezado automático en cada página. Sin problemas de páginas en blanco.
 */
import { LOGO_ECOSERMY } from './logoBase64';
import { montoALetrasFormato } from './numberToWords';

// ── Helpers de fecha ──────────────────────────────────────────────────────

function formatFecha(fecha) {
  if (!fecha) return '_______________';
  const d = new Date(String(fecha).substring(0, 10) + 'T00:00:00');
  const meses = ['enero','febrero','marzo','abril','mayo','junio',
    'julio','agosto','septiembre','octubre','noviembre','diciembre'];
  return `${d.getDate()} de ${meses[d.getMonth()]} del ${d.getFullYear()}`;
}

function formatFechaCorta(fecha) {
  if (!fecha) return '___/___/______';
  const d = new Date(String(fecha).substring(0, 10) + 'T00:00:00');
  return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`;
}

// ── Helpers de contenido ──────────────────────────────────────────────────

/** Texto en negrita (highlight) */
const hl = (v) => ({ text: String(v ?? ''), bold: true });

/** Párrafo justificado con margen inferior */
const par = (content, extras = {}) => ({
  text: content,
  margin: [0, 0, 0, 3],
  alignment: 'justify',
  ...extras,
});

/** Encabezado de cláusula (negrita + subrayado) */
const cla = (text, extras = {}) => ({
  text,
  bold: true,
  decoration: 'underline',
  fontSize: 10,
  margin: [0, 8, 0, 3],
  ...extras,
});

// ── Encabezado de página (se repite en cada hoja) ─────────────────────────

function makeHeader(currentPage, pageCount) {
  return {
    margin: [42, 16, 29, 0],
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
      widths: ['*', 40, '*'],
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
          border: [false, false, false, false],
          text: '',
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

// ── Contenido completo del documento ─────────────────────────────────────

function buildContent(d) {
  const fechaFirma   = '31 de marzo del 2026';
  const sueldoLetras = montoALetrasFormato(d.sueldo_base);
  const sueldo       = parseFloat(d.sueldo_base || 0).toFixed(2);
  const nombre       = d.nombre_completo || `${d.apellidos || ''} ${d.nombres || ''}`.trim();

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

  const grupo1 = items.slice(0, 11);   // ítems 1-11
  const grupo2 = items.slice(11, 31);  // ítems 12-31
  const grupo3a = items.slice(31, 36);  // ítems 32-36
  const grupo3b = items.slice(36);       // ítems 37-38

  return [

    // ═══════════════════════════════════════════════════════════════
    // CONTRATO PRINCIPAL
    // ═══════════════════════════════════════════════════════════════
    {
      text: 'CONTRATO DE TRABAJO SUJETO A MODALIDAD POR SERVICIO ESPECÍFICO',
      bold: true, decoration: 'underline', alignment: 'center', fontSize: 11,
      margin: [0, 6, 0, 6],
    },
    par('      Conste por el presente documento, el contrato de trabajo celebrado de una parte:'),
    par(['(1) Por la ', { text: 'EMPRESA COMUNAL DE SERVICIOS MÚLTIPLES YAULI – ECOSERMY', bold: true }, ', con R.U.C. Nº 20516385813, con domicilio fiscal en Av. Ladislao Espinar S/N Sec. Yauli (frente a la piscina natural), Yauli – Junín, debidamente representada por su Presidente el Sr. ', { text: 'Juan Francisco BERNALDO SABUCO', bold: true }, ' con DNI Nº 04019887, a quien en lo sucesivo se le denominará ', { text: 'EL EMPLEADOR', bold: true }, '.']),
    par(['(2) Y de la otra parte el Sr(a). ', hl(nombre), ', identificado con DNI: ', hl(d.dni), ', con domicilio en ',
      ...(d.direccion ? [hl(d.direccion)] : []),
      ...(d.distrito ? [', ', hl(d.distrito)] : []),
      ...(d.provincia ? [', ', hl(d.provincia)] : []),
      ...(d.departamento ? [', ', hl(d.departamento)] : []),
      ', con Celular Nro. ', hl(d.celular), ', y email: ', hl(d.email), ', a quien en adelante se le denominará ', { text: 'EL TRABAJADOR', bold: true }, '.']),
    par(['Bajo el régimen de la ', { text: 'Ley General de Comunidades Campesinas – Ley N°24656', bold: true }, ', el ', { text: 'Decreto Supremo N°003-97-TR', bold: true }, ' (Texto Único Ordenado de la Ley de Productividad y Competitividad Laboral - LPCL) y normas complementarias, en los términos y condiciones siguientes:']),
    cla('CLÁUSULA PRIMERA: ANTECEDENTES Y NATURALEZA JURÍDICA.'),
    par([{ text: '1.1. De la Naturaleza Jurídica de EL EMPLEADOR: ', bold: true }, { text: 'EL EMPLEADOR', bold: true }, ' deja expresa constancia de que no es una sociedad mercantil tradicional orientada a la acumulación de capital privado. Por el contrario, ECOSERMY es una Empresa Comunal, constituida como el brazo económico, productivo y social de la Comunidad Campesina de Yauli (COCAYA). Su existencia, organización y fines sociales se encuentran tutelados y amparados por el ', { text: 'Artículo 89° de la Constitución Política del Perú', bold: true }, ', que garantiza la autonomía organizativa, económica y administrativa de las Comunidades Campesinas, encontrándose regulada estrictamente por la ', { text: 'Ley General de Comunidades Campesinas, Ley N° 24656', bold: true }, '. En tal sentido, su objeto social primordial es el desarrollo socioeconómico de sus comuneros.']),
    par([{ text: '1.2. De la Dependencia Estructural y Exclusividad de Servicios: ', bold: true }, 'Se establece como premisa fáctica indiscutible que ', { text: 'EL EMPLEADOR', bold: true }, ' es una entidad cuya operatividad comercial consiste, única y exclusivamente, en prestar servicios de tercerización, intermediación y ejecución de obras por contrata a favor de empresas mineras titulares. En consecuencia, ', { text: 'EL EMPLEADOR', bold: true }, ' carece de una demanda productiva propia o autónoma en el mercado abierto. Su necesidad de contratar mano de obra está absolutamente supeditada, condicionada y es directamente proporcional a la adjudicación, existencia y vigencia de contratos comerciales o convenios con dichas empresas mineras nacionales y transnacionales.']),
    par([{ text: '1.3. De la Causa Matriz Derivada: ', bold: true }, 'En virtud de lo expuesto en los numerales precedentes, las partes reconocen que la "causa matriz" que origina la presente contratación es de naturaleza estrictamente derivada. La necesidad de incorporar a ', { text: 'EL TRABAJADOR', bold: true }, ' existe única y exclusivamente porque ', { text: 'EL EMPLEADOR', bold: true }, ' mantiene vigente el:']),
    {
      margin: [20, 0, 0, 8],
      alignment: 'justify',
      columns: [
        { text: '1)', width: 20, lineHeight: 1.5 },
        {
          width: '*',
          lineHeight: 1.5,
          text: [
            ...(d.descripcion_contrato ? [hl(d.descripcion_contrato)] : []),
            ' suscrito con la empresa Compañia Minera ',
            hl(d.unidad),
            '. Por consiguiente, resulta jurídicamente irrefutable que, si dicho contrato comercial matriz se extingue, suspende, recorta o termina por decisión del cliente minero, la necesidad laboral de ',
            { text: 'EL EMPLEADOR', bold: true },
            ' desaparecerá instantáneamente, debiendo el presente contrato extinguirse de forma ineludible.',
          ],
        },
      ],
    },
    par([{ text: '1.4. Declaración Jurada de EL TRABAJADOR: ', bold: true }, { text: 'EL TRABAJADOR', bold: true }, ' declara bajo juramento ser una persona idónea, calificada y con amplia experiencia para el puesto de ', hl(d.cargo), '. Asimismo, declara que la información, documentación presentada y anexada a su currículum, así como la información que brinda y brindará al inicio y durante la relación laboral, es verdadera, autorizando para tal efecto a ', { text: 'EL EMPLEADOR', bold: true }, ' a verificarla. En caso de comprobarse falsedad de la información y documentación presentada por ', { text: 'EL TRABAJADOR', bold: true }, ', éste incurre en causal de resolución de contrato; y, ', { text: 'EL EMPLEADOR', bold: true }, ' procederá a resolver el presente contrato de forma inmediata, sin perjuicio de iniciar las acciones legales correspondientes.']),
    cla('CLÁUSULA SEGUNDA: CAUSA OBJETIVA MATRIZ Y OBJETO DE CONTRATACIÓN.'),
    par([{ text: '2.1. De la Modalidad Contractual: ', bold: true }, 'El presente contrato se celebra bajo la modalidad de ', { text: 'CONTRATO DE TRABAJO SUJETO A MODALIDAD POR SERVICIO ESPECÍFICO', bold: true }, ', amparado en los ', { text: 'Artículos 63° y 72° del TUO del Decreto Legislativo N° 728', bold: true }, ', Ley de Productividad y Competitividad Laboral (D.S. N° 003-97-TR).']),
    par([{ text: '2.2. Causa Objetiva: ', bold: true }, 'La necesidad temporal e insustituible que justifica esta contratación se origina directa y exclusivamente en la ejecución del Contrato']),
  {
      margin: [20, 0, 0, 8],
      alignment: 'justify',
      columns: [
        { text: '1)', width: 20, lineHeight: 1.5 },
        {
          width: '*',
          lineHeight: 1.5,
          text: [
            ...(d.descripcion_contrato ? [hl(d.descripcion_contrato)] : []),
            ' suscrito con la empresa Compañia Minera ',
            hl(d.unidad),
            ', en adelante "EL CLIENTE". ECOSERMY SRL., en su calidad de Empresa Comunal, carece de demanda laboral permanente propia, estando su operatividad y generación de empleo supeditadas estrictamente a los requerimientos, adjudicación y vigencia de las operaciones de El Cliente.',
          ],
        },
      ],
    },
    par([{ text: '2.3. Condición Resolutoria Automática: ', bold: true }, 'Las partes declaran conocer y aceptar libremente que, si el Contrato Comercial o Convenio principal referido en el numeral 2.2 fuera recortado, paralizado, suspendido, resuelto o no renovado por "EL CLIENTE" hacia ECOSERMY, la causa objetiva que origina este contrato laboral con "', { text: 'EL TRABAJADOR', bold: true }, '" desaparecerá de forma inmediata. En dicho escenario, el presente contrato de trabajo quedará extinguido de pleno derecho de forma anticipada, al amparo del inciso "c" del ', { text: 'Artículo 16° de la LPCL', bold: true }, ', no generando despido arbitrario, indemnización ni penalidad alguna a favor de ', { text: 'EL TRABAJADOR', bold: true }, '.']),
    par([{ text: '2.4. Objeto de la Prestación: ', bold: true }, { text: 'EL TRABAJADOR', bold: true }, ' es contratado para desempeñarse en el cargo de ', hl(d.cargo), ', ejecutando las labores operativas exclusivas, temporales y accesorias requeridas para la satisfacción del contrato comercial señalado en el numeral 2.2. Dichas labores corresponden a: ', hl(d.concepto || d.categoria || ''), ', y demás actividades asignadas por su jefe inmediato que sean inherentes al cargo y necesarias para el cumplimiento del objeto del contrato.']),

    cla('CLÁUSULA TERCERA: DE LA MODALIDAD CONTRACTUAL, RECONOCIMIENTO DE TEMPORALIDAD Y PLAZO.'),
    par([{ text: '3.1. Naturaleza de la Modalidad: ', bold: true }, 'El presente documento constituye un ', { text: 'Contrato de Trabajo Sujeto a Modalidad para Servicio Específico', bold: true }, ', regulado expresamente por el ', { text: 'Artículo 63° y 72° del Texto Único Ordenado del Decreto Legislativo Nro. 728', bold: true }, ' – Ley de Productividad y Competitividad Laboral (D.S. N° 003-97-TR).']),
    par([{ text: '3.2. Aceptación de la Temporalidad Derivada: ', bold: true }, 'Las partes reconocen expresamente que la temporalidad del presente contrato se encuentra justificada, de manera irrefutable, en la causa objetiva matriz descrita en la cláusula precedente. ', { text: 'EL TRABAJADOR', bold: true }, ' declara haber sido debidamente informado, y comprende a cabalidad, que su contratación no obedece a una necesidad autónoma o permanente de la Empresa Comunal, sino que está estrictamente subordinada y condicionada al tiempo que resulte necesario para la ejecución del servicio ante EL CLIENTE.']),
    par([{ text: '3.3. Renuncia a Expectativa de Permanencia Indeterminada: ', bold: true }, 'En virtud del Principio de Causalidad, ', { text: 'EL TRABAJADOR', bold: true }, ' acepta que la existencia de su puesto de trabajo depende de la vigencia del contrato comercial con la empresa minera titular. Por consiguiente, reconoce que la extinción, resolución o suspensión del contrato comercial matriz conllevará inexorablemente a la terminación del presente vínculo laboral, sin que ello configure continuidad de labores, desnaturalización contractual ni despido arbitrario.']),
    par([{ text: '3.4. Plazo y Duración: ', bold: true }, 'En estricta concordancia con la temporalidad derivada reconocida en la presente cláusula, el plazo de vigencia estimativo del presente contrato rige desde el ', hl(formatFechaCorta(d.contrato_inicio || d.fecha_inicio)), ' hasta el ', hl((d.contrato_fin || d.fecha_fin) ? formatFechaCorta(d.contrato_fin || d.fecha_fin) : 'INDEFINIDO'), ', o hasta la finalización de la necesidad temporal y/o extinción del contrato matriz comercial, lo que ocurra primero. El vínculo laboral terminará de pleno derecho en la fecha señalada o al materializarse la condición resolutoria, sin necesidad de comunicación escrita, preaviso, ni pago de indemnización alguna.']),

    cla('CLÁUSULA CUARTA: RÉGIMEN REMUNERATIVO (JORNAL DIARIO O MENSUAL).'),
    par([{ text: '4.1. ', bold: true }, 'En contraprestación, ', { text: 'EL EMPLEADOR', bold: true }, ' abonará una remuneración bruta mensual de S/. ', hl(sueldo), ' ', hl(`${sueldoLetras}`),
      ...(d.con_alimentacion ? [' y S/ 45.00 soles por condición de trabajo por alimentación por día, según tareo bajo sistema'] : []),
      '.']),

    cla('CLÁUSULA QUINTA: RÉGIMEN DE JORNADA ATÍPICA 14x7 Y HORARIOS'),
    par([{ text: '5.1. JORNADA ATÍPICA: ', bold: true }, 'Las partes convienen expresamente en someterse a un régimen de jornada atípica acumulativa de ', { text: 'catorce (14) días continuos de trabajo', bold: true }, ', seguidos de ', { text: 'siete (7) días continuos de descanso', bold: true }, ', conforme a lo establecido en el D.S. N°008-2002-TR.']),
    par([{ text: '5.2. HORARIO DE TRABAJO Y TIEMPOS DE DESCANSO: ', bold: true }, 'El horario de trabajo se establece desde las ', hl(d.hora_inicio || '07:00'), ' horas hasta las ', hl(d.hora_fin || '19:00'), ' horas, comprendiendo un periodo de permanencia de doce (12) horas diarias en la unidad operativa.']),
    par('Dentro de dicho horario, EL TRABAJADOR gozará de los siguientes periodos de descanso no laborados:'),
    {
      ul: [
        'Un (01) descanso de una (01) hora y (15) minutos, destinado a su alimentación principal (almuerzo), Y',
        'Un (01) descanso adicional de 15 MINUTOS por concepto de refrigerio, en la mañana; y Un (01) descanso adicional de 15 MINUTOS por concepto de refrigerio, en la tarde.',
      ],
      margin: [0, 0, 0, 8],
    },
    par('Asimismo, EL TRABAJADOR podrá realizar labores en sobretiempo de manera voluntaria, conforme a la normativa laboral vigente. El horario y la jornada podrán variar según las necesidades operativas del área, las condiciones climáticas o la implementación de horarios de verano e invierno, siempre dentro de los límites establecidos por ley y conforme a lo dispuesto en el Decreto Supremo N.º 004-2006-TR y el Decreto Supremo N.º 011-2006-TR, o las normas que los sustituyan.'),
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
    par([{ text: '5.4. SOBRETIEMPO: ', bold: true }, 'Estando a que las labores se desarrollan bajo un régimen atípico y acumulativo de 14x7, de conformidad con el artículo 4 del D.S. N.º 007-2002-TR y la jurisprudencia del Tribunal Constitucional, el trabajo en sobretiempo se determinará en función al promedio de horas laboradas en el ciclo completo (días de trabajo más días de descanso). Se considerará hora extra únicamente al exceso que resulte de promediar la jornada semanal de cuarenta y ocho (48) horas o la jornada diaria de ocho (8) horas dentro del periodo respectivo.']),
    par('El tiempo dedicado al refrigerio y descansos establecidos en la cláusula 5.2 no se computará para el cálculo del promedio de la jornada.', { text: 'Asimismo, el trabajo en sobretiempo es voluntario y requiere autorización previa, expresa y por escrito de la jefatura inmediata; caso contrario, no será reconocido ni generará obligación de pago.', bold: true }),

    cla('CLÁUSULA SEXTA: OBLIGACIONES DE CONFIDENCIALIDAD Y NO COMPETENCIA.'),
    par([{ text: '6.1. ', bold: true }, { text: 'EL TRABAJADOR', bold: true }, ' se obliga a mantener estricta confidencialidad sobre toda información técnica, comercial, operativa, estratégica, de clientes, proveedores, métodos de trabajo y cualquier dato de ', { text: 'EL EMPLEADOR', bold: true }, ' o de sus clientes al que tenga acceso. Esta obligación subsistirá por ', { text: 'tres (3) años', bold: true }, ' posteriores a la terminación del contrato.']),
    par([{ text: '6.2. Protección de Datos: ', bold: true }, { text: 'EL TRABAJADOR', bold: true }, ' autoriza expresamente a ', { text: 'EL EMPLEADOR', bold: true }, ' al tratamiento de sus datos personales, inclusive de carácter sensible (como resultados de exámenes médicos), para los fines de la relación laboral, y para compartirlos con sus empresas clientes cuando sea necesario, de conformidad con la ', { text: 'Ley N°29733 - Ley de Protección de Datos Personales', bold: true }, '.']),
    par([{ text: '6.3. No Competencia: ', bold: true }, 'Durante la vigencia del contrato, ', { text: 'EL TRABAJADOR', bold: true }, ' se abstendrá de prestar servicios, directa o indirectamente, a empresas competidoras de ', { text: 'EL EMPLEADOR', bold: true }, ' en el sector minero y de construcción.']),

    cla('CLÁUSULA SÉPTIMA: PROPIEDAD INTELECTUAL E INNOVACIONES.'),
    par(['Cualquier invento, innovación, mejora de proceso, desarrollo técnico o creación intelectual que ', { text: 'EL TRABAJADOR', bold: true }, ' realice con ocasión de su trabajo, será propiedad exclusiva de ', { text: 'EL EMPLEADOR', bold: true }, ', quien podrá patentarlo o utilizarlo libremente, sin obligación de compensación adicional alguna, conforme al ', { text: 'Artículo 50° de la LPCL', bold: true }, '.']),

    cla('CLÁUSULA OCTAVA: TERMINACIÓN AUTOMÁTICA Y RESOLUCIÓN.'),
    par([{ text: '8.1. Terminación Automática: ', bold: true }, 'El presente contrato se extinguirá automáticamente, sin responsabilidad indemnizatoria para ', { text: 'EL EMPLEADOR', bold: true }, ', por la culminación de la obra o servicio específico, por la terminación, resolución o anulación del contrato principal con la empresa cliente, o por la finalización de la necesidad temporal propia que dio origen al contrato.']),
    par([{ text: '8.2. Resolución por Causa Imputable al Trabajador: ', bold: true }, 'Constituyen causas suficientes para la resolución del contrato sin indemnización, entre otras: la falsedad documentaria o declarativa, el incumplimiento grave de sus obligaciones, el incumplimiento reiterado de las normas de seguridad y salud en el trabajo, y el incumplimiento de las obligaciones de confidencialidad.']),

    cla('CLÁUSULA NOVENA: AUTORIZACIÓN DE DESCUENTOS Y RESPONSABILIDAD PATRIMONIAL.'),
    par([{ text: '9.1. De la Responsabilidad: ', bold: true }, { text: 'EL TRABAJADOR', bold: true }, ' asume responsabilidad económica por la pérdida, extravío o deterioro -distinto al desgaste natural por el uso- de las herramientas, equipos de protección personal (EPP), fotochecks, manuales y cualquier otro bien entregado por ', { text: 'EL EMPLEADOR', bold: true }, ' para el desempeño de sus funciones, conforme se detalle en el ANEXO 05 (Acta de Entrega y Recepción).']),
    par([{ text: '9.2. Autorización Expresa de Descuento: ', bold: true }, 'En virtud de lo dispuesto por el ', { text: 'Artículo 40° del D.S. N° 001-97-TR (Ley de CTS)', bold: true }, ' y el Principio de Autonomía de la Voluntad, ', { text: 'EL TRABAJADOR', bold: true }, ' autoriza a ', { text: 'EL EMPLEADOR', bold: true }, ' de manera libre, voluntaria e irrevocable a descontar de sus remuneraciones mensuales y/o de sus beneficios sociales (gratificaciones, vacaciones truncas, bonificaciones y/o CTS), el valor de reposición de los bienes señalados en el numeral anterior que no sean devueltos al término del vínculo laboral o que presenten daños por negligencia comprobada.']),
    par([{ text: '9.3. Multas y Penalidades: ', bold: true }, 'Asimismo, ', { text: 'EL TRABAJADOR', bold: true }, ' autoriza el descuento de aquellos montos derivados de multas de tránsito o sanciones administrativas impuestas a la unidad vehicular a su cargo o a ', { text: 'EL EMPLEADOR', bold: true }, ', siempre que se acredite mediante el informe correspondiente que dicha infracción fue consecuencia de la inobservancia de las normas de tránsito o reglamentos internos por parte de ', { text: 'EL TRABAJADOR', bold: true }, '.']),
    par([{ text: '9.4. Límites del Descuento: ', bold: true }, 'Los descuentos referidos se realizarán respetando los límites legales de inembargabilidad de las remuneraciones, salvo en el caso de la liquidación final de beneficios sociales, donde se aplicará sobre el saldo neto disponible conforme a la autorización aquí otorgada.']),

    cla('CLÁUSULA DÉCIMO: NOTIFICACIONES ELECTRÓNICAS.'),
    par([{ text: '10.1. ', bold: true }, 'Las partes acuerdan expresamente que todas las comunicaciones, notificaciones, citaciones y/o remisión de documentos (incluyendo boletas de pago, liquidaciones y comunicaciones de fin de vínculo) derivadas de la presente relación laboral, tendrán plena validez legal cuando sean cursadas a través de los siguientes medios electrónicos proporcionados por ', { text: 'EL TRABAJADOR', bold: true }, ' en el encabezado y en su Declaración Jurada de Datos:']),
    {
      ul: [
        { text: [{ text: 'Correo Electrónico: ', bold: true }, hl(d.email)] },
        { text: [{ text: 'Mensajería Instantánea (WhatsApp): ', bold: true }, hl(d.celular)] },
      ],
      margin: [0, 0, 0, 8],
    },
    par([{ text: '10.2. ', bold: true }, { text: 'EL TRABAJADOR', bold: true }, ' reconoce que el acceso a dichos medios es de su uso personal y exclusivo, por lo que las notificaciones se entenderán válidamente efectuadas en la fecha de envío del correo electrónico o de la confirmación de recepción/entrega en la aplicación de mensajería (doble check), sin perjuicio de la confirmación de lectura.']),
    par([{ text: '10.3. ', bold: true }, 'Es obligación de ', { text: 'EL TRABAJADOR', bold: true }, ' mantener activos dichos canales y comunicar por escrito cualquier variación de estos en un plazo no mayor a 24 horas de ocurrido el cambio. El incumplimiento de esta obligación hará que las notificaciones enviadas a los medios anteriores sigan surtiendo plenos efectos legales.']),

    cla('CLÁUSULA DÉCIMO PRIMERO: SALUD OCUPACIONAL Y EMO.'),
    par([{ text: '11.1. ', bold: true }, { text: 'EL TRABAJADOR', bold: true }, ' declara bajo juramento gozar de óptima salud física y mental para el desempeño de las labores propias de su cargo, las cuales conoce y acepta.']),
    par([{ text: '11.2. ', bold: true }, 'Es obligación de ', { text: 'EL TRABAJADOR', bold: true }, ' someterse a los Exámenes Médicos Ocupacionales (EMO) de ingreso, periódicos y de retiro, así como a las pruebas de descarte de alcohol y drogas que ', { text: 'EL EMPLEADOR', bold: true }, ' o EL CLIENTE dispongan.']),
    par([{ text: '11.3. ', bold: true }, 'El ocultamiento de enfermedades preexistentes o lesiones anteriores a la contratación que impidan el normal desarrollo de sus funciones, será considerado falta grave por quebrantamiento de la buena fe laboral, facultando a ', { text: 'EL EMPLEADOR', bold: true }, ' a resolver el contrato sin responsabilidad.']),

    cla('CLÁUSULA DÉCIMO SEGUNDO: RESPONSABILIDAD PERSONAL.'),
    par([{ text: '12.1. ', bold: true }, { text: 'EL TRABAJADOR', bold: true }, ' es responsable administrativo, civil y penalmente por los daños que cause a terceros, a la propiedad de ', { text: 'EL EMPLEADOR', bold: true }, ' o de EL CLIENTE, derivados de la conducción negligente, imprudente o por inobservancia de las normas de seguridad vial y reglamentos mineros.']),
    par([{ text: '12.2. ', bold: true }, { text: 'EL TRABAJADOR', bold: true }, ' se compromete a reportar inmediatamente cualquier incidente o accidente, por mínimo que sea. El reporte tardío o la omisión de este será causal de sanción disciplinaria severa.']),

    cla('CLÁUSULA DÉCIMO TERCERO: ANTICORRUPCIÓN Y ÉTICA.'),
    par([{ text: '13.1. ', bold: true }, { text: 'EL TRABAJADOR', bold: true }, ' se compromete a actuar bajo principios de integridad y ética, prohibiéndosele solicitar, aceptar u ofrecer cualquier tipo de pago indebido, dádiva o beneficio a favor de funcionarios de EL CLIENTE o de ', { text: 'EL EMPLEADOR', bold: true }, '.']),
    par([{ text: '13.2. ', bold: true }, 'El incumplimiento de los lineamientos éticos o la participación en actos de corrupción debidamente comprobados, dará lugar al despido inmediato y a la denuncia penal correspondiente bajo los alcances del ', { text: 'Decreto Legislativo N° 1352', bold: true }, ' y normas conexas.']),

    cla('CLÁUSULA DÉCIMO CUARTA: DEBERES DEL TRABAJADOR Y FACULTAD DISCIPLINARIA.'),
    par([{ text: '15.1. Cumplimiento Normativo: ', bold: true }, { text: 'EL TRABAJADOR', bold: true }, ' se obliga a cumplir sus funciones con lealtad, eficiencia y probidad, sujetándose estrictamente a las disposiciones del Reglamento Interno de Trabajo (RIT), el Reglamento de Seguridad y Salud en el Trabajo (RISST), y las directivas específicas emitidas por ', { text: 'EL EMPLEADOR', bold: true }, ' o EL CLIENTE minero.']),
    par([{ text: '15.2. Deberes Críticos: ', bold: true }, 'Sin perjuicio de lo establecido en el RIT, son deberes esenciales de ', { text: 'EL TRABAJADOR', bold: true }, ':']),
    {
      ol: [
        'Cuidar y mantener en buen estado las unidades vehiculares (volquetes) y equipos asignados.',
        'Reportar inmediatamente cualquier falla mecánica o incidente de seguridad.',
        'Respetar los estándares de velocidad y seguridad vial de la unidad minera.',
        'Someterse a los controles de fatiga y somnolencia establecidos.',
      ],
      type: 'lower-alpha',
      margin: [20, 0, 0, 8],
    },
    par([{ text: '15.3. Reconocimiento de Sanciones: ', bold: true }, { text: 'EL TRABAJADOR', bold: true }, ' declara conocer que el incumplimiento de estos deberes, así como de las prohibiciones contenidas en el RIT, constituye falta grave susceptible de sanción disciplinaria, la cual puede oscilar desde una amonestación hasta el despido, según la gravedad de la falta y lo previsto en el ', { text: 'Artículo 25° de la LPCL', bold: true }, '.']),

    cla('CLÁUSULA DÉCIMO CUARTA: JURISDICCIÓN Y DOMICILIO.'),
    par(['Para cualquier controversia derivada del presente contrato, las partes se someten a la jurisdicción de los Jueces y Salas Especializadas de ', { text: 'La Oroya', bold: true }, ', renunciando a cualquier otro fuero o jurisdicción. Se establecen como domicilios los consignados en el encabezado.']),

    { text: 'DISPOSICIONES COMPLEMENTARIAS:', bold: true, fontSize: 9, margin: [0, 8, 0, 3] },
    par(['En todo lo no previsto en el presente contrato, se aplicarán las disposiciones del ', { text: 'D.S. N°003-97-TR (LPCL)', bold: true }, ', la ', { text: 'Ley N°29783 - Ley de Seguridad y Salud en el Trabajo', bold: true }, ', el ', { text: 'Reglamento Interno de Trabajo', bold: true }, ' y el ', { text: 'Reglamento de Seguridad y Salud', bold: true }, ' de ', { text: 'EL EMPLEADOR', bold: true }, ', los cuales ', { text: 'EL TRABAJADOR', bold: true }, ' declara conocer y aceptar.']),
    par([{ text: 'ANEXOS OBLIGATORIOS (Forman parte integral del contrato):', bold: true }]),
    {
      ul: [
        'ANEXO 01: Régimen de Jornada Acumulativa 14x7 (Detallado).',
        'ANEXO 02: Política de Confidencialidad y Protección de Datos.',
        'ANEXO 03: Política de Seguridad y Salud en el Trabajo (SST).',
        'ANEXO 04: Carta de Compromiso Política de Cero Alcohol y Drogas.',
        'ANEXO 05: Acta de Entrega, Recepción y Compromiso de Devolución de Equipos de Protección Personal (EPP) e Implementos de Seguridad.',
      ],
      margin: [0, 0, 0, 10],
    },
    par(['En señal de conformidad, las partes firman el presente contrato en dos ejemplares del mismo tenor y a un solo efecto, en el Distrito de Yauli, a los ', hl(fechaFirma)]),
    firmasBoth(nombre, d.dni),

    // ═══════════════════════════════════════════════════════════════
    // PÁGINA 5: ANEXO 01
    // ═══════════════════════════════════════════════════════════════
    {
      text: 'ANEXO Nº01\nCONVENIO INDIVIDUAL PARA EL ESTABLECIMIENTO DE\nRÉGIMEN ACUMULATIVO DE JORNADA DE TRABAJO Y DESCANSO',
      decoration: 'underline', alignment: 'center', fontSize: 9,
      margin: [0, 6, 0, 6], pageBreak: 'before',
    },
    par(['Por el presente documento las partes del "CONTRATO DE TRABAJO SUJETO A MODALIDAD POR SERVICIO ESPECIFICO", que celebran de una parte EMPRESA COMUNAL DE SERVICIOS MÚLTIPLES YAULI - ECOSERMY, con RUC Nº20516385813, debidamente representada por su presidente el Sr. Juan Francisco BERNALDO SABUCO, con DNI Nº04019887, a quien en adelante se le denominará EL EMPLEADOR; y de la otra parte la Sr(a). ', hl(nombre), ' con DNI Nº ', hl(d.dni), ', a quien en adelante se le denominará EL TRABAJADOR; en razón de la naturaleza de la Empresa; las partes convienen de manera expresa y voluntaria, en aplicación de lo dispuesto en el Convenio Internacional de Trabajo N°1 de la OIT, Decreto Legislativo N°854 modificado por Ley N°27671, D. S. N°008-2002-TR, y complementarias, establecer un Régimen Alternativo de Acumulación de Jornada de Trabajo Atípico y Descanso, mediante el cual queda establecido que:']),
    par([{ text: 'PRIMERO: ', bold: true }, 'EL TRABAJADOR prestará servicios en el centro de trabajo según régimen laboral establecido por nuestro cliente, de trabajo continúo seguido por de descanso continuo. El periodo de labores incluirá los días sábados, domingos y feriados, asimismo queda convenido que el periodo acumulativo en promedio no excederá de las horas de trabajo establecidos por Ley dentro del horario establecido en EL EMPLEADOR: ', { text: 'Turno día', decoration: 'underline' }, ' de 07:00 a 12:00 horas y de 13:00 a 19:00 horas, el refrigerio se tomará de 12:00 a 13:00 horas; y ', { text: 'Turno noche', decoration: 'underline' }, ' de 19:00 a 7:00 horas, el descanso se tomará de una hora en coordinación con el Supervisor encargado.']),
    par('Este horario podrá ser modificado de acuerdo a las necesidades de EL EMPLEADOR, sin necesidad de sustentar estas necesidades ante EL TRABAJADOR.'),
    par([{ text: 'SEGUNDO: ', bold: true }, 'EL TRABAJADOR para el desarrollo de sus actividades privadas y familiares tomará su periodo acumulativo de descanso fuera de la Unidad de Trabajo.']),
    par([{ text: 'TERCERA: ', bold: true }, 'En caso se produzcan faltas injustificadas, sanciones de suspensión, permisos sin goce de haberes o cualquier otra falta que a criterio de suspensión no se encuentra justificado, el pago se efectuará sobre los días efectivamente laborados y la aplicación del descuento proporcional.']),
    par([{ text: 'CUARTA: ', bold: true }, 'Queda expresamente convenido que EL EMPLEADOR podrá modificar el convenio en función a sus necesidades operativas o administrativas, dejándose constancia que la modificación que pudiera efectuarse no afecte los derechos de EL TRABAJADOR a la jornada máxima de Ley, ni a los descansos semanales obligatorios establecido por ley.']),
    par([{ text: 'QUINTO: ', bold: true }, 'EL TRABAJADOR declara expresamente conocer las implicancias del Régimen Acumulativo de Jornada de Trabajo y Descanso que se establece mediante el presente Convenio, igualmente reconoce expresamente que no se vulnera su derecho de la Jornada Máxima Legal y a su descanso semanal obligatorio.']),
    par(['Como muestra de conformidad con todas las cláusulas del presente convenio firman las partes, por duplicado a ', hl(fechaFirma)]),
    firmasBoth(nombre, d.dni),

    // ═══════════════════════════════════════════════════════════════
    // PÁGINA 6: ANEXO 02
    // ═══════════════════════════════════════════════════════════════
    {
      text: 'ANEXO Nº02\nPOLÍTICA DE CONFIDENCIALIDAD Y PROTECCIÓN DE DATOS',
      decoration: 'underline', alignment: 'center', fontSize: 9,
      margin: [0, 6, 0, 6], pageBreak: 'before',
    },
    par(['Yo, ', hl(nombre), ', identificado con DNI N° ', hl(d.dni), ' en mi calidad de TRABAJADOR de ECOSERMY, DECLARO:'], { margin: [0, 30, 0, 30] }),
    par([{ text: 'OBLIGACIÓN DE CONFIDENCIALIDAD: ', bold: true }, 'Me comprometo a mantener absoluta reserva sobre toda información, documentación, datos, procedimientos, métodos de trabajo, estrategias comerciales, listas de clientes, información técnica y cualquier otro dato al que tenga acceso durante mi relación laboral.'], { margin: [0, 0, 0, 20] }),
    par([{ text: 'PROHIBICIÓN DE DIVULGACIÓN: ', bold: true }, 'No revelaré, compartiré, utilizaré en provecho propio o de terceros, ni divulgaré de ninguna forma información confidencial del EMPLEADOR o de sus clientes.'], { margin: [0, 0, 0, 20] }),
    par([{ text: 'PROTECCIÓN DE DATOS: ', bold: true }, 'Autorizo al EMPLEADOR al tratamiento de mis datos personales, incluidos datos sensibles (resultados médicos), para fines laborales y para compartirlos con clientes cuando sea necesario, conforme a la Ley N°29733.'], { margin: [0, 0, 0, 20] }),
    par([{ text: 'DURACIÓN: ', bold: true }, 'Esta obligación subsiste por TRES (3) AÑOS posteriores a la terminación de mi contrato.'], { margin: [0, 0, 0, 20] }),
    par([{ text: 'CONSECUENCIAS: ', bold: true }, 'El incumplimiento de esta obligación constituye falta grave y faculta al EMPLEADOR a tomar acciones legales, incluida la demanda por daños y perjuicios.'], { margin: [0, 0, 0, 30] }),
    { text: fechaFirma, bold: true, alignment: 'right', margin: [0, 0, 0, 0] },
    firmaSolo(nombre, d.dni),

    // ═══════════════════════════════════════════════════════════════
    // PÁGINA 7: ANEXO 03 — ítems 1-13
    // ═══════════════════════════════════════════════════════════════
    {
      text: 'ANEXO N°03\nRECOMENDACIONES EN MATERIA DE SEGURIDAD Y SALUD EN EL TRABAJO\n(Ley N° 29783, Art. 35, inc. c)',
      decoration: 'underline', alignment: 'center', fontSize: 9,
      margin: [0, 6, 0, 5], pageBreak: 'before',
    },
    par('Por medio del presente documento, y en aplicación de las obligaciones contenidas en la Ley N°29783, Ley de Seguridad y Salud en el trabajo, EL EMPLEADOR cumple con adjuntar al contrato de trabajo las presentes recomendaciones generales en materia de Seguridad y Salud en el Trabajo, Políticas de la Empresa Ecosermy y otras directivas de Seguridad y Salud en el Trabajo complementarias. En ese sentido, EL TRABAJADOR se obliga a cumplir rigurosamente las disposiciones que a continuación se indican:'),
    { ol: grupo1, start: 1, margin: [0, 0, 0, 8], lineHeight: 1.4 },

    // ═══════════════════════════════════════════════════════════════
    // ANEXO 03 — ítems 12-31
    // ═══════════════════════════════════════════════════════════════
    { ol: grupo2, start: 12, margin: [0, 0, 0, 8], lineHeight: 1.4 },

    // ═══════════════════════════════════════════════════════════════
    // ANEXO 03 — ítems 32-38 + firmas
    // ═══════════════════════════════════════════════════════════════
    { ol: grupo3a, start: 32, margin: [0, 0, 0, 8], lineHeight: 1.4 },
    { ol: grupo3b, start: 37, margin: [0, 0, 0, 8], lineHeight: 1.4, pageBreak: 'before' },
    { text: fechaFirma, bold: true, alignment: 'right', margin: [0, 30, 0, 0] },
    firmasBoth(nombre, d.dni),

    // ═══════════════════════════════════════════════════════════════
    // PÁGINA 10: ANEXO 04
    // ═══════════════════════════════════════════════════════════════
    {
      text: 'ANEXO N°04\nCARTA DE COMPROMISO\nPOLÍTICA DE TOLERANCIA CERO AL ALCOHOL Y DROGAS',
      decoration: 'underline', alignment: 'center', fontSize: 10,
      margin: [0, 6, 0, 6], pageBreak: 'before',
    },
    {
      margin: [40, 20, 0, 30],
      layout: 'noBorders',
      table: {
        widths: [70, 10, '*'],
        body: [
          [{ text: 'YO', bold: true, margin: [0, 5, 0, 5] }, { text: ':', margin: [0, 5, 0, 5] }, { text: nombre, bold: true, margin: [0, 5, 0, 5] }],
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
    { text: fechaFirma, bold: true, alignment: 'right', margin: [0, 30, 0, 0] },
    {
      margin: [0, 16, 0, 0],
      table: {
        widths: ['*', 226, '*'],
        body: [[
          { border: [false, false, false, false], text: '' },
          {
            border: [false, false, false, false],
            stack: [
              {
                canvas: [
                  { type: 'line', x1: 0, y1: 58, x2: 178, y2: 58, lineWidth: 0.75 },
                  { type: 'rect', x: 182, y: 8, w: 44, h: 50, lineWidth: 0.5, lineColor: '#000000' },
                ],
              },
              { text: nombre, bold: true, alignment: 'center', margin: [0, 5, 0, 0] },
              { text: `D.N.I. N° ${d.dni}`, alignment: 'center' },
              { text: 'EL TRABAJADOR', alignment: 'center' },
            ],
          },
          { border: [false, false, false, false], text: '' },
        ]],
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // ANEXO 05 — Acta de Entrega de EPP
    // ═══════════════════════════════════════════════════════════════
    {
      text: 'ANEXO N°05\nACTA DE ENTREGA, RECEPCIÓN Y COMPROMISO DE DEVOLUCIÓN DE\nEQUIPOS DE PROTECCIÓN PERSONAL (EPP) E IMPLEMENTOS DE SEGURIDAD',
      decoration: 'underline', alignment: 'center', fontSize: 10,
      margin: [0, 6, 0, 6], pageBreak: 'before',
    },
    par([{ text: '1. DATOS DEL TRABAJADOR:', bold: true }]),
    {
      margin: [20, 0, 0, 10],
      layout: 'noBorders',
      table: {
        widths: [120, 10, '*'],
        body: [
          [{ text: 'Apellidos y Nombres', bold: true }, ':', nombre],
          [{ text: 'DNI', bold: true }, ':', d.dni],
          [{ text: 'Cargo', bold: true }, ':', d.cargo],
          [{ text: 'Proyecto/Unidad', bold: true }, ':', d.unidad || ''],
        ],
      },
    },
    par([{ text: '2. DECLARACIÓN DE RECEPCIÓN: ', bold: true }, 'Por la presente, el trabajador declara haber recibido de parte de la EMPRESA COMUNAL DE SERVICIOS MÚLTIPLES YAULI – ECOSERMY, los Equipos de Protección Personal (EPP) e implementos de seguridad que se detallan a continuación, en estado NUEVO y en perfectas condiciones de operatividad:']),
    {
      margin: [0, 8, 0, 10],
      table: {
        headerRows: 1,
        widths: [25, '*', 45, 45, 55],
        body: [
          [
            { text: 'ÍTEM', bold: true, alignment: 'center', fillColor: '#eeeeee' },
            { text: 'DESCRIPCIÓN DEL EQUIPO / HERRAMIENTA', bold: true, alignment: 'center', fillColor: '#eeeeee' },
            { text: 'CANTIDAD', bold: true, alignment: 'center', fillColor: '#eeeeee' },
            { text: 'ESTADO', bold: true, alignment: 'center', fillColor: '#eeeeee' },
            { text: 'VALOR REF. (S/.)', bold: true, alignment: 'center', fillColor: '#eeeeee' },
          ],
          ['01', 'Casco de seguridad con barbiquejo', '01', 'Nuevo', ''],
          ['02', 'Zapatos de seguridad con punta de acero', '01 par', 'Nuevo', ''],
          ['03', 'Lentes de seguridad (Claros/Oscuros)', '01', 'Nuevo', ''],
          ['04', 'Chaleco reflectivo con logo ECOSERMY', '01', 'Nuevo', ''],
          ['05', 'Mameluco térmico / Ropa de trabajo', '02', 'Nuevo', ''],
          ['06', 'Protectores auditivos (Tapones/Orejeras)', '01', 'Nuevo', ''],
          ['07', 'Fotocheck de identificación / Fotocheck Mina', '01', 'Nuevo', ''],
          ['08', { text: 'Otros: Radios, Herramientas, etc.', italics: true }, '', '', ''],
        ],
      },
    },
    par([{ text: '3. COMPROMISOS DEL TRABAJADOR: ', bold: true }, 'El trabajador, al firmar el presente anexo, reconoce y acepta las siguientes obligaciones:']),
    {
      ul: [
        [{ text: 'Uso Obligatorio: ', bold: true }, 'Utilizar los EPP de forma permanente y correcta durante su jornada laboral, conforme a la Ley N° 29783 y el RISST.'],
        [{ text: 'Cuidado y Conservación: ', bold: true }, 'Mantener los equipos en buen estado, siendo responsable por su pérdida, extrravío o deterioro por uso negligente.'],
        [{ text: 'Reporte de Daños: ', bold: true }, 'Informar inmediatamente a su supervisor en caso de que un EPP sufra un daño que comprometa la seguridad, para su reposición.'],
        [{ text: 'Devolución: ', bold: true }, 'Devolver la totalidad de los equipos e implementos al término del vínculo laboral, o cuando se le asigne un nuevo kit por renovación.'],
      ],
      margin: [0, 0, 0, 10],
    },
    par([{ text: '4. AUTORIZACIÓN EXPRESA DE DESCUENTO (CLÁUSULA DE RESGUARDO): ', bold: true }, 'En concordancia con la Cláusula Novena del Contrato de Trabajo, el trabajador autoriza de manera irrevocable a ECOSERMY a descontar de su remuneración mensual o, preferentemente, de su Liquidación de Beneficios Sociales (CTS, vacaciones, gratificaciones), el valor de reposición de los equipos detallados en el cuadro anterior que no sean devueltos al cese de la relación laboral o que presenten daños irreparables por negligencia comprobada.']),
    par([{ text: '5. VALIDEZ PROBATORIA: ', bold: true }, 'El trabajador reconoce que la entrega de estos equipos es gratuita para el desempeño de sus labores, pero su reposición por pérdida es de su entera cuenta y costo. El presente documento constituye prueba suficiente de la entrega de los EPP para fines de las auditorías de seguridad del CLIENTE MINERO y de la Autoridad Administrativa de Trabajo.']),
    par(['En señal de conformidad, se firma la presente Acta en el Distrito de Yauli, a los ', hl(fechaFirma)]),
    {
      margin: [0, 16, 0, 0],
      table: {
        widths: ['*', 180, '*'],
        body: [[
          { border: [false, false, false, false], text: '' },
          {
            border: [false, false, false, false],
            stack: [
              {
                canvas: [
                  { type: 'line', x1: 0, y1: 58, x2: 178, y2: 58, lineWidth: 0.75 },
                  { type: 'rect', x: 182, y: 8, w: 44, h: 50, lineWidth: 0.5, lineColor: '#000000' },
                ],
              },
              { text: nombre, bold: true, alignment: 'center', margin: [0, 5, 0, 0] },
              { text: `D.N.I. N° ${d.dni}`, alignment: 'center' },
              { text: 'EL TRABAJADOR', alignment: 'center' },
            ],
          },
          { border: [false, false, false, false], text: '' },
        ]],
      },
    },
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
    pageMargins: [42, 84, 29, 43],
    header: makeHeader,
    content: buildContent(datos),
    defaultStyle: {
      fontSize: 9,
      lineHeight: 1,
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
