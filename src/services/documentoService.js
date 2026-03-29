import api from './api';

/**
 * Listar todos los documentos de un empleado.
 */
export const listarDocumentos = async (empleadoId) => {
  const res = await api.get(`/empleados/${empleadoId}/documentos`);
  return res.data;
};

/**
 * Subir un archivo PDF para un empleado.
 * @param {number} empleadoId
 * @param {File}   archivo   — objeto File del input
 * @param {string} tipo      — 'asignacion_familiar' | 'dni' | 'cv' | 'contrato' | 'otros'
 * @param {string} nombre    — etiqueta descriptiva (ej: "Acta nacimiento Juan")
 */
export const subirDocumento = async (empleadoId, archivo, tipo, nombre) => {
  const formData = new FormData();
  formData.append('archivo', archivo);
  formData.append('tipo', tipo);
  formData.append('nombre', nombre);

  const res = await api.post(`/empleados/${empleadoId}/documentos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

/**
 * Descargar / abrir un documento en nueva pestaña.
 */
export const descargarDocumento = async (documentoId, nombreOriginal) => {
  const res = await api.get(`/empleados/documentos/${documentoId}/descargar`, {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreOriginal || `documento_${documentoId}.pdf`;
  a.click();
  window.URL.revokeObjectURL(url);
};

/**
 * Abrir un documento directamente en el navegador (sin descargar).
 */
export const verDocumento = async (documentoId) => {
  const res = await api.get(`/empleados/documentos/${documentoId}/descargar`, {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
  window.open(url, '_blank');
};

/**
 * Eliminar un documento.
 */
export const eliminarDocumento = async (documentoId) => {
  const res = await api.delete(`/empleados/documentos/${documentoId}`);
  return res.data;
};

/** Etiquetas legibles por tipo */
export const TIPOS_DOCUMENTO = [
  { value: 'asignacion_familiar', label: '📋 Asignación Familiar' },
  { value: 'dni',                 label: '🪪 DNI'                 },
  { value: 'cv',                  label: '📄 Currículum Vitae'    },
  { value: 'contrato',            label: '📝 Contrato'            },
  { value: 'otros',               label: '📁 Otros'               },
];
