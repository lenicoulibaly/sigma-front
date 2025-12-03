import apiClient from './apiClient';
import qs from 'qs'; // tout en haut

// API Utilisateurs
export const userApi = {
    // Recherche utilisateurs
    searchUsers: async (params = {}) => {
        const queryString = qs.stringify(params, { arrayFormat: 'repeat' });
        const response = await apiClient.get(`/users/search?${queryString}`);
        return response.data;
    },

    // Liste des utilisateurs visibles
    getVisibleUsers: async () => {
        const response = await apiClient.get('/users/list/visible');
        return response.data;
    },

    // CRUD Utilisateurs
    createUser: async (userData) => {
        const response = await apiClient.post('/users/open/create', userData);
        return response.data;
    },
    createUserWithProfile: async (userData) => {
        const response = await apiClient.post('/users/create-with-profile', userData);
        return response.data;
    },
    updateUser: async (userData) => {
        const response = await apiClient.put('/users/update', userData);
        return response.data;
    },

    // Gestion statut utilisateurs
    activateUser: async (userData) => {
        const response = await apiClient.put('/users/activate', userData);
        return response.data;
    },
    blockUser: async (userId) => {
        const response = await apiClient.put(`/users/block/${userId}`);
        return response.data;
    },
    unblockUser: async (userId) => {
        const response = await apiClient.put(`/users/unblock/${userId}`);
        return response.data;
    },

    // Gestion mots de passe
    changePassword: async (passwordData) => {
        const response = await apiClient.put('/users/change-password', passwordData);
        return response.data;
    },
    resetPassword: async (resetData) => {
        const response = await apiClient.put('/users/open/reset-password', resetData);
        return response.data;
    },

    // Emails
    sendActivationEmail: async (userId) => {
        const response = await apiClient.get(`/users/send-activation-email/${userId}`);
        return response.data;
    },
    sendResetPasswordEmail: async (userId) => {
        const response = await apiClient.get(`/users/send-reset-password-email/${userId}`);
        return response.data;
    },

    // Endpoint public pour réinitialisation de mot de passe
    sendResetPasswordEmailByEmail: async (emailData) => {
        const response = await apiClient.post('/users/open/send-reset-password-email', emailData);
        return response.data;
    },

    // Connexion (endpoint public)
    login: async (credentials) => {
        const response = await apiClient.post('/users/open/login', credentials);
        return response.data;
    },
};

// API Autorités - Privilèges
export const privilegeApi = {
    // CRUD Privilèges
    createPrivilege: async (privilegeData) => {
        const response = await apiClient.post('/authorities/privileges/create', privilegeData);
        return response.data;
    },
    createPrivileges: async (privilegesData) => {
        const response = await apiClient.post('/authorities/privileges/creates', privilegesData);
        return response.data;
    },
    updatePrivilege: async (privilegeData) => {
        const response = await apiClient.put('/authorities/privileges/update', privilegeData);
        return response.data;
    },

    // Recherche privilèges
    getPrivilegesListByTypeCodes: async (params = {}) => {
        const queryString = qs.stringify(params, { arrayFormat: 'repeat' });
        const response = await apiClient.get(`/authorities/privileges/list/by-privilege-type-codes?${queryString}`);
        return response.data;
    },
    getPrivilegesByRoleCodes: async (roleCodes = []) => {
        const queryString = qs.stringify({ roleCodes: roleCodes }, { arrayFormat: 'repeat' });
        const response = await apiClient.get(`/authorities/privileges/list/by-role-codes?${queryString}`);
        return response.data;
    },

    searchPrivileges: async (params = {}) => {
        const queryString = qs.stringify(params, { arrayFormat: 'repeat' });
        const response = await apiClient.get(`/authorities/privileges/search?${queryString}`);
        return response.data;
    },
    searchPrivilegesByProfile: async (profileCode, params = {}) => {
        const queryString = qs.stringify(params, { arrayFormat: 'repeat' });
        const response = await apiClient.get(`/authorities/privileges/search/by-profile/${profileCode}?${queryString}`);
        return response.data;
    },
    searchPrivilegesByRole: async (roleCode, params = {}) => {
        const queryString = qs.stringify(params, { arrayFormat: 'repeat' });
        const response = await apiClient.get(`/authorities/privileges/search/by-role/${roleCode}?${queryString}`);
        return response.data;
    },
};

// API Autorités - Rôles
export const roleApi = {
    // CRUD Rôles
    createRole: async (roleData) => {
        const response = await apiClient.post('/authorities/roles/create', roleData);
        return response.data;
    },
    updateRole: async (roleData) => {
        const response = await apiClient.put('/authorities/roles/update', roleData);
        return response.data;
    },

    // Recherche rôles
    searchRoles: async (params = {}) => {
        const queryString = qs.stringify(params, { arrayFormat: 'repeat' });
        const response = await apiClient.get(`/authorities/roles/search?${queryString}`);
        return response.data;
    },
    searchRolesByProfile: async (profileCode, params = {}) => {
        const queryString = qs.stringify(params, { arrayFormat: 'repeat' });
        const response = await apiClient.get(`/authorities/roles/search/by-profile/${profileCode}?${queryString}`);
        return response.data;
    },
};

// API Autorités - Profils
export const profileApi = {
    // CRUD Profils
    createProfile: async (profileData) => {
        const response = await apiClient.post('/authorities/profiles/create', profileData);
        return response.data;
    },
    updateProfile: async (profileData) => {
        const response = await apiClient.put('/authorities/profiles/update', profileData);
        return response.data;
    },

    // Recherche profils
    searchProfiles: async (params = {}) => {
        const queryString = qs.stringify(params, { arrayFormat: 'repeat' });
        const response = await apiClient.get(`/authorities/profiles/search?${queryString}`);
        return response.data;
    },
    searchProfilesByUser: async (params = {}) => {
        const queryString = qs.stringify(params, { arrayFormat: 'repeat' });
        const response = await apiClient.get(`/authorities/user-profiles/search?${queryString}`);
        return response.data;
    },
    getAllProfiles: async () => {
        const response = await apiClient.get('/authorities/profiles/all');
        return response.data;
    },

    // Gestion profils utilisateurs
    addProfileToUser: async (profileUserData) => {
        const response = await apiClient.post('/authorities/add-profile-to-user', profileUserData);
        return response.data;
    },
};

// API Autorités générales
export const authorityApi = {
    // Obtenir les autorités d'un utilisateur
    getUserAuthorities: async (username) => {
        const response = await apiClient.get(`/authorities/${username}`);
        return response.data;
    },

    // Mettre à jour le profil d'un utilisateur
    updateUserProfile: async (profileData) => {
        const response = await apiClient.put('/authorities/update-user-profile', profileData);
        return response.data;
    },

    // Révoquer l'assignation d'un profil
    revokeProfileAssignment: async (id) => {
        const response = await apiClient.put(`/authorities/revoke-profile-assignment/${id}`);
        return response.data;
    },

    // Restaurer l'assignation d'un profil
    restoreProfileAssignment: async (id) => {
        const response = await apiClient.put(`/authorities/restore-profile-assignment/${id}`);
        return response.data;
    },

    // Changer le profil par défaut
    changeDefaultProfile: async (id) => {
        const response = await apiClient.put(`/authorities/change-default-profile/${id}`);
        return response.data;
    },

    // Obtenir les profils actifs d'un utilisateur
    getActiveUserProfiles: async (userId) => {
        const response = await apiClient.get(`/authorities/user-profiles/active/${userId}`);
        return response.data;
    },
};

// API Structures
export const structureApi = {
    // CRUD Structures
    createStructure: async (structureData) => {
        const response = await apiClient.post('/structures/create', structureData);
        return response.data;
    },
    updateStructure: async (structureData) => {
        const response = await apiClient.put('/structures/update', structureData);
        return response.data;
    },

    // Recherche structures
    searchStructures: async (params = {}) => {
        const queryString = qs.stringify(params, { arrayFormat: 'repeat' });
        const response = await apiClient.get(`/structures/search?${queryString}`);
        return response.data;
    },
    getRootStructures: async () => {
        const response = await apiClient.get('/structures/root-structures');
        return response.data;
    },
    getPossibleParents: async (params = {}) => {
        const queryString = qs.stringify(params, { arrayFormat: 'repeat' });
        const response = await apiClient.get(`/structures/possible-parents?${queryString}`);
        return response.data;
    },
    getVisibleStructures: async () => {
        const response = await apiClient.get(`/structures/user-visible-structures`);
        return response.data;
    },

    // Endpoint public de recherche simple (liste)
    searchOpenStructures: async (params = {}) => {
        const queryString = qs.stringify(params, { arrayFormat: 'repeat' });
        const response = await apiClient.get(`/structures/open/search-list?${queryString}`);
        return response.data;
    },

    // Gestion anchor (ancrage)
    getChangeAnchorDto: async (strId) => {
        const response = await apiClient.get(`/structures/change-anchor-dto/${strId}`);
        return response.data;
    },
    changeAnchor: async (anchorData) => {
        const response = await apiClient.put('/structures/change-anchor', anchorData);
        return response.data;
    },

    // DTO pour mise à jour
    getUpdateDto: async (strId) => {
        const response = await apiClient.get(`/structures/update-dto/${strId}`);
        return response.data;
    },
};

// API Types
export const typeApi = {
    // CRUD Types
    createType: async (typeData) => {
        const response = await apiClient.post('/types', typeData);
        return response.data;
    },
    updateType: async (typeData) => {
        const response = await apiClient.put('/types', typeData);
        return response.data;
    },

    // Recherche types
    searchTypes: async (params = {}) => {
        console.log(params);
        const queryString = qs.stringify(params, { arrayFormat: 'repeat' });
        const response = await apiClient.get(`/types/search?${queryString}`);
        return response.data;
    },
    getTypesByGroup: async (groupCode) => {
        const response = await apiClient.get(`/types/by-group/${groupCode}`);
        return response.data;
    },
    getDirectSousTypes: async (params = {}) => {
        const queryString = qs.stringify(params, { arrayFormat: 'repeat' });
        const response = await apiClient.get(`/types/direct-sous-types?${queryString}`);
        return response.data;
    },
    getPossibleSousTypes: async (params = {}) => {
        const queryString = qs.stringify(params, { arrayFormat: 'repeat' });
        const response = await apiClient.get(`/types/possible-sous-types?${queryString}`);
        return response.data;
    },

    // Gestion sous-types
    setSousTypes: async (sousTypesData) => {
        const response = await apiClient.post('/types/set-sous-types', sousTypesData);
        return response.data;
    },
};

// API Groupes de Types
export const typeGroupApi = {
    // CRUD Groupes
    createTypeGroup: async (groupData) => {
        const response = await apiClient.post('/types/groups', groupData);
        return response.data;
    },
    updateTypeGroup: async (groupData) => {
        const response = await apiClient.put('/types/groups', groupData);
        return response.data;
    },

    // Recherche groupes
    searchTypeGroups: async (params = {}) => {
        const queryString = qs.stringify(params, { arrayFormat: 'repeat' });
        const response = await apiClient.get(`/types/groups/search?${queryString}`);
        return response.data;
    },

    getAllTypeGroups: async (params = {}) => {
        const queryString = qs.stringify(params, { arrayFormat: 'repeat' });
        const response = await apiClient.get(`/types/groups/list?${queryString}`);
        return response.data;
    },
};

// API Mail (endpoints publics)
export const mailApi = {
    sendMail: async (mailData) => {
        const response = await apiClient.post('/open/mail/send', mailData);
        return response.data;
    },
};
