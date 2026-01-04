import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { typeApi, typeGroupApi } from '../../api/administrationApi';

// Query keys
const TYPES_KEYS = {
    all: ['types'],
    lists: () => [...TYPES_KEYS.all, 'list'],
    list: (filters) => [...TYPES_KEYS.lists(), { ...filters }],
    byGroup: (groupCode) => [...TYPES_KEYS.all, 'byGroup', groupCode],
    directSousTypes: (params) => [...TYPES_KEYS.all, 'directSousTypes', { ...params }],
    possibleSousTypes: (params) => [...TYPES_KEYS.all, 'possibleSousTypes', { ...params }],
    possibleParents: (typeCode) => [...TYPES_KEYS.all, 'possibleParents', typeCode],
};

const TYPE_GROUPS_KEYS = {
    all: ['typeGroups'],
    lists: () => [...TYPE_GROUPS_KEYS.all, 'list'],
    list: (filters) => [...TYPE_GROUPS_KEYS.lists(), { ...filters }],
};

// Hooks for fetching types
export const useTypes = (params = {}) => {
    return useQuery({
        queryKey: TYPES_KEYS.list(params),
        queryFn: () => typeApi.searchTypes(params),
    });
};

export const useTypesByGroupCode = (groupCode) => {
    return useQuery({
        queryKey: TYPES_KEYS.byGroup(groupCode),
        queryFn: () => typeApi.getTypesByGroup(groupCode),
        enabled: !!groupCode,
    });
};

export const useDirectSousTypes = (params = {}) => {
    return useQuery({
        queryKey: TYPES_KEYS.directSousTypes(params),
        queryFn: () => typeApi.getDirectSousTypes(params),
    });
};

export const usePossibleSousTypes = (params = {}) => {
    return useQuery({
        queryKey: TYPES_KEYS.possibleSousTypes(params),
        queryFn: () => typeApi.getPossibleSousTypes(params),
    });
};

export const usePossibleParents = (typeCode) => {
    return useQuery({
        queryKey: TYPES_KEYS.possibleParents(typeCode),
        queryFn: () => typeApi.getPossibleParents(typeCode),
        enabled: !!typeCode,
    });
};

// Hooks for type mutations
export const useCreateType = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (typeData) => typeApi.createType(typeData),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: TYPES_KEYS.lists() });
            if (data.groupCode) {
                queryClient.invalidateQueries({ queryKey: TYPES_KEYS.byGroup(data.groupCode) });
            }
        },
    });
};

export const useUpdateType = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (typeData) => typeApi.updateType(typeData),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: TYPES_KEYS.lists() });
            if (data.groupCode) {
                queryClient.invalidateQueries({ queryKey: TYPES_KEYS.byGroup(data.groupCode) });
            }
        },
    });
};

export const useSetSousTypes = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (sousTypesData) => typeApi.setSousTypes(sousTypesData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TYPES_KEYS.all });
        },
    });
};

// Hooks for fetching type groups
export const useSearchTypeGroups = (params = {}) => {
    return useQuery({
        queryKey: TYPE_GROUPS_KEYS.list(params),
        queryFn: () => typeGroupApi.searchTypeGroups(params),
    });
};

// Hooks for fetching type groups
export const useGetAllTypeGroups = (params = {}) => {
    return useQuery({
        queryKey: TYPE_GROUPS_KEYS.list(params),
        queryFn: () => typeGroupApi.getAllTypeGroups(params),
    });
};

// Hooks for type group mutations
export const useCreateTypeGroup = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (groupData) => typeGroupApi.createTypeGroup(groupData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TYPE_GROUPS_KEYS.lists() });
        },
    });
};

export const useUpdateTypeGroup = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (groupData) => typeGroupApi.updateTypeGroup(groupData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TYPE_GROUPS_KEYS.lists() });
        },
    });
};