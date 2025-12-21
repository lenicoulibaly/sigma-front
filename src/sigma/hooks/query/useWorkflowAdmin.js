import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  // Workflows
  listWorkflows,
  getWorkflow,
  createWorkflow as apiCreateWorkflow,
  updateWorkflow as apiUpdateWorkflow,
  deleteWorkflow as apiDeleteWorkflow,
  searchWorkflows as apiSearchWorkflows,
  // Transitions
  listTransitionsByWorkflow as apiListTransitionsByWorkflow,
  createTransition as apiCreateTransition,
  updateTransition as apiUpdateTransition,
  deleteTransition as apiDeleteTransition,
  reorderTransitions as apiReorderTransitions,
  searchTransitionsByWorkflow as apiSearchTransitionsByWorkflow,
  // Transition Rules
  listTransitionRulesByTransition as apiListTransitionRulesByTransition,
  createTransitionRule as apiCreateTransitionRule,
  updateTransitionRule as apiUpdateTransitionRule,
  deleteTransitionRule as apiDeleteTransitionRule,
  validateTransitionRuleJson as apiValidateTransitionRuleJson,
  testTransitionRules as apiTestTransitionRules,
  // Transition Validation Config
  getTransitionValidationConfig as apiGetTransitionValidationConfig,
  putTransitionValidationConfig as apiPutTransitionValidationConfig,
  deleteTransitionValidationConfig as apiDeleteTransitionValidationConfig,
  // Workflow Statuses
  listWorkflowStatuses as apiListWorkflowStatuses,
  searchWorkflowStatuses as apiSearchWorkflowStatuses,
  createWorkflowStatus as apiCreateWorkflowStatus,
  updateWorkflowStatus as apiUpdateWorkflowStatus,
} from '../../api/workflowAdminApi';

// Query keys
const WORKFLOW_KEYS = {
  all: ['workflows'],
  lists: () => [...WORKFLOW_KEYS.all, 'list'],
  list: () => [...WORKFLOW_KEYS.lists()],
  details: () => [...WORKFLOW_KEYS.all, 'detail'],
  detail: (id) => [...WORKFLOW_KEYS.details(), id],
  search: (params) => [...WORKFLOW_KEYS.all, 'search', params?.key ?? null, params?.active ?? null, params?.page ?? 0, params?.size ?? 10],
};

const TRANSITION_KEYS = {
  all: ['transitions'],
  byWorkflow: (workflowId) => [...TRANSITION_KEYS.all, 'byWorkflow', Number(workflowId) || 0],
  search: (params) => [...TRANSITION_KEYS.all, 'search', { ...params }],
  detail: (privilegeCode) => [...TRANSITION_KEYS.all, 'detail', privilegeCode],
};

const RULE_KEYS = {
  all: ['transitionRules'],
  byTransition: (privilegeCode) => [...RULE_KEYS.all, 'byTransition', privilegeCode],
  detail: (id) => [...RULE_KEYS.all, 'detail', id],
};

const VALIDATION_CFG_KEYS = {
  all: ['transitionValidationConfig'],
  detail: (privilegeCode) => [...VALIDATION_CFG_KEYS.all, 'detail', privilegeCode],
};

const STATUS_KEYS = {
  all: ['workflowStatuses'],
  byWorkflow: (workflowId) => [...STATUS_KEYS.all, 'byWorkflow', Number(workflowId) || 0],
  search: (params) => [...STATUS_KEYS.all, 'search', { ...params }],
};

// Queries
export const useWorkflows = () => {
  return useQuery({
    queryKey: WORKFLOW_KEYS.list(),
    queryFn: () => listWorkflows(),
  });
};

export const useWorkflow = (id) => {
  return useQuery({
    queryKey: WORKFLOW_KEYS.detail(id),
    queryFn: () => getWorkflow(id),
    enabled: !!id,
  });
};

// New: server-side search with pagination, returns Page<WorkflowAdminDTO>
export const useSearchWorkflows = (params = {}, options = {}) => {
  const { key, active, page = 0, size = 10 } = params || {};
  const enabled = options.enabled ?? true;
  return useQuery({
    queryKey: WORKFLOW_KEYS.search({ key, active, page, size }),
    queryFn: () => apiSearchWorkflows({ key, active, page, size }),
    enabled,
    keepPreviousData: true,
  });
};

// Transitions
export const useTransitionsByWorkflow = (workflowId, options = {}) => {
  const enabled = options.enabled ?? !!workflowId;
  return useQuery({
    queryKey: TRANSITION_KEYS.byWorkflow(workflowId),
    queryFn: () => apiListTransitionsByWorkflow(workflowId),
    enabled,
  });
};

// New: server-side search with pagination for transitions by workflow
export const useSearchTransitionsByWorkflow = (params = {}, options = {}) => {
  const enabled = options.enabled ?? !!params?.workflowId;
  return useQuery({
    queryKey: TRANSITION_KEYS.search(params),
    queryFn: () => apiSearchTransitionsByWorkflow(params),
    enabled,
    keepPreviousData: true,
  });
};

export const useCreateTransition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => apiCreateTransition(payload),
    onSuccess: (data) => {
      if (data?.workflowId) {
        queryClient.invalidateQueries({ queryKey: TRANSITION_KEYS.byWorkflow(data.workflowId) });
      } else {
        queryClient.invalidateQueries({ queryKey: TRANSITION_KEYS.all });
      }
    },
  });
};

export const useUpdateTransition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ privilegeCode, payload }) => apiUpdateTransition(privilegeCode, payload),
    onSuccess: (data) => {
      const wfId = data?.workflowId;
      if (wfId) queryClient.invalidateQueries({ queryKey: TRANSITION_KEYS.byWorkflow(wfId) });
    },
  });
};

export const useDeleteTransition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (privilegeCode) => apiDeleteTransition(privilegeCode),
    onSuccess: (_res, privilegeCode, context) => {
      // Broad invalidation when we don't know workflowId
      queryClient.invalidateQueries({ queryKey: TRANSITION_KEYS.all });
    },
  });
};

export const useReorderTransitions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items) => apiReorderTransitions(items),
    onSuccess: (_data, items) => {
      // Attempt to infer workflowId from first item if present in cache elsewhere
      queryClient.invalidateQueries({ queryKey: TRANSITION_KEYS.all });
    },
  });
};

// Transition rules
export const useTransitionRulesByTransition = (privilegeCode, options = {}) => {
  const enabled = options.enabled ?? !!privilegeCode;
  return useQuery({
    queryKey: RULE_KEYS.byTransition(privilegeCode),
    queryFn: () => apiListTransitionRulesByTransition(privilegeCode),
    enabled,
  });
};

export const useCreateTransitionRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => apiCreateTransitionRule(payload),
    onSuccess: (_data, payload) => {
      if (payload?.transitionPrivilegeCode) {
        queryClient.invalidateQueries({ queryKey: RULE_KEYS.byTransition(payload.transitionPrivilegeCode) });
      }
    },
  });
};

export const useUpdateTransitionRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => apiUpdateTransitionRule(id, payload),
    onSuccess: (_data, { payload }) => {
      if (payload?.transitionPrivilegeCode) {
        queryClient.invalidateQueries({ queryKey: RULE_KEYS.byTransition(payload.transitionPrivilegeCode) });
      }
    },
  });
};

export const useDeleteTransitionRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiDeleteTransitionRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RULE_KEYS.all });
    },
  });
};

export const useValidateTransitionRuleJson = () => {
  return useMutation({
    mutationFn: (ruleJson) => apiValidateTransitionRuleJson(ruleJson),
  });
};

export const useTestTransitionRules = () => {
  return useMutation({
    mutationFn: ({ transitionPrivilegeCode, facts }) => apiTestTransitionRules(transitionPrivilegeCode, facts),
  });
};

// Transition Validation Config
export const useTransitionValidationConfig = (privilegeCode, options = {}) => {
  const enabled = options.enabled ?? !!privilegeCode;
  return useQuery({
    queryKey: VALIDATION_CFG_KEYS.detail(privilegeCode),
    queryFn: () => apiGetTransitionValidationConfig(privilegeCode),
    enabled,
  });
};

export const usePutTransitionValidationConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ privilegeCode, dto }) => apiPutTransitionValidationConfig(privilegeCode, dto),
    onSuccess: (_data, { privilegeCode }) => {
      queryClient.invalidateQueries({ queryKey: VALIDATION_CFG_KEYS.detail(privilegeCode) });
    },
  });
};

export const useDeleteTransitionValidationConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (privilegeCode) => apiDeleteTransitionValidationConfig(privilegeCode),
    onSuccess: (_data, privilegeCode) => {
      queryClient.invalidateQueries({ queryKey: VALIDATION_CFG_KEYS.detail(privilegeCode) });
    },
  });
};

// Workflow Statuses
export const useWorkflowStatuses = (workflowId, options = {}) => {
  const enabled = options.enabled ?? !!workflowId;
  return useQuery({
    queryKey: STATUS_KEYS.byWorkflow(workflowId),
    queryFn: () => apiListWorkflowStatuses(workflowId),
    enabled,
  });
};

export const useSearchWorkflowStatuses = (params = {}, options = {}) => {
  const enabled = options.enabled ?? !!params?.workflowId;
  return useQuery({
    queryKey: STATUS_KEYS.search(params),
    queryFn: () => apiSearchWorkflowStatuses(params),
    enabled,
    keepPreviousData: true,
  });
};

export const useCreateWorkflowStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workflowId, dto }) => apiCreateWorkflowStatus(workflowId, dto),
    onSuccess: (_data, { workflowId }) => {
      queryClient.invalidateQueries({ queryKey: STATUS_KEYS.byWorkflow(workflowId) });
    },
  });
};

export const useUpdateWorkflowStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workflowId, id, dto }) => apiUpdateWorkflowStatus(workflowId, id, dto),
    onSuccess: (_data, { workflowId }) => {
      queryClient.invalidateQueries({ queryKey: STATUS_KEYS.byWorkflow(workflowId) });
    },
  });
};

// Mutations for workflows
export const useCreateWorkflow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => apiCreateWorkflow(payload),
    onSuccess: () => {
      // Invalidate list to refresh consumers that rely on react-query
      queryClient.invalidateQueries({ queryKey: WORKFLOW_KEYS.lists() });
      // Also invalidate any search results
      queryClient.invalidateQueries({ queryKey: WORKFLOW_KEYS.all });
    },
  });
};

export const useUpdateWorkflow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => apiUpdateWorkflow(id, payload),
    onSuccess: (data) => {
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: WORKFLOW_KEYS.detail(data.id) });
      }
      queryClient.invalidateQueries({ queryKey: WORKFLOW_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: WORKFLOW_KEYS.all });
    },
  });
};

export const useDeleteWorkflow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiDeleteWorkflow(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKFLOW_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: WORKFLOW_KEYS.all });
    },
  });
};

export const WORKFLOW_QUERY_KEYS = WORKFLOW_KEYS;
export const TRANSITION_QUERY_KEYS = TRANSITION_KEYS;
export const TRANSITION_RULE_QUERY_KEYS = RULE_KEYS;
export const TRANSITION_VALIDATION_QUERY_KEYS = VALIDATION_CFG_KEYS;
export const WORKFLOW_STATUS_QUERY_KEYS = STATUS_KEYS;
