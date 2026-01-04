
// Workflows
import apiClient from './apiClient';

export const listWorkflows = async () => (await apiClient.get('/workflows')).data;
export const getWorkflow = async (id) => (await apiClient.get(`/workflows/${id}`)).data;
export const createWorkflow = async (payload) => (await apiClient.post('/workflows', payload)).data;
export const updateWorkflow = async (id, payload) => (await apiClient.put(`/workflows/${id}`, payload)).data;
export const deleteWorkflow = async (id) => (await apiClient.delete(`/workflows/${id}`)).data;
export const searchWorkflows = async ({ key, active, page = 0, size = 10 } = {}) =>
  (await apiClient.get('/workflows/search', { params: { key, active, page, size } })).data;
export const getAvailableObjectTypes = async () => (await apiClient.get('/workflows/object-types')).data;

// Transitions
export const listTransitions = async () => (await apiClient.get('/transitions')).data;
export const getTransition = async (id) => (await apiClient.get(`/transitions/${id}`)).data;
export const createTransition = async (payload) => (await apiClient.post('/transitions', payload)).data;
export const updateTransition = async (id, payload) => (await apiClient.put(`/transitions/${id}`, payload)).data;
export const deleteTransition = async (id) => (await apiClient.delete(`/transitions/${id}`)).data;
export const listTransitionsByWorkflow = async (workflowId) => (await apiClient.get(`/transitions/by-workflow/${workflowId}`)).data;
export const searchTransitionsByWorkflow = async ({ workflowId, key, page = 0, size = 10 } = {}) =>
  (await apiClient.get(`/transitions/by-workflow/${workflowId}/search`, { params: { key, page, size } })).data;
export const reorderTransitions = async (items) => (await apiClient.post('/transitions/reorder', items)).data;
export const testTransition = async (id, facts) => (await apiClient.post(`/transitions/${id}/_test`, { facts })).data;

// Transition Rules
export const listTransitionRules = async () => (await apiClient.get('/transition-rules')).data;
export const listTransitionRulesByTransition = async (transitionId) => (await apiClient.get(`/transition-rules/by-transition/${transitionId}`)).data;
export const getTransitionRule = async (id) => (await apiClient.get(`/transition-rules/${id}`)).data;
export const createTransitionRule = async (payload) => (await apiClient.post('/transition-rules', payload)).data;
export const updateTransitionRule = async (id, payload) => (await apiClient.put(`/transition-rules/${id}`, payload)).data;
export const deleteTransitionRule = async (id) => (await apiClient.delete(`/transition-rules/${id}`)).data;
export const validateTransitionRuleJson = async (ruleJson) => (await apiClient.post('/transition-rules/_validate', { ruleJson })).data;
export const testTransitionRules = async (transitionId, facts) => (await apiClient.post('/transition-rules/_test', { transitionId, facts })).data;

// Transition Validation Config
export const getTransitionValidationConfig = async (transitionId) => (await apiClient.get(`/transition-validations/${transitionId}`)).data;
export const putTransitionValidationConfig = async (transitionId, dto) => (await apiClient.put(`/transition-validations/${transitionId}`, dto)).data;
export const deleteTransitionValidationConfig = async (transitionId) => (await apiClient.delete(`/transition-validations/${transitionId}`)).data;

// Transition Side Effects
export const listTransitionSideEffectsByTransition = async (transitionId) => (await apiClient.get(`/side-effects/by-transition/${transitionId}`)).data;
export const searchTransitionSideEffects = async ({ transitionId, key, page = 0, size = 10 } = {}) =>
  (await apiClient.get(`/side-effects/by-transition/${transitionId}/search`, { params: { key, page, size } })).data;
export const createTransitionSideEffect = async (payload) => (await apiClient.post('/side-effects', payload)).data;
export const updateTransitionSideEffect = async (id, payload) => (await apiClient.put(`/side-effects/${id}`, payload)).data;
export const deleteTransitionSideEffect = async (id) => (await apiClient.delete(`/side-effects/${id}`)).data;
export const validateTransitionSideEffectJson = async (actionConfig) => (await apiClient.post('/side-effects/_validate', { actionConfig })).data;

// Workflow Statuses
export const listWorkflowStatuses = async (workflowId) => (await apiClient.get(`/workflows/${workflowId}/statuses`)).data;
export const searchWorkflowStatuses = async ({ workflowId, key, page = 0, size = 10 } = {}) =>
  (await apiClient.get(`/workflows/${workflowId}/statuses/search`, { params: { key, page, size } })).data;
export const createWorkflowStatus = async (workflowId, dto) => (await apiClient.post(`/workflows/${workflowId}/statuses`, dto)).data;
export const updateWorkflowStatus = async (workflowId, id, dto) => (await apiClient.put(`/workflows/${workflowId}/statuses/${id}`, dto)).data;

// Workflow Status Groups
export const searchWorkflowStatusGroups = async ({ key, page = 0, size = 10 } = {}) =>
  (await apiClient.get('/workflow-status-groups/search', { params: { key, page, size } })).data;
export const createWorkflowStatusGroup = async (dto) => (await apiClient.post('/workflow-status-groups', dto)).data;
export const updateWorkflowStatusGroup = async (id, dto) => (await apiClient.put(`/workflow-status-groups/${id}`, dto)).data;
export const getWorkflowStatusGroup = async (id) => (await apiClient.get(`/workflow-status-groups/${id}`)).data;
export const deleteWorkflowStatusGroup = async (id) => (await apiClient.delete(`/workflow-status-groups/${id}`)).data;
export const getWorkflowStatusGroupAuthorityCodes = async (id) => (await apiClient.get(`/workflow-status-groups/${id}/authority-codes`)).data;

// Workflow Execution
export const getAvailableTransitions = async (workflowCode, objectType, objectId) =>
  (await apiClient.get(`/workflows/${workflowCode}/objects/${objectType}/${objectId}/available-transitions`)).data;

export const applyTransition = async (workflowCode, objectType, objectId, transitionId, request, files, fileTypes) => {
  const fd = new FormData();
  fd.append('request', new Blob([JSON.stringify(request || {})], { type: 'application/json' }));
  (files || []).forEach((f) => fd.append('files', f));
  (fileTypes || []).forEach((t) => fd.append('fileTypes', t));

  const url = `/workflows/${workflowCode}/objects/${objectType}/${objectId}/transitions/${transitionId}`;
  return (await apiClient.post(url, fd, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
};
