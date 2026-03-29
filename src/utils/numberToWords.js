/**
 * Convierte un número a su representación en letras (español)
 * Ejemplo: 1600 → "MIL SEISCIENTOS"
 * Ejemplo: 2500.50 → "DOS MIL QUINIENTOS CON 50/100 SOLES"
 */

const UNIDADES = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
const ESPECIALES = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE'];
const DECENAS_PREFIX = ['', '', 'VEINTI', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
const CENTENAS = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

function convertirGrupo(n) {
  if (n === 0) return '';
  if (n === 100) return 'CIEN';

  let resultado = '';
  const centena = Math.floor(n / 100);
  const resto = n % 100;

  if (centena > 0) {
    resultado += CENTENAS[centena];
    if (resto > 0) resultado += ' ';
  }

  if (resto === 0) return resultado;

  if (resto < 10) {
    resultado += UNIDADES[resto];
  } else if (resto < 16) {
    resultado += ESPECIALES[resto - 10];
  } else if (resto < 20) {
    resultado += 'DIECI' + UNIDADES[resto - 10].toLowerCase().replace('un', 'UNO').replace(/^./, c => c.toUpperCase());
    // Fix: DIECISEIS, DIECISIETE, etc.
    const sub = resto - 10;
    resultado = resultado.replace(/DIECI.*/, 'DIECI' + UNIDADES[sub]);
  } else if (resto === 20) {
    resultado += 'VEINTE';
  } else if (resto < 30) {
    const unidad = resto - 20;
    resultado += 'VEINTI' + UNIDADES[unidad];
  } else {
    const decena = Math.floor(resto / 10);
    const unidad = resto % 10;
    resultado += DECENAS_PREFIX[decena];
    if (unidad > 0) resultado += ' Y ' + UNIDADES[unidad];
  }

  return resultado;
}

function numeroALetrasEntero(n) {
  if (n === 0) return 'CERO';
  if (n < 0) return 'MENOS ' + numeroALetrasEntero(-n);

  let resultado = '';

  // Millones
  const millones = Math.floor(n / 1000000);
  if (millones > 0) {
    if (millones === 1) {
      resultado += 'UN MILLÓN';
    } else {
      resultado += convertirGrupo(millones) + ' MILLONES';
    }
    n %= 1000000;
    if (n > 0) resultado += ' ';
  }

  // Miles
  const miles = Math.floor(n / 1000);
  if (miles > 0) {
    if (miles === 1) {
      resultado += 'MIL';
    } else {
      resultado += convertirGrupo(miles) + ' MIL';
    }
    n %= 1000;
    if (n > 0) resultado += ' ';
  }

  // Centenas, decenas, unidades
  if (n > 0) {
    resultado += convertirGrupo(n);
  }

  return resultado;
}

/**
 * Convierte monto a texto para contratos
 * @param {number} monto - Ej: 1600, 2500.50
 * @returns {string} - Ej: "MIL SEISCIENTOS CON 00/100 SOLES"
 */
export function montoALetras(monto) {
  const parteEntera = Math.floor(Math.abs(monto));
  const centavos = Math.round((Math.abs(monto) - parteEntera) * 100);
  const centavosStr = centavos.toString().padStart(2, '0');
  
  let letras = numeroALetrasEntero(parteEntera);
  // Reemplazar "UN" por "UNO" al final si es el caso
  if (letras.endsWith(' UN')) {
    letras = letras.slice(0, -2) + 'UNO';
  }
  if (letras === 'UN') letras = 'UNO';
  
  return `${letras} CON ${centavosStr}/100 SOLES`;
}

/**
 * Convierte monto a texto con formato para el contrato
 * @param {number} monto
 * @returns {string} - Ej: "(Mil seiscientos con 00/100 soles)"
 */
export function montoALetrasFormato(monto) {
  const texto = montoALetras(monto);
  // Capitalizar solo la primera letra, el resto en minúscula
  const formateado = texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
  return `(${formateado})`;
}

export default montoALetras;
