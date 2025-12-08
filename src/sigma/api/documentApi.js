import apiClient from './apiClient';
import qs from 'qs';

// Documents API mapping the provided Spring controller
// Base path: /documents

// Helper to build FormData from a plain object
const toFormData = (data = {}) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    // Support File/Blob and arrays
    if (Array.isArray(value)) {
      value.forEach((v) => formData.append(key, v));
    } else {
      formData.append(key, value);
    }
  });
  return formData;
};

export const documentApi = {
  // Upload a document linked to a business object (objectId) in a specific table (objectTableName)
  // dto fields expected by backend: objectId, docTypeCode, docNum, docName, docDescription, file
  upload: async ({ objectTableName, ...payload }) => {
    if (!objectTableName) throw new Error('objectTableName is required');
    const formData = payload instanceof FormData ? payload : toFormData(payload);
    const response = await apiClient.post(`/documents/${encodeURIComponent(objectTableName)}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data; // returns Document
  },

  // Update an existing document. Expected fields: docId (required), docTypeCode, docNum, docName, docDescription, file
  update: async (payload) => {
    const formData = payload instanceof FormData ? payload : toFormData(payload);
    const response = await apiClient.put('/documents/update', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data; // returns Document
  },

  // Delete by ID
  deleteById: async (docId) => {
    const response = await apiClient.delete(`/documents/delete/${docId}`);
    return response.data; // boolean
  },

  // Download as Blob, returning { blob, filename, mimeType }
  download: async (docId) => {
    const response = await apiClient.get(`/documents/download/${docId}`, {
      responseType: 'blob',
    });

    const disposition = response.headers['content-disposition'] || '';
    const mimeType = response.headers['content-type'] || 'application/octet-stream';

    let filename = 'document';
    const match = disposition.match(/filename\*=UTF-8''([^;\n\r]+)|filename="?([^";\n\r]+)"?/i);
    if (match) {
      filename = decodeURIComponent(match[1] || match[2] || filename);
    }

    return { blob: response.data, filename, mimeType };
  },

  // Search documents by table and objectId with optional key and pageable
  searchByObject: async ({ tableName, objectId, key, page = 0, size = 20, sort }) => {
    if (!tableName) throw new Error('tableName is required');
    if (objectId === undefined || objectId === null) throw new Error('objectId is required');

    const query = qs.stringify({ key, page, size, sort }, { arrayFormat: 'repeat', skipNulls: true });
    const response = await apiClient.get(`/documents/search/${encodeURIComponent(tableName)}/${objectId}?${query}`);
    return response.data; // Page<Document>
  },

  // Get latest document by type and object as per DocumentResource#getLatest
  latest: async ({ typeCode, objectId, objectTableName }) => {
    if (!typeCode) throw new Error('typeCode is required');
    if (objectId === undefined || objectId === null) throw new Error('objectId is required');
    const query = qs.stringify(
      { typeCode, objectId, objectTableName },
      { arrayFormat: 'repeat', skipNulls: true }
    );
    const response = await apiClient.get(`/documents/open/latest?${query}`);
    return response.data; // ReadDocDTO
  },
};

export default documentApi;
