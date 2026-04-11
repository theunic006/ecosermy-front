import api from './api';

// ─── Listar todos los backups ─────────────────────────────────────────────────
export const getBackups = async () => {
  const res = await api.get('/backups');
  return res.data; // { backups, total, storage_used, ultimo }
};

// ─── Crear backup manual ──────────────────────────────────────────────────────
export const crearBackup = async () => {
  const res = await api.post('/backups/crear');
  return res.data;
};

// ─── Descargar un backup (fetch + blob) ──────────────────────────────────────
export const descargarBackup = async (filename) => {
  const res = await api.get(`/backups/${encodeURIComponent(filename)}/descargar`, {
    responseType: 'blob',
  });

  const url  = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href  = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// ─── Eliminar un backup ───────────────────────────────────────────────────────
export const eliminarBackup = async (filename) => {
  const res = await api.delete(`/backups/${encodeURIComponent(filename)}`);
  return res.data;
};
