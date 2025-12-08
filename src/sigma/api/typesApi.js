import http from './http';

const DOC_TYPES_URL = import.meta.env.VITE_APP_DOC_TYPES_URL || '/types/by-group/DOC';

export const listDocTypes = async () => {
  try {
    const res = await http.get(DOC_TYPES_URL);
    return res.data;
  } catch (e) {
    // Fallback mock minimal list in case endpoint is not ready
    console.warn('DOC types endpoint not available, returning fallback list. Configure VITE_APP_DOC_TYPES_URL to override.');
    return [
      { code: 'DOC.GENERIC', name: 'Document générique' },
      { code: 'DOC.ID', name: 'Pièce d\'identité' },
      { code: 'DOC.JUSTIF', name: 'Justificatif' }
    ];
  }
};

export default { listDocTypes };
