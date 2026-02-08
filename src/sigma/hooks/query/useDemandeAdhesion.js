import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { demandeAdhesionApi } from '../../api/businessApi';

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

// Query keys
const DEMANDE_ADHESION_KEYS = {
  all: ['demandes-adhesion'],
  lists: (assoId) => assoId ? [...DEMANDE_ADHESION_KEYS.all, 'list', assoId] : [...DEMANDE_ADHESION_KEYS.all, 'list'],
  list: (assoId, params) => [...DEMANDE_ADHESION_KEYS.lists(assoId), { ...params }],
  userList: (params) => [...DEMANDE_ADHESION_KEYS.all, 'user-list', { ...params }],
};

/**
 * Mutation hook to create a demande d'adhésion
 */
export const useCreateDemandeAdhesion = (assoId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto) => demandeAdhesionApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEMANDE_ADHESION_KEYS.all });
    },
  });
};

/**
 * Mutation hook to create a user and a demande d'adhésion
 */
export const useCreateUserAndDemandeAdhesion = (assoId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto) => {
        const payload = dto instanceof FormData ? dto : buildAdhesionFormData(dto);
        return demandeAdhesionApi.createUserAndDemandeAdhesion(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEMANDE_ADHESION_KEYS.all });
    },
  });
};

/**
 * Mutation hook to update a demande d'adhésion
 */
export const useUpdateDemandeAdhesion = (assoId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }) => demandeAdhesionApi.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEMANDE_ADHESION_KEYS.all });
    },
  });
};

/**
 * Hook for searching/listing demandes d'adhésion
 */
export const useSearchDemandeAdhesion = (params = {}) => {
  const assoId = params.assoId || params.associationId;

  return useQuery({
    queryKey: DEMANDE_ADHESION_KEYS.list(assoId, params),
    queryFn: () => demandeAdhesionApi.search(assoId, params),
    enabled: !!assoId,
    keepPreviousData: true,
  });
};

/**
 * Hook for searching user's own demandes d'adhésion
 */
export const useSearchUserDemandesAdhesion = (params = {}) => {
  return useQuery({
    queryKey: DEMANDE_ADHESION_KEYS.userList(params),
    queryFn: () => demandeAdhesionApi.searchForUser(params),
    keepPreviousData: true,
  });
};

const useDemandeAdhesion = () => ({
  useCreateDemandeAdhesion,
  useCreateUserAndDemandeAdhesion,
  useUpdateDemandeAdhesion,
  useSearchDemandeAdhesion,
  useSearchUserDemandesAdhesion,
});

export default useDemandeAdhesion;
