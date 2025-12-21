
// Workflows
import apiClient from './apiClient';

export const listWorkflows = async () => (await apiClient.get('/workflows')).data;
export const getWorkflow = async (id) => (await apiClient.get(`/workflows/${id}`)).data;
export const createWorkflow = async (payload) => (await apiClient.post('/workflows', payload)).data;
export const updateWorkflow = async (id, payload) => (await apiClient.put(`/workflows/${id}`, payload)).data;
export const deleteWorkflow = async (id) => (await apiClient.delete(`/workflows/${id}`)).data;
export const searchWorkflows = async ({ key, active, page = 0, size = 10 } = {}) =>
  (await apiClient.get('/workflows/search', { params: { key, active, page, size } })).data;

// Transitions
export const listTransitions = async () => (await apiClient.get('/transitions')).data;
export const getTransition = async (privilegeCode) => (await apiClient.get(`/transitions/${privilegeCode}`)).data;
export const createTransition = async (payload) => (await apiClient.post('/transitions', payload)).data;
export const updateTransition = async (privilegeCode, payload) => (await apiClient.put(`/transitions/${privilegeCode}`, payload)).data;
export const deleteTransition = async (privilegeCode) => (await apiClient.delete(`/transitions/${privilegeCode}`)).data;
export const listTransitionsByWorkflow = async (workflowId) => (await apiClient.get(`/transitions/by-workflow/${workflowId}`)).data;
export const searchTransitionsByWorkflow = async ({ workflowId, key, page = 0, size = 10 } = {}) =>
  (await apiClient.get(`/transitions/by-workflow/${workflowId}/search`, { params: { key, page, size } })).data;
export const reorderTransitions = async (items) => (await apiClient.post('/transitions/reorder', items)).data;
export const testTransition = async (privilegeCode, facts) => (await apiClient.post(`/transitions/${privilegeCode}/_test`, { facts })).data;

// Transition Rules
export const listTransitionRules = async () => (await apiClient.get('/transition-rules')).data;
export const listTransitionRulesByTransition = async (transitionPrivilegeCode) => (await apiClient.get(`/transition-rules/by-transition/${transitionPrivilegeCode}`)).data;
export const getTransitionRule = async (id) => (await apiClient.get(`/transition-rules/${id}`)).data;
export const createTransitionRule = async (payload) => (await apiClient.post('/transition-rules', payload)).data;
export const updateTransitionRule = async (id, payload) => (await apiClient.put(`/transition-rules/${id}`, payload)).data;
export const deleteTransitionRule = async (id) => (await apiClient.delete(`/transition-rules/${id}`)).data;
export const validateTransitionRuleJson = async (ruleJson) => (await apiClient.post('/transition-rules/_validate', { ruleJson })).data;
export const testTransitionRules = async (transitionPrivilegeCode, facts) => (await apiClient.post('/transition-rules/_test', { transitionPrivilegeCode, facts })).data;

// Transition Validation Config
export const getTransitionValidationConfig = async (transitionPrivilegeCode) => (await apiClient.get(`/transition-validations/${transitionPrivilegeCode}`)).data;
export const putTransitionValidationConfig = async (transitionPrivilegeCode, dto) => (await apiClient.put(`/transition-validations/${transitionPrivilegeCode}`, dto)).data;
export const deleteTransitionValidationConfig = async (transitionPrivilegeCode) => (await apiClient.delete(`/transition-validations/${transitionPrivilegeCode}`)).data;

// Workflow Statuses
export const listWorkflowStatuses = async (workflowId) => (await apiClient.get(`/workflows/${workflowId}/statuses`)).data;
export const searchWorkflowStatuses = async ({ workflowId, key, page = 0, size = 10 } = {}) =>
  (await apiClient.get(`/workflows/${workflowId}/statuses/search`, { params: { key, page, size } })).data;
export const createWorkflowStatus = async (workflowId, dto) => (await apiClient.post(`/workflows/${workflowId}/statuses`, dto)).data;
export const updateWorkflowStatus = async (workflowId, id, dto) => (await apiClient.put(`/workflows/${workflowId}/statuses/${id}`, dto)).data;
