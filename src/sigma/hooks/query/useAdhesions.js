import { useMutation } from '@tanstack/react-query';
import apiClient from '../../api/apiClient';

// API for Demandes d'adhésion
export const demandesAdhesionApi = {
  // Inscription: crée l'utilisateur + la demande d'adhésion, puis téléverse les documents
  createUserWithDemande: async (formData) => {
    const response = await apiClient.post('/demandes-adhesion/open/inscription', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

// Build FormData compatible with Spring @ModelAttribute AdhesionDTO
export const buildAdhesionFormData = (data = {}) => {
  const fd = new FormData();
  const appendIfNotNull = (key, value) => {
    if (value !== undefined && value !== null && value !== '') fd.append(key, value);
  };

  appendIfNotNull('userId', data.userId);
  appendIfNotNull('sectionId', data.sectionId);
  appendIfNotNull('assoId', data.assoId);
  appendIfNotNull('adhesionId', data.adhesionId);
  appendIfNotNull('matricule', data.matricule);
  appendIfNotNull('nomCivilite', data.nomCivilite);
  appendIfNotNull('gradeCode', data.gradeCode);
  if (data.indice !== undefined && data.indice !== null && data.indice !== '') fd.append('indice', String(data.indice));

  appendIfNotNull('firstName', data.firstName);
  appendIfNotNull('lastName', data.lastName);
  appendIfNotNull('email', data.email);
  appendIfNotNull('tel', data.tel);
  appendIfNotNull('lieuNaissance', data.lieuNaissance);
  if (data.dateNaissance) {
    const d = new Date(data.dateNaissance);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    fd.append('dateNaissance', `${yyyy}-${mm}-${dd}`);
  }
  appendIfNotNull('codeCivilite', data.codeCivilite);

  appendIfNotNull('sectionName', data.sectionName);
  appendIfNotNull('assoName', data.assoName);
  if (typeof data.enabled === 'boolean') fd.append('enabled', String(data.enabled));
  appendIfNotNull('emploiCode', data.emploiCode);
  appendIfNotNull('emploiName', data.emploiName);
  appendIfNotNull('strId', data.strId);
  appendIfNotNull('strName', data.strName);

  // Confirmations
  if (typeof data.accepteRgpd === 'boolean') fd.append('accepteRgpd', String(data.accepteRgpd));
  if (typeof data.accepteCharte === 'boolean') fd.append('accepteCharte', String(data.accepteCharte));
  if (typeof data.accepteStatutsReglements === 'boolean') fd.append('accepteStatutsReglements', String(data.accepteStatutsReglements));

  // Documents: List<UploadDocReq> documents
  if (Array.isArray(data.documents)) {
    data.documents.forEach((doc, idx) => {
      const base = `documents[${idx}]`;
      if (doc?.objectId !== undefined && doc?.objectId !== null && doc?.objectId !== '') fd.append(`${base}.objectId`, String(doc.objectId));
      if (doc?.docTypeCode) fd.append(`${base}.docTypeCode`, doc.docTypeCode);
      if (doc?.docNum) fd.append(`${base}.docNum`, doc.docNum);
      if (doc?.docName) fd.append(`${base}.docName`, doc.docName);
      if (doc?.docDescription) fd.append(`${base}.docDescription`, doc.docDescription);
      if (doc?.file) fd.append(`${base}.file`, doc.file);
      if (doc?.objectTableName) fd.append(`${base}.objectTableName`, doc.objectTableName);
    });
  }

  return fd;
};

export const useCreateUserWithDemandeAdhesion = () => {
  return useMutation({
    mutationFn: async (data) => {
      const formData = data instanceof FormData ? data : buildAdhesionFormData(data);
      return demandesAdhesionApi.createUserWithDemande(formData);
    },
  });
};
