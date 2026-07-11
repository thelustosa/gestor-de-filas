export const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:8001'
  : `http://${window.location.hostname}:8001`;

export const CLIENT_ID = (() => {
  let id = sessionStorage.getItem('agr_client_id');
  if (!id) {
    id = Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('agr_client_id', id);
  }
  return id;
})();

export const SETORES = [
  { cat: 'T', label: 'Triagem', iconName: 'Activity', cor: '#3b82f6', corBg: 'rgba(59,130,246,0.12)' },
  { cat: 'C', label: 'Clínico Geral', iconName: 'Stethoscope', cor: '#10b981', corBg: 'rgba(16,185,129,0.12)' },
  { cat: 'E', label: 'Exames Laboratoriais', iconName: 'TestTubes', cor: '#f59e0b', corBg: 'rgba(245,158,11,0.12)' },
  { cat: 'R', label: 'Retirada de Resultados', iconName: 'FileText', cor: '#8b5cf6', corBg: 'rgba(139,92,246,0.12)' },
];
