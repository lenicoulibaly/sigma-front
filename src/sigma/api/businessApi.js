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