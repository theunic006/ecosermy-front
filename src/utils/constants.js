export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export const SITUACIONES = ['VIGENTE', 'CESADO', 'SUSPENDIDO', 'NUEVO'];

export const SITUACIONES_CONFIG = {
  VIGENTE: { label: 'Vigente', color: '#10b981' },
  CESADO: { label: 'Cesado', color: '#ef4444' },
  SUSPENDIDO: { label: 'Suspendido', color: '#f59e0b' },
  NUEVO: { label: 'Nuevo', color: '#3b82f6' },
};

export const SISTEMAS_PENSIONES = ['ONP', 'AFP'];

export const TIPOS_REGISTRO = {
  'TD':    { label: 'Trabajo de Día',       short: 'TD',  color: '#43a047' },  // Verde - valor 1
  'TN':    { label: 'Trabajo de Noche',     short: 'TN',  color: '#2C6B2E' },  // Verde - valor 1
  '0.5':   { label: 'Trabajo Medio Día',    short: '0.5', color: '#88B88F' },  // Verde apagado - valor 0.5
  'DL':    { label: 'Día Libre',            short: 'DL',  color: '#3BACD1' },  // Verde - valor 1
  'LS':    { label: 'Licencia Sindical',    short: 'LS',  color: '#3B74D1' },  // Verde apagado - valor 0.5
  'DM':    { label: 'Descanso Médico',      short: 'DM',  color: '#26a69a' },  // Verde - valor 1
  'V':     { label: 'Vacaciones',           short: 'V',   color: '#5538C7' },  // Verde - valor 1
   'LFA':   { label: 'Lic. Familiar',        short: 'LFA', color: '#30429C' },  // Verde - valor 1
  'LP':    { label: 'Lic. Paternidad',      short: 'LP',  color: '#9038C7' },  // Verde - valor 1
  'LM':    { label: 'Lic. Maternidad',      short: 'LM',  color: '#A370C2' },  // Verde - valor 1
  'LF':    { label: 'Lic. Fallecimiento',   short: 'LF',  color: '#363636' },  // Verde - valor 1
 
   'LT':    { label: 'Libre Trabajado',      short: 'LT',  color: '#FFBF00' },  // Dorado - valor 1.5
  'ACU':   { label: 'Acumulable',           short: 'ACU', color: '#FF6B00' },  // Naranja - no seleccionable
  'TF':    { label: 'Trabajo Feriado',      short: 'TF',  color: '#FFAA00' },  // Dorado - valor 2

  'P':     { label: 'Permiso',              short: 'P',   color: '#757575' },  // Gris - valor 0
  'R':     { label: 'Retirado',             short: 'R',   color: '#bdbdbd' },  // Gris - valor 0
  'LSG':   { label: 'Lic. Sin Goce',        short: 'LSG', color: '#9e9e9e' },  // Gris - valor 0 (no cuenta)
  'F':     { label: 'Falta',                short: 'F',   color: '#e53935' },  // Rojo - valor -0.5
  'SU':    { label: 'Suspensión',           short: 'SU',  color: '#d32f2f' },  // Rojo - valor -0.5
};

// Valores para el conteo general
export const VALORES_REGISTRO = {
  'TD':  1,
  'TN':  1,
  '0.5':  0.5, //trabajo medio mediodia
  'DL':  1,
  'LS':   0.5,  // licencia sindical
  'DM':  1,
  'V':   0,   // vacaciones - se paga como ingreso en planilla
  'LFA':  1,   // licencia familiar
  'LP':  1,
  'LM':  1,
  'LF':  1,
  
  'LT':  2.5,
  'TF':  3,

  'P':   0,
  'R':   0,
  'LSG': 0,  // licencia sin goce (no cuenta)

  'F':   -0.5,
  'SU':  -0.5,

};

// Orden de columnas en el tareo: según orden de la leyenda
export const ORDEN_COLUMNAS_TAREO = [
  'TD', 'TN', '0.5', 'DL', 'LS', 'DM', 'V', 'LFA', 'LP', 'LM', 'LF', 'LT', 'TF', 'P', 'R', 'LSG', 'F', 'SU',
];

// Grupos para cálculos de suma
export const GRUPOS_CALCULO = {
  grupo1: {
    nombre: 'Días Trabajados',
    items: ['TD', 'TN', '0.5', 'DL', 'LS', 'DM', 'LFA', 'LP', 'LM', 'LF'],
    valores: [1, 1, 0.5, 1, 0.5, 1, 1, 1, 1, 1]
  },
  grupo2: {
    nombre: 'Extras',
    items: ['LT', 'TF'],
    valores: [1.5, 2]
  },
  grupo3: {
    nombre: 'Neutrales',
    items: ['V', 'P', 'R', 'LSG'],
    valores: [0, 0, 0, 0]
  },
  grupo4: {
    nombre: 'Descuentos',
    items: ['F', 'SU'],
    valores: [-0.5, -0.5]
  }
};

export const BANCOS = [
  'Banco de la Nación', 
  'BCP', 
  'BBVA', 
  'BanBif',
  'Banco Falabella',
  'Banco Pichincha',
  'Mibanco', 
  'Interbank', 
  'Scotiabank', 
  'Caja Huancayo',
  'Caja Arequipa', 
  'Caja Piura',
];

export const GRADOS_INSTRUCCION = [
  'SECUNDARIA COMPLETA',
  'EGRESADO TECNICO',
  'TECNICO',
  'TECNICO MECANICO',
  'TECNICO SUPERIOR',
  'TECNICO COMPLETO',
  'BACHILLER',
  'UNIVERSITARIO INCOMPLETO',
  'UNIVERSITARIO COMPLETO',
  'SUPERIOR TÉCNICO',
  'SUPERIOR INCOMPLETO',
  'SUPERIOR',
];

export const UNIDADES = [
  'OFICINA CENTRAL',
  'VOLCAN',
  'ALPAYANA',
  'CHINALCO',
];