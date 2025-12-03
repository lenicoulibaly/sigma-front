import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { associationApi } from '../../api/businessApi';

// Query keys
const ASSOCIATIONS_KEYS = {
  all: ['associations'],
  lists: () => [...ASSOCIATIONS_KEYS.all, 'list'],
  list: (params) => [...ASSOCIATIONS_KEYS.lists(), params?.key ?? '', params?.page ?? 0, params?.size ?? 10],
  openList: (key = '') => [...ASSOCIATIONS_KEYS.all, 'open-list', key],
  details: (id) => [...ASSOCIATIONS_KEYS.all, 'details', id],
};

/**
 * Build FormData compatible with Spring @ModelAttribute(CreateAssociationDTO)
 * @param {Object} data - source object from AssociationModal state
 * @returns {FormData}
 */
export const buildAssociationFormData = (data) => {
  const fd = new FormData();

  const appendIfNotNull = (key, value) => {
    if (value !== undefined && value !== null && value !== '') fd.append(key, value);
  };

  // Scalars
  appendIfNotNull('assoName', data.assoName);
  appendIfNotNull('situationGeo', data.situationGeo);
  appendIfNotNull('sigle', data.sigle);
  if (data.droitAdhesion !== undefined && data.droitAdhesion !== null && data.droitAdhesion !== '') {
    fd.append('droitAdhesion', String(data.droitAdhesion));
  }
  if (data.logo) fd.append('logo', data.logo);
  appendIfNotNull('email', data.email);
  appendIfNotNull('tel', data.tel);
  appendIfNotNull('adresse', data.adresse);

  // strIds as repeated params
  if (Array.isArray(data.strIds)) {
    data.strIds.forEach((id) => {
      if (id !== null && id !== undefined) fd.append('strIds', String(id));
    });
  }

  // piecesJointes -> UploadDocReq list
  if (Array.isArray(data.piecesJointes)) {
    data.piecesJointes.forEach((pj, idx) => {
      const base = `piecesJointes[${idx}]`;
      if (pj?.file) fd.append(`${base}.file`, pj.file);
      if (pj?.type) fd.append(`${base}.docTypeCode`, pj.type);
      if (pj?.description) fd.append(`${base}.docDescription`, pj.description);
      // Optional fields left empty on create
      // `${base}.docNum`, `${base}.docName`, `${base}.objectId`, `${base}.objectTableName`
    });
  }

  // createSectionDTOS -> CreateSectionDTO list
  if (Array.isArray(data.createSectionDTOS)) {
    data.createSectionDTOS.forEach((sec, idx) => {
      const base = `createSectionDTOS[${idx}]`;
      if (sec?.name) fd.append(`${base}.sectionName`, sec.name);
      if (sec?.sigle) fd.append(`${base}.sigle`, sec.sigle);
      // assoId intentionally omitted on association creation (server should bind later)
      if (sec?.structure?.strId) fd.append(`${base}.strId`, String(sec.structure.strId));
      if (sec?.situationGeo) fd.append(`${base}.situationGeo`, sec.situationGeo);
      if (sec?.email) fd.append(`${base}.email`, sec.email);
      if (sec?.tel) fd.append(`${base}.tel`, sec.tel);
      if (sec?.adresse) fd.append(`${base}.adresse`, sec.adresse);
    });
  }

  // piecesAFournir -> PieceAdhesionDTO list
  if (Array.isArray(data.piecesAFournir)) {
    data.piecesAFournir.forEach((pf, idx) => {
      const base = `piecesAFournir[${idx}]`;
      if (pf?.type) fd.append(`${base}.typePieceCode`, pf.type);
      if (pf?.statut) fd.append(`${base}.statutObligationCode`, pf.statut);
      if (pf?.description) fd.append(`${base}.description`, pf.description);
      // Names/IDs related to association or piece left empty on create
    });
  }

  // Rich text string
  appendIfNotNull('conditionsAdhesion', data.conditionsAdhesion);

  return fd;
};

/**
 * Mutation hook to create association
 */
export const useCreateAssociation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const formData = data instanceof FormData ? data : buildAssociationFormData(data);
      return associationApi.createAssociation(formData);
    },
    onSuccess: () => {
      // Invalidate association lists if they exist
      queryClient.invalidateQueries({ queryKey: ASSOCIATIONS_KEYS.lists() });
    },
  });
};

/**
 * Search associations
 */
export const useSearchAssociations = (params) => {
  return useQuery({
    queryKey: ASSOCIATIONS_KEYS.list(params),
    queryFn: () => associationApi.searchAssociations(params),
    keepPreviousData: true,
  });
};

/**
 * Open search list for associations (for autocompletion)
 */
export const useOpenAssociationsList = (key = '') => {
  return useQuery({
    queryKey: ASSOCIATIONS_KEYS.openList(key),
    queryFn: () => associationApi.searchOpenList(key),
    enabled: key !== undefined,
    staleTime: 60_000,
  });
};

/**
 * Association details by ID
 */
export const useAssociationDetails = (assoId, options = {}) => {
  return useQuery({
    queryKey: ASSOCIATIONS_KEYS.details(assoId),
    queryFn: () => associationApi.findById(assoId),
    enabled: !!assoId && (options.enabled ?? true),
  });
};

const useAssociations = () => ({
  useCreateAssociation,
  useSearchAssociations,
  useAssociationDetails,
});

export default useAssociations;
