import http from './http';

// Workflows
export const listWorkflows = async () => (await http.get('/admin/workflows')).data;
export const getWorkflow = async (id) => (await http.get(`/admin/workflows/${id}`)).data;
export const createWorkflow = async (payload) => (await http.post('/admin/workflows', payload)).data;
export const updateWorkflow = async (id, payload) => (await http.put(`/admin/workflows/${id}`, payload)).data;
export const deleteWorkflow = async (id) => (await http.delete(`/admin/workflows/${id}`)).data;

// Transitions
export const listTransitions = async () => (await http.get('/admin/transitions')).data;
export const getTransition = async (privilegeCode) => (await http.get(`/admin/transitions/${privilegeCode}`)).data;
export const createTransition = async (payload) => (await http.post('/admin/transitions', payload)).data;
export const updateTransition = async (privilegeCode, payload) => (await http.put(`/admin/transitions/${privilegeCode}`, payload)).data;
export const deleteTransition = async (privilegeCode) => (await http.delete(`/admin/transitions/${privilegeCode}`)).data;
export const listTransitionsByWorkflow = async (workflowId) => (await http.get(`/admin/transitions/by-workflow/${workflowId}`)).data;
export const reorderTransitions = async (items) => (await http.post('/admin/transitions/reorder', items)).data;
export const testTransition = async (privilegeCode, facts) => (await http.post(`/admin/transitions/${privilegeCode}/_test`, { facts })).data;

// Transition Rules
export const listTransitionRules = async () => (await http.get('/admin/transition-rules')).data;
export const listTransitionRulesByTransition = async (transitionPrivilegeCode) => (await http.get(`/admin/transition-rules/by-transition/${transitionPrivilegeCode}`)).data;
export const getTransitionRule = async (id) => (await http.get(`/admin/transition-rules/${id}`)).data;
export const createTransitionRule = async (payload) => (await http.post('/admin/transition-rules', payload)).data;
export const updateTransitionRule = async (id, payload) => (await http.put(`/admin/transition-rules/${id}`, payload)).data;
export const deleteTransitionRule = async (id) => (await http.delete(`/admin/transition-rules/${id}`)).data;
export const validateTransitionRuleJson = async (ruleJson) => (await http.post('/admin/transition-rules/_validate', { ruleJson })).data;
export const testTransitionRules = async (transitionPrivilegeCode, facts) => (await http.post('/admin/transition-rules/_test', { transitionPrivilegeCode, facts })).data;

// Transition Validation Config
export const getTransitionValidationConfig = async (transitionPrivilegeCode) => (await http.get(`/admin/transition-validations/${transitionPrivilegeCode}`)).data;
export const putTransitionValidationConfig = async (transitionPrivilegeCode, dto) => (await http.put(`/admin/transition-validations/${transitionPrivilegeCode}`, dto)).data;
export const deleteTransitionValidationConfig = async (transitionPrivilegeCode) => (await http.delete(`/admin/transition-validations/${transitionPrivilegeCode}`)).data;
