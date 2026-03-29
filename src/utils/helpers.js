/**
 * Formatear monto en soles
 */
export const formatMoney = (amount) => {
  if (amount == null || isNaN(amount)) return '-';
  const val = parseFloat(amount);
  if (val === 0) return '-';
  return `S/ ${val.toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Formatear fecha
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    // Si la fecha es solo YYYY-MM-DD, agregar T00:00:00 para que JavaScript
    // la interprete en hora LOCAL y no como UTC medianoche (lo que causaría
    // un desfase de -1 día en zonas UTC negativas como Perú UTC-5).
    const str = String(dateStr);
    const normalized = /^\d{4}-\d{2}-\d{2}$/.test(str) ? str + 'T00:00:00' : str;
    const date = new Date(normalized);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch (error) {
    return '-';
  }
};

/**
 * Obtener nombre del mes
 */
export const getMesNombre = (mes) => {
  const meses = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return meses[mes] || '';
};

/**
 * Días en un mes
 */
export const diasEnMes = (anio, mes) => {
  return new Date(anio, mes, 0).getDate();
};

/**
 * Obtener color de situación
 */
export const getSituacionColor = (situacion) => {
  const colores = {
    VIGENTE: '#4caf50',
    CESADO: '#f44336',
    SUSPENDIDO: '#ff9800',
    NUEVO: '#2196f3',
  };
  return colores[situacion] || '#9e9e9e';
};

/**
 * Obtener color del tipo de registro
 */
export const getRegistroColor = (tipo) => {
  const colores = {
    '8': '#4caf50', '9.14': '#66bb6a', '9.58': '#81c784',
    '9.59': '#a5d6a7', '10.28': '#2e7d32', 'N': '#7b1fa2',
    'DL': '#90caf9', 'LT': '#ff9800', 'DM': '#f44336',
    'F': '#d32f2f', 'P': '#ffc107', 'SU': '#795548',
    'AC': '#e91e63', 'V': '#00bcd4', 'LP': '#009688', 'PP': '#607d8b',
  };
  return colores[tipo] || '#9e9e9e';
};

/**
 * Descargar datos como archivo CSV
 */
export const downloadCSV = (data, filename) => {
  const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};
