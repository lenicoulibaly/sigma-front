import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sectionApi } from '../../api/businessApi';

// Query keys
const SECTIONS_KEYS = {
    all: ['sections'],
    lists: () => [...SECTIONS_KEYS.all, 'list'],
    list: (filters) => [...SECTIONS_KEYS.lists(), { ...filters }],
    byAsso: (assoId) => [...SECTIONS_KEYS.all, 'byAsso', assoId],
};

/**
 * Hook for searching sections with pagination and filtering
 * @param {Object} params - Search parameters
 * @param {string} [params.key=''] - Search key
 * @param {number} [params.assoId] - Association ID filter
 * @param {number} [params.strId] - Structure ID filter
 * @param {number} [params.page=0] - Page number
 * @param {number} [params.size=10] - Page size
 * @returns {Object} Query result with sections data
 */
export const useSearchSections = (params = {}) => {
    return useQuery({
        queryKey: SECTIONS_KEYS.list(params),
        queryFn: () => sectionApi.searchSections(params),
    });
};

/**
 * Hook for getting sections by association ID
 * @param {number} assoId - Association ID
 * @returns {Object} Query result with association sections
 */
export const useAssociationSections = (assoId) => {
    return useQuery({
        queryKey: SECTIONS_KEYS.byAsso(assoId),
        queryFn: () => sectionApi.getAssociationSections(assoId),
        enabled: !!assoId,
    });
};

/**
 * Hook for creating a new section
 * @returns {Object} Mutation result
 */
export const useCreateSection = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (sectionData) => sectionApi.createSection(sectionData),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: SECTIONS_KEYS.lists() });
            if (data.assoId) {
                queryClient.invalidateQueries({ queryKey: SECTIONS_KEYS.byAsso(data.assoId) });
            }
        },
    });
};

/**
 * Hook for updating a section
 * @returns {Object} Mutation result
 */
export const useUpdateSection = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (sectionData) => sectionApi.updateSection(sectionData),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: SECTIONS_KEYS.lists() });
            if (data.assoId) {
                queryClient.invalidateQueries({ queryKey: SECTIONS_KEYS.byAsso(data.assoId) });
            }
        },
    });
};

/**
 * Main hook that exposes all section operations
 * @returns {Object} Object containing all section hooks
 */
const useSections = () => {
    return {
        useSearchSections,
        useAssociationSections,
        useCreateSection,
        useUpdateSection,
    };
};

export default useSections;