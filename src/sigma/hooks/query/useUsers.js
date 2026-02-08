import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../../api/administrationApi';

// Query keys
const USERS_KEYS = {
    all: ['users'],
    lists: () => [...USERS_KEYS.all, 'list'],
    list: (filters) => [...USERS_KEYS.lists(), { ...filters }],
    details: () => [...USERS_KEYS.all, 'detail'],
    detail: (id) => [...USERS_KEYS.details(), id],
};

// Hooks for fetching users
export const useSearchUsers = (params = {}) => {
    return useQuery({
        queryKey: USERS_KEYS.list(params),
        queryFn: () => userApi.searchUsers(params),
    });
};

// Hook for fetching visible users (for autocomplete)
export const useVisibleUsers = () => {
    return useQuery({
        queryKey: [...USERS_KEYS.lists(), 'visible'],
        queryFn: () => userApi.getVisibleUsers(),
    });
};

// Hook for fetching a single user by ID has been removed
// It was erroneous and didn't correspond to anything on the backend
// User information is now obtained from the list instead

// Hooks for mutations
export const useCreateUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userData) => userApi.createUser(userData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: USERS_KEYS.lists() });
        },
    });
};

export const useCreateUserWithProfile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userData) => userApi.createUserWithProfile(userData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: USERS_KEYS.lists() });
        },
    });
};

export const useUpdateUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userData) => userApi.updateUser(userData),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: USERS_KEYS.detail(data.id) });
            queryClient.invalidateQueries({ queryKey: USERS_KEYS.lists() });
        },
    });
};

export const useActivateUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userData) => userApi.activateUser(userData),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: USERS_KEYS.detail(data.id) });
            queryClient.invalidateQueries({ queryKey: USERS_KEYS.lists() });
        },
    });
};

export const useBlockUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userId) => userApi.blockUser(userId),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: USERS_KEYS.detail(variables) });
            queryClient.invalidateQueries({ queryKey: USERS_KEYS.lists() });
        },
    });
};

export const useUnblockUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userId) => userApi.unblockUser(userId),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: USERS_KEYS.detail(variables) });
            queryClient.invalidateQueries({ queryKey: USERS_KEYS.lists() });
        },
    });
};

export const useChangePassword = () => {
    return useMutation({
        mutationFn: (passwordData) => userApi.changePassword(passwordData),
    });
};

export const useResetPassword = () => {
    return useMutation({
        mutationFn: (resetData) => userApi.resetPassword(resetData),
    });
};

export const useSendActivationEmail = () => {
    return useMutation({
        mutationFn: (userId) => userApi.sendActivationEmail(userId),
    });
};

export const useSendResetPasswordEmailByUserId = () => {
    return useMutation({
        mutationFn: (userId) => userApi.sendResetPasswordEmail(userId),
    });
};

export const useSendResetPasswordEmailByEmail = () => {
    return useMutation({
        mutationFn: (email) => userApi.sendPublicResetPasswordEmail(email),
    });
};
