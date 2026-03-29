/**
 * Servicio para gestionar la lista de conceptos de empleados.
 * Los conceptos se almacenan en el servidor (storage/app/conceptos_empleado.json)
 * y se acceden vía API. Al agregar un nuevo concepto, se guarda permanentemente
 * en el servidor y estará disponible para todos los usuarios en todas las sesiones.
 */
import api from './api';

/**
 * Obtiene la lista de conceptos desde el servidor.
 * @returns {Promise<string[]>}
 */
export const getConceptos = async () => {
  const response = await api.get('/conceptos-empleado');
  return response.data;
};

/**
 * Agrega un nuevo concepto al servidor.
 * No agrega duplicados (case-insensitive).
 * @param {string} nuevo
 * @returns {Promise<string[]>} lista actualizada
 */
export const agregarConcepto = async (nuevo) => {
  const response = await api.post('/conceptos-empleado', { concepto: nuevo.trim() });
  return response.data;
};

/**
 * Elimina un concepto del servidor.
 * @param {string} concepto
 * @returns {Promise<string[]>} lista actualizada
 */
export const eliminarConcepto = async (concepto) => {
  const response = await api.delete('/conceptos-empleado', { data: { concepto } });
  return response.data;
};
