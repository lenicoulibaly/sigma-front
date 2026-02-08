import apiClient from './apiClient';
import qs from 'qs';

// API Associations
export const associationApi = {
    createAssociation: async (formData) => {
        const response = await apiClient.post('/associations/create', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },
    // Recherche des associations (paged)
    searchAssociations: async (params = {}) => {
        const queryString = qs.stringify(params, { arrayFormat: 'repeat' });
        const response = await apiClient.get(`/associations/search?${queryString}`);
        return response.data;
    },
    // Liste ouverte pour autocomplétion
    searchOpenList: async (key = '') => {
        const query = qs.stringify({ key });
        const response = await apiClient.get(`/associations/open/search-list?${query}`);
        return response.data;
    },
    // Détails d'une association par ID
    findById: async (assoId) => {
        const response = await apiClient.get(`/associations/find-by-id/${assoId}`);
        return response.data;
    },
};

// API Sections
export const sectionApi = {
    // CRUD Sections
    createSection: async (sectionData) => {
        const response = await apiClient.post('/sections/create', sectionData);
        return response.data;
    },
    updateSection: async (sectionData) => {
        const response = await apiClient.put('/sections/update', sectionData);
        return response.data;
    },

    // Recherche sections
    searchSections: async (params = {}) => {
        const queryString = qs.stringify(params, { arrayFormat: 'repeat' });
        const response = await apiClient.get(`/sections/search?${queryString}`);
        return response.data;
    },
    
    // Sections par association
    getAssociationSections: async (assoId) => {
        const response = await apiClient.get(`/sections/find-by-asso/${assoId}`);
        return response.data;
    },
};

// API Demandes Adhésion
export const demandeAdhesionApi = {
    create: async (dto) => {
        const response = await apiClient.post('/demandes-adhesion', dto);
        return response.data;
    },
    update: async (id, dto) => {
        const response = await apiClient.put(`/demandes-adhesion/${id}`, dto);
        return response.data;
    },
    search: async (assoId, params = {}) => {
        const response = await apiClient.get(`/demandes-adhesion/${assoId}/search`, { params });
        return response.data;
    },
    searchForUser: async (params = {}) => {
        const queryString = qs.stringify(params, { arrayFormat: 'repeat' });
        const response = await apiClient.get(`/demandes-adhesion/user-demandes?${queryString}`);
        return response.data;
    },
    createUserAndDemandeAdhesion: async (dto) => {
        const headers = dto instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {};
        const response = await apiClient.post('/demandes-adhesion/open/user-demande', dto, { headers });
        return response.data;
    },
};