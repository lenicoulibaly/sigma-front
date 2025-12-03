import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentApi } from '../../api/documentApi';

// Query keys
export const DOCUMENT_KEYS = {
  all: ['documents'],
  lists: () => [...DOCUMENT_KEYS.all, 'list'],
  listByObject: (params) => [...DOCUMENT_KEYS.lists(), { ...params }],
  item: (docId) => [...DOCUMENT_KEYS.all, 'item', docId],
};

// Search documents by object
export const useSearchDocumentsByObject = (params) => {
  return useQuery({
    queryKey: DOCUMENT_KEYS.listByObject(params),
    queryFn: () => documentApi.searchByObject(params),
    enabled: !!params?.tableName && params?.objectId != null,
  });
};

// Get one document (no explicit endpoint; could be fetched via search result or after mutation)
export const useGetDocumentById = (docId, options = {}) => {
  // If a dedicated endpoint is later added, replace with documentApi.findById
  return useQuery({
    queryKey: DOCUMENT_KEYS.item(docId),
    queryFn: async () => {
      // Fallback: not available from API as per controller; throw to indicate unsupported
      throw new Error('Fetching a document by ID is not supported by the current API. Use searchByObject instead.');
    },
    enabled: !!docId && (options.enabled ?? true),
  });
};

export const useUploadDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => documentApi.upload(payload),
    onSuccess: (data, variables) => {
      // Invalidate related lists by object
      const { objectTableName, objectId } = variables || {};
      if (objectTableName && objectId != null) {
        queryClient.invalidateQueries({ queryKey: DOCUMENT_KEYS.listByObject({ tableName: objectTableName, objectId }) });
      } else {
        queryClient.invalidateQueries({ queryKey: DOCUMENT_KEYS.lists() });
      }
    },
  });
};

export const useUpdateDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => documentApi.update(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: DOCUMENT_KEYS.lists() });
      if (data?.objectTableName?.code && data?.objectId != null) {
        queryClient.invalidateQueries({ queryKey: DOCUMENT_KEYS.listByObject({ tableName: data.objectTableName.code, objectId: data.objectId }) });
      }
      if (data?.docId) {
        queryClient.invalidateQueries({ queryKey: DOCUMENT_KEYS.item(data.docId) });
      }
    },
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (docId) => documentApi.deleteById(docId),
    onSuccess: (_res, docId) => {
      queryClient.invalidateQueries({ queryKey: DOCUMENT_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: DOCUMENT_KEYS.item(docId) });
    },
  });
};

// Download hook returns a function
export const useDownloadDocument = () => {
  return useMutation({
    mutationFn: (docId) => documentApi.download(docId),
  });
};
