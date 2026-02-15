import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  // Workflows
  listWorkflows,
  getWorkflow,
  createWorkflow as apiCreateWorkflow,
  updateWorkflow as apiUpdateWorkflow,
  deleteWorkflow as apiDeleteWorkflow,
  searchWorkflows as apiSearchWorkflows,
  getAvailableObjectTypes as apiGetAvailableObjectTypes,
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
  // Transition Side Effects
  listTransitionSideEffectsByTransition as apiListTransitionSideEffectsByTransition,
  searchTransitionSideEffects as apiSearchTransitionSideEffects,
  createTransitionSideEffect as apiCreateTransitionSideEffect,
  updateTransitionSideEffect as apiUpdateTransitionSideEffect,
  deleteTransitionSideEffect as apiDeleteTransitionSideEffect,
  validateTransitionSideEffectJson as apiValidateTransitionSideEffectJson,
  // Workflow Statuses
  listWorkflowStatuses as apiListWorkflowStatuses,
  searchWorkflowStatuses as apiSearchWorkflowStatuses,
  createWorkflowStatus as apiCreateWorkflowStatus,
  updateWorkflowStatus as apiUpdateWorkflowStatus,
  // Workflow Status Groups
  searchWorkflowStatusGroups as apiSearchWorkflowStatusGroups,
  createWorkflowStatusGroup as apiCreateWorkflowStatusGroup,
  updateWorkflowStatusGroup as apiUpdateWorkflowStatusGroup,
  getWorkflowStatusGroup as apiGetWorkflowStatusGroup,
  deleteWorkflowStatusGroup as apiDeleteWorkflowStatusGroup,
  getWorkflowStatusGroupAuthorityCodes as apiGetWorkflowStatusGroupAuthorityCodes,
  getAccessibleWorkflowStatusGroups as apiGetAccessibleWorkflowStatusGroups,
  isStatusVisibleByGroup as apiIsStatusVisibleByGroup,
  // Workflow Execution
  getAvailableTransitions as apiGetAvailableTransitions,
  applyTransition as apiApplyTransition,
  getWorkflowHistory as apiGetWorkflowHistory,
  getGeneralInfo as apiGetGeneralInfo,
} from '../../api/workflowApi';

export const WORKFLOW_KEYS = {
  all: ['workflows'],
  lists: () => [...WORKFLOW_KEYS.all, 'list'],
  list: () => [...WORKFLOW_KEYS.lists()],
  details: () => [...WORKFLOW_KEYS.all, 'detail'],
  detail: (id) => [...WORKFLOW_KEYS.details(), id],
  search: (params) => [...WORKFLOW_KEYS.all, 'search', params?.key ?? null, params?.active ?? null, params?.page ?? 0, params?.size ?? 10],
  objectTypes: () => [...WORKFLOW_KEYS.all, 'object-types'],
};

export const TRANSITION_KEYS = {
  all: ['transitions'],
  byWorkflow: (workflowId) => [...TRANSITION_KEYS.all, 'byWorkflow', Number(workflowId) || 0],
  search: (params) => [...TRANSITION_KEYS.all, 'search', { ...params }],
  detail: (id) => [...TRANSITION_KEYS.all, 'detail', id],
};

export const RULE_KEYS = {
  all: ['transitionRules'],
  byTransition: (transitionId) => [...RULE_KEYS.all, 'byTransition', transitionId],
  detail: (id) => [...RULE_KEYS.all, 'detail', id],
};

export const VALIDATION_CFG_KEYS = {
  all: ['transitionValidationConfig'],
  detail: (transitionId) => [...VALIDATION_CFG_KEYS.all, 'detail', transitionId],
};

export const SIDE_EFFECT_KEYS = {
  all: ['transitionSideEffects'],
  byTransition: (transitionId) => [...SIDE_EFFECT_KEYS.all, 'byTransition', transitionId],
  detail: (id) => [...SIDE_EFFECT_KEYS.all, 'detail', id],
  search: (params) => [...SIDE_EFFECT_KEYS.all, 'search', { ...params }],
};

export const STATUS_KEYS = {
  all: ['workflowStatuses'],
  byWorkflow: (workflowId) => [...STATUS_KEYS.all, 'byWorkflow', Number(workflowId) || 0],
  search: (params) => [...STATUS_KEYS.all, 'search', { ...params }],
};

export const STATUS_GROUP_KEYS = {
  all: ['workflowStatusGroups'],
  details: () => [...STATUS_GROUP_KEYS.all, 'detail'],
  detail: (id) => [...STATUS_GROUP_KEYS.details(), id],
  search: (params) => [
    ...STATUS_GROUP_KEYS.all,
    'search',
    params?.workflowId ?? null,
    params?.key ?? null,
    params?.page ?? 0,
    params?.size ?? 10
  ],
  accessible: (workflowCode) => [...STATUS_GROUP_KEYS.all, 'accessible', workflowCode],
  isVisible: (groupCode, statusCode) => [...STATUS_GROUP_KEYS.all, 'is-visible', groupCode, statusCode]
};

export const EXECUTION_KEYS = {
  all: ['workflowExecution'],
  availableTransitions: (workflowCode, objectType, objectId) => [...EXECUTION_KEYS.all, 'availableTransitions', workflowCode, objectType, objectId],
  history: (objectType, objectId, params) => [...EXECUTION_KEYS.all, 'history', objectType, objectId, params],
  generalInfo: (objectType, objectId) => [...EXECUTION_KEYS.all, 'generalInfo', objectType, objectId],
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

export const useAvailableObjectTypes = () => {
  return useQuery({
    queryKey: WORKFLOW_KEYS.objectTypes(),
    queryFn: () => apiGetAvailableObjectTypes(),
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
      queryClient.invalidateQueries({ queryKey: TRANSITION_KEYS.all });
    },
  });
};

export const useUpdateTransition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => apiUpdateTransition(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: TRANSITION_KEYS.all });
    },
  });
};

export const useDeleteTransition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiDeleteTransition(id),
    onSuccess: () => {
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
export const useTransitionRulesByTransition = (transitionId, options = {}) => {
  const enabled = options.enabled ?? !!transitionId;
  return useQuery({
    queryKey: RULE_KEYS.byTransition(transitionId),
    queryFn: () => apiListTransitionRulesByTransition(transitionId),
    enabled,
  });
};

export const useCreateTransitionRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => apiCreateTransitionRule(payload),
    onSuccess: (_data, payload) => {
      if (payload?.transitionId) {
        queryClient.invalidateQueries({ queryKey: RULE_KEYS.byTransition(payload.transitionId) });
      }
    },
  });
};

export const useUpdateTransitionRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => apiUpdateTransitionRule(id, payload),
    onSuccess: (_data, { payload }) => {
      if (payload?.transitionId) {
        queryClient.invalidateQueries({ queryKey: RULE_KEYS.byTransition(payload.transitionId) });
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
    mutationFn: ({ transitionId, facts }) => apiTestTransitionRules(transitionId, facts),
  });
};

// Transition Validation Config
export const useTransitionValidationConfig = (transitionId, options = {}) => {
  const enabled = options.enabled ?? !!transitionId;
  return useQuery({
    queryKey: VALIDATION_CFG_KEYS.detail(transitionId),
    queryFn: () => apiGetTransitionValidationConfig(transitionId),
    enabled,
  });
};

export const usePutTransitionValidationConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ transitionId, dto }) => apiPutTransitionValidationConfig(transitionId, dto),
    onSuccess: (_data, { transitionId }) => {
      queryClient.invalidateQueries({ queryKey: VALIDATION_CFG_KEYS.detail(transitionId) });
    },
  });
};

export const useDeleteTransitionValidationConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (transitionId) => apiDeleteTransitionValidationConfig(transitionId),
    onSuccess: (_data, transitionId) => {
      queryClient.invalidateQueries({ queryKey: VALIDATION_CFG_KEYS.detail(transitionId) });
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

// Workflow Status Groups
export const useSearchWorkflowStatusGroups = (workflowId, params = {}, options = {}) => {
  const { key, page = 0, size = 10 } = params || {};
  const enabled = options.enabled ?? !!workflowId;
  return useQuery({
    queryKey: STATUS_GROUP_KEYS.search({ workflowId, key, page, size }),
    queryFn: () => apiSearchWorkflowStatusGroups(workflowId, { key, page, size }),
    enabled,
    keepPreviousData: true
  });
};

export const useGetWorkflowStatusGroup = (id, options = {}) => {
  const enabled = options.enabled ?? !!id;
  return useQuery({
    queryKey: STATUS_GROUP_KEYS.detail(id),
    queryFn: () => apiGetWorkflowStatusGroup(id),
    enabled,
  });
};

export const useCreateWorkflowStatusGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto) => apiCreateWorkflowStatusGroup(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STATUS_GROUP_KEYS.all });
    },
  });
};

export const useUpdateWorkflowStatusGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }) => apiUpdateWorkflowStatusGroup(id, dto),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: STATUS_GROUP_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: STATUS_GROUP_KEYS.all });
    },
  });
};

export const useDeleteWorkflowStatusGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiDeleteWorkflowStatusGroup(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: STATUS_GROUP_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: STATUS_GROUP_KEYS.all });
    },
  });
};

export const useWorkflowStatusGroupAuthorityCodes = (id, options = {}) => {
  const enabled = options.enabled ?? !!id;
  return useQuery({
    queryKey: [...STATUS_GROUP_KEYS.detail(id), 'authorityCodes'],
    queryFn: () => apiGetWorkflowStatusGroupAuthorityCodes(id),
    enabled,
  });
};

export const useAccessibleWorkflowStatusGroups = (workflowCode, options = {}) => {
  const enabled = options.enabled ?? !!workflowCode;
  return useQuery({
    queryKey: STATUS_GROUP_KEYS.accessible(workflowCode),
    queryFn: () => apiGetAccessibleWorkflowStatusGroups(workflowCode),
    enabled,
  });
};

export const useIsStatusVisibleByGroup = (groupCode, statusCode, options = {}) => {
  const enabled = options.enabled ?? (!!groupCode && !!statusCode);
  return useQuery({
    queryKey: STATUS_GROUP_KEYS.isVisible(groupCode, statusCode),
    queryFn: () => apiIsStatusVisibleByGroup(groupCode, statusCode),
    enabled,
  });
};

// Transition Side Effects
export const useTransitionSideEffects = (transitionId, options = {}) => {
  const enabled = options.enabled ?? !!transitionId;
  return useQuery({
    queryKey: SIDE_EFFECT_KEYS.byTransition(transitionId),
    queryFn: () => apiListTransitionSideEffectsByTransition(transitionId),
    enabled,
  });
};

export const useSearchTransitionSideEffects = (params = {}, options = {}) => {
  const { transitionId, key, page = 0, size = 10 } = params || {};
  const enabled = options.enabled ?? !!transitionId;
  return useQuery({
    queryKey: SIDE_EFFECT_KEYS.search({ transitionId, key, page, size }),
    queryFn: () => apiSearchTransitionSideEffects({ transitionId, key, page, size }),
    enabled,
    keepPreviousData: true,
  });
};

export const useCreateTransitionSideEffect = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => apiCreateTransitionSideEffect(payload),
    onSuccess: (_data, { transitionId }) => {
      queryClient.invalidateQueries({ queryKey: SIDE_EFFECT_KEYS.byTransition(transitionId) });
      queryClient.invalidateQueries({ queryKey: SIDE_EFFECT_KEYS.all });
    },
  });
};

export const useUpdateTransitionSideEffect = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => apiUpdateTransitionSideEffect(id, payload),
    onSuccess: (_data, { id, payload }) => {
      queryClient.invalidateQueries({ queryKey: SIDE_EFFECT_KEYS.detail(id) });
      if (payload?.transitionId) {
        queryClient.invalidateQueries({ queryKey: SIDE_EFFECT_KEYS.byTransition(payload.transitionId) });
      }
      queryClient.invalidateQueries({ queryKey: SIDE_EFFECT_KEYS.all });
    },
  });
};

export const useDeleteTransitionSideEffect = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, transitionId }) => apiDeleteTransitionSideEffect(id),
    onSuccess: (_data, { transitionId }) => {
      if (transitionId) {
        queryClient.invalidateQueries({ queryKey: SIDE_EFFECT_KEYS.byTransition(transitionId) });
      }
      queryClient.invalidateQueries({ queryKey: SIDE_EFFECT_KEYS.all });
    },
  });
};

export const useValidateTransitionSideEffectJson = () => {
  return useMutation({
    mutationFn: (actionConfig) => apiValidateTransitionSideEffectJson(actionConfig),
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
export const TRANSITION_SIDE_EFFECT_QUERY_KEYS = SIDE_EFFECT_KEYS;
export const WORKFLOW_STATUS_QUERY_KEYS = STATUS_KEYS;
export const WORKFLOW_STATUS_GROUP_QUERY_KEYS = STATUS_GROUP_KEYS;
export const WORKFLOW_EXECUTION_QUERY_KEYS = EXECUTION_KEYS;


// Workflow Execution
export const useAvailableTransitions = (workflowCode, objectType, objectId, options = {}) => {
  const enabled = options.enabled ?? (!!workflowCode && !!objectType && !!objectId);
  return useQuery({
    queryKey: EXECUTION_KEYS.availableTransitions(workflowCode, objectType, objectId),
    queryFn: () => apiGetAvailableTransitions(workflowCode, objectType, objectId),
    enabled,
  });
};

export const useApplyTransition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workflowCode, objectType, objectId, transitionId, request, files, fileTypes }) =>
      apiApplyTransition(workflowCode, objectType, objectId, transitionId, request, files, fileTypes),
    onSuccess: (_data, { workflowCode, objectType, objectId }) => {
      // Invalidate available transitions
      queryClient.invalidateQueries({
        queryKey: EXECUTION_KEYS.availableTransitions(workflowCode, objectType, objectId)
      });
      // Invalidate history
      queryClient.invalidateQueries({
        queryKey: EXECUTION_KEYS.history(objectType, objectId)
      });
      // Invalidate general info
      queryClient.invalidateQueries({
        queryKey: EXECUTION_KEYS.generalInfo(objectType, objectId)
      });
      // It might be useful to invalidate the object itself if we had a generic way to know its query key
      // But typically, the consumer will do it or we can rely on onTransitionApplied event as suggested in issue
    }
  });
};

export const useWorkflowHistory = (objectType, objectId, params = {}, options = {}) => {
  const enabled = options.enabled ?? (!!objectType && !!objectId);
  return useQuery({
    queryKey: EXECUTION_KEYS.history(objectType, objectId, params),
    queryFn: () => apiGetWorkflowHistory(objectType, objectId, params),
    enabled,
    keepPreviousData: true,
  });
};

export const useWorkflowGeneralInfo = (objectType, objectId, options = {}) => {
  const enabled = options.enabled ?? (!!objectType && !!objectId);
  return useQuery({
    queryKey: EXECUTION_KEYS.generalInfo(objectType, objectId),
    queryFn: () => apiGetGeneralInfo(objectType, objectId),
    enabled,
  });
};
