import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { structureApi } from '../../api/administrationApi';

// Query keys
const STRUCTURES_KEYS = {
    all: ['structures'],
    lists: () => [...STRUCTURES_KEYS.all, 'list'],
    list: (filters) => [...STRUCTURES_KEYS.lists(), { ...filters }],
    details: () => [...STRUCTURES_KEYS.all, 'detail'],
    detail: (id) => [...STRUCTURES_KEYS.details(), id],
    root: () => [...STRUCTURES_KEYS.all, 'root'],
    possibleParents: (params) => [...STRUCTURES_KEYS.all, 'possibleParents', { ...params }],
    changeAnchorDto: (id) => [...STRUCTURES_KEYS.all, 'changeAnchorDto', id],
    updateDto: (id) => [...STRUCTURES_KEYS.all, 'updateDto', id],
    visible: () => [...STRUCTURES_KEYS.all, 'visible'],
    openSearch: (params) => [...STRUCTURES_KEYS.all, 'openSearch', { ...params }],
};

// Hooks for fetching structures
export const useStructures = (params = {}) => {
    return useQuery({
        queryKey: STRUCTURES_KEYS.list(params),
        queryFn: () => structureApi.searchStructures(params),
    });
};

export const useRootStructures = () => {
    return useQuery({
        queryKey: STRUCTURES_KEYS.root(),
        queryFn: () => structureApi.getRootStructures(),
    });
};

export const usePossibleParents = (params = {}) => {
    return useQuery({
        queryKey: STRUCTURES_KEYS.possibleParents(params),
        queryFn: () => structureApi.getPossibleParents(params),
    });
};

export const useChangeAnchorDto = (strId) => {
    return useQuery({
        queryKey: STRUCTURES_KEYS.changeAnchorDto(strId),
        queryFn: () => structureApi.getChangeAnchorDto(strId),
        enabled: !!strId,
    });
};

export const useUpdateDto = (strId) => {
    return useQuery({
        queryKey: STRUCTURES_KEYS.updateDto(strId),
        queryFn: () => structureApi.getUpdateDto(strId),
        enabled: !!strId,
    });
};

export const useVisibleStructures = () => {
    return useQuery({
        queryKey: STRUCTURES_KEYS.visible(),
        queryFn: () => structureApi.getVisibleStructures(),
    });
};

export const useOpenStructuresSearch = (params = {}) => {
    return useQuery({
        queryKey: STRUCTURES_KEYS.openSearch(params),
        queryFn: () => structureApi.searchOpenStructures(params),
        enabled: !!(params && typeof params.key === 'string' && params.key.trim().length > 0),
    });
};

// Hooks for mutations
export const useCreateStructure = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (structureData) => structureApi.createStructure(structureData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: STRUCTURES_KEYS.lists() });
            queryClient.invalidateQueries({ queryKey: STRUCTURES_KEYS.root() });
            queryClient.invalidateQueries({ queryKey: STRUCTURES_KEYS.visible() });
        },
    });
};

export const useUpdateStructure = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (structureData) => structureApi.updateStructure(structureData),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: STRUCTURES_KEYS.detail(data.id) });
            queryClient.invalidateQueries({ queryKey: STRUCTURES_KEYS.lists() });
            queryClient.invalidateQueries({ queryKey: STRUCTURES_KEYS.root() });
            queryClient.invalidateQueries({ queryKey: STRUCTURES_KEYS.visible() });
        },
    });
};

export const useChangeAnchor = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (anchorData) => structureApi.changeAnchor(anchorData),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: STRUCTURES_KEYS.detail(data.id) });
            queryClient.invalidateQueries({ queryKey: STRUCTURES_KEYS.lists() });
            queryClient.invalidateQueries({ queryKey: STRUCTURES_KEYS.root() });
            queryClient.invalidateQueries({ queryKey: STRUCTURES_KEYS.visible() });
        },
    });
};
