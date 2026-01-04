import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Grid,
  Stack,
  Tabs,
  Tab,
  Typography,
  IconButton,
  Tooltip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Button,
  CircularProgress,
  OutlinedInput,
  InputAdornment,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import TransformIcon from '@mui/icons-material/Transform';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RuleIcon from '@mui/icons-material/Rule';
import { useQueryClient } from '@tanstack/react-query';

import MainCard from 'ui-component/cards/MainCard';
import { gridSpacing } from 'store/constant';
import { useWorkflow, useUpdateWorkflow, useCreateTransition, useUpdateTransition, useSearchWorkflowStatuses, useSearchTransitionsByWorkflow } from 'src/sigma/hooks/query/useWorkflowAdmin';
import Pagination from '../../components/commons/Pagination';
import TransitionFormDialog from './TransitionFormDialog';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div role="tabpanel" hidden={value !== index} id={`workflow-tabpanel-${index}`} aria-labelledby={`workflow-tab-${index}`} {...other}>
      {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
    </div>
  );
}

const tabsOption = [
  { label: 'Détails', icon: <InfoIcon sx={{ fontSize: '1.3rem' }} /> },
  { label: 'Liste des statuts', icon: <AccountTreeIcon sx={{ fontSize: '1.3rem' }} /> },
  { label: 'Groupes de statuts', icon: <RuleIcon sx={{ fontSize: '1.3rem' }} /> },
  { label: 'Liste des transitions', icon: <TransformIcon sx={{ fontSize: '1.3rem' }} /> }
];

// Simple modal for adding/editing a workflow status (étape)
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
function StepFormDialog({ open, onClose, initialValues, onSubmit }) {
  const [values, setValues] = useState({ statusCode: '', ordre: '', start: false, end: false, regulatoryDurationValue: '', regulatoryDurationUnitCode: '' });
  useEffect(() => {
    setValues({
      statusCode: initialValues?.statusCode || '',
      ordre: initialValues?.ordre ?? '',
      start: !!initialValues?.start,
      end: !!initialValues?.end,
      regulatoryDurationValue: initialValues?.regulatoryDurationValue ?? '',
      regulatoryDurationUnitCode: initialValues?.regulatoryDurationUnitCode || ''
    });
  }, [initialValues]);
  const handleChange = (field) => (e) => setValues((v) => ({ ...v, [field]: e.target.value }));
  const handleSubmit = () => { if (!values.statusCode) return; onSubmit && onSubmit(values); };
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Nouvelle étape</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Code statut" value={values.statusCode} onChange={handleChange('statusCode')} required />
          <TextField label="Ordre" type="number" value={values.ordre} onChange={handleChange('ordre')} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!values.statusCode}>Enregistrer</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function WorkflowDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const initialTabIndex = location.state?.tabIndex || 0;
  const [value, setValue] = useState(initialTabIndex);

  const [loading, setLoading] = useState(false);
  const [workflow, setWorkflow] = useState(null);

  const [openTransitionDialog, setOpenTransitionDialog] = useState(false);
  const [editingTransition, setEditingTransition] = useState(null);
  const [transitionDefaultStep, setTransitionDefaultStep] = useState(0);

  const [stepDialogOpen, setStepDialogOpen] = useState(false);
  const [editingStep, setEditingStep] = useState(null);

  // Status groups dialog state
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);

    // Feedback alert state
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertSeverity, setAlertSeverity] = useState('info');

  const { data: wf, isLoading: wfLoading, refetch: refetchWf } = useWorkflow(id);
  const { data: transData, isLoading: transLoading, refetch: refetchTrans } = useSearchTransitionsByWorkflow(
    { workflowId: id, key: transKey || undefined, page: transPage, size: transPageSize },
    { enabled: value === 2 && !!id }
  );
  const { data: statusData, isLoading: statusLoading, refetch: refetchStatuses } = useSearchWorkflowStatuses(
    { workflowId: id, key: statusKey || undefined, page: statusPage, size: statusPageSize },
    { enabled: value === 1 && !!id }
  );

  // Controllers for generic lists
  const statusesController = useGenericListController({
    queryHook: (params) => useSearchWorkflowStatuses({ ...params, workflowId: id }, { enabled: value === 1 && !!id }),
    dropdownFilters: [],
    paramMapper: ({ page, size, search }) => ({ page, size, key: search || undefined, workflowId: id })
  });

  const transitionsController = useGenericListController({
    queryHook: (params) => useSearchTransitionsByWorkflow({ ...params, workflowId: id }, { enabled: value === 3 && !!id }),
    dropdownFilters: [],
    paramMapper: ({ page, size, search }) => ({ page, size, key: search || undefined, workflowId: id })
  });

  const statusGroupsController = useGenericListController({
    queryHook: (params) => useSearchWorkflowStatusGroups({ ...params }, { enabled: value === 2 }),
    dropdownFilters: [],
    paramMapper: ({ page, size, search }) => ({ page, size, key: search || undefined })
  });

  useEffect(() => {
    setLoading(wfLoading);
  }, [wfLoading]);

  useEffect(() => {
    if (wf) setWorkflow(wf);
  }, [wf]);


  const handleBack = () => {
    const listParams = location.state?.listParams;
    if (listParams) {
      navigate('/admin/workflows', {
        state: {
          restore: {
            page: listParams.page,
            size: listParams.size,
            search: listParams.search,
            filters: listParams.filters
          }
        }
      });
    } else {
      navigate('/admin/workflows');
    }
  };
  const handleChange = (e, nv) => setValue(nv);


  // Steps actions (create minimal: add new status by updating workflow)
  const queryClient = useQueryClient();
  const { mutateAsync: updateWorkflowMut } = useUpdateWorkflow();
  const addStep = () => { setEditingStep(null); setStepDialogOpen(true); };
  const onEditStep = (row) => {
    // Find full item from workflow.statuses if available to prefill all fields
    const current = Array.isArray(workflow?.statuses) ? workflow.statuses : [];
    const found = current.find((s) => s.statusCode === row.statusCode) || row || {};
    setEditingStep({
      originalStatusCode: row.statusCode,
      statusCode: found.statusCode,
      ordre: found.ordre ?? row.ordre ?? '',
      start: !!(found.start ?? row.start),
      end: !!(found.end ?? row.end),
      regulatoryDurationValue: found.regulatoryDurationValue ?? row.regulatoryDurationValue ?? '',
      regulatoryDurationUnitCode: found.regulatoryDurationUnitCode ?? row.regulatoryDurationUnitCode ?? '',
      color: found.color || row.color || '#2196f3',
      icon: found.icon || row.icon || ''
    });
    setStepDialogOpen(true);
  };
  const onDeleteStep = async (row) => {
    if (!workflow) return;
    try {
      const current = Array.isArray(workflow?.statuses) ? workflow.statuses : [];
      const filtered = current.filter((s) => s.statusCode !== row.statusCode);
      const payload = { ...workflow, statuses: filtered };
      await updateWorkflowMut({ id: workflow.id, payload });
      await refetchWf();
      queryClient.invalidateQueries({ queryKey: WORKFLOW_STATUS_QUERY_KEYS.all });
      setAlertMessage('Étape supprimée avec succès');
      setAlertSeverity('success');
      setAlertOpen(true);
    } catch (e) {
      const msg = e?.response?.data || e?.message || "Erreur lors de la suppression de l'étape";
      setAlertMessage(msg);
      setAlertSeverity('error');
      setAlertOpen(true);
    }
  };
  const submitStep = async (values) => {
    try {
      const current = Array.isArray(workflow?.statuses) ? workflow.statuses : [];
      const newItem = {
        statusCode: values.statusCode,
        ordre: values.ordre !== '' ? parseInt(values.ordre, 10) : undefined,
        start: !!values.start,
        end: !!values.end,
        regulatoryDurationValue: values.regulatoryDurationValue !== '' ? parseInt(values.regulatoryDurationValue, 10) : undefined,
        regulatoryDurationUnitCode: values.regulatoryDurationUnitCode || undefined,
        color: values.color || undefined,
        icon: values.icon || undefined
      };

      let nextStatuses = [];
      const isEdit = !!(editingStep && (editingStep.originalStatusCode || editingStep.statusCode));
      if (isEdit) {
        const idx = current.findIndex((s) => s.statusCode === (editingStep.originalStatusCode || editingStep.statusCode));
        if (idx >= 0) {
          const prev = current[idx];
          const ordre = newItem.ordre !== undefined ? newItem.ordre : (prev?.ordre ?? idx + 1);
          nextStatuses = current.map((s, i) => i === idx ? { ...prev, ...newItem, ordre } : s);
        } else {
          // if not found, append with sensible ordre
          nextStatuses = [...current, { ...newItem, ordre: newItem.ordre !== undefined ? newItem.ordre : (current.length + 1) }];
        }
      } else {
        // create
        const ordre = newItem.ordre !== undefined ? newItem.ordre : (current.length + 1);
        nextStatuses = [...current, { ...newItem, ordre }];
      }

      const payload = { ...workflow, statuses: nextStatuses };
      await updateWorkflowMut({ id: workflow.id, payload });
      setStepDialogOpen(false);
      setEditingStep(null);
      await refetchWf();
      // Invalidate statuses search caches so the list refreshes
      queryClient.invalidateQueries({ queryKey: WORKFLOW_STATUS_QUERY_KEYS.all });
      setAlertMessage(isEdit ? 'Étape mise à jour avec succès' : 'Étape ajoutée avec succès');
      setAlertSeverity('success');
      setAlertOpen(true);
    } catch (e) {
      const msg = e?.response?.data || e?.message || "Erreur lors de l'enregistrement de l'étape";
      setAlertMessage(msg);
      setAlertSeverity('error');
      setAlertOpen(true);
    }
  };

  // Transitions actions
  const addTransition = () => { 
    setEditingTransition({ workflowId: Number(id) }); 
    setTransitionDefaultStep(0);
    setOpenTransitionDialog(true); 
  };
  const onEditTransition = (row) => { 
    setEditingTransition({ ...row, workflowId: Number(id) }); 
    setTransitionDefaultStep(0);
    setOpenTransitionDialog(true); 
  };
  const onShowRules = (row) => { 
    setEditingTransition({ ...row, workflowId: Number(id) }); 
    setTransitionDefaultStep(1);
    setOpenTransitionDialog(true); 
  };
  const onShowSideEffects = (row) => { 
    setEditingTransition({ ...row, workflowId: Number(id) }); 
    setTransitionDefaultStep(2);
    setOpenTransitionDialog(true); 
  };
  const { mutateAsync: createTransitionMut } = useCreateTransition();
  const { mutateAsync: updateTransitionMut } = useUpdateTransition();
  const { mutateAsync: deleteTransitionMut } = useDeleteTransition();
  const onDeleteTransition = async (row) => {
    try {
      await deleteTransitionMut(row?.transitionId);
      setAlertMessage('Transition supprimée avec succès');
      setAlertSeverity('success');
      setAlertOpen(true);
      queryClient.invalidateQueries({ queryKey: TRANSITION_QUERY_KEYS.all });
    } catch (e) {
      const msg = e?.response?.data || e?.message || "Erreur lors de la suppression de la transition";
      setAlertMessage(msg);
      setAlertSeverity('error');
      setAlertOpen(true);
    }
  };
  const submitTransition = async (values) => {
    try {
      if (editingTransition?.transitionId) {
        await updateTransitionMut({ id: editingTransition.transitionId, payload: values });
        setAlertMessage('Transition mise à jour avec succès');
      } else {
        await createTransitionMut({ ...values, workflowId: Number(id) });
        setAlertMessage('Transition créée avec succès');
      }
      setAlertSeverity('success');
      setAlertOpen(true);
      setOpenTransitionDialog(false);
      // Invalidate transitions caches for fresh data
      queryClient.invalidateQueries({ queryKey: TRANSITION_QUERY_KEYS.all });
    } catch (e) {
      const msg = e?.response?.data || e?.message || "Erreur lors de l'enregistrement de la transition";
      setAlertMessage(msg);
      setAlertSeverity('error');
      setAlertOpen(true);
    }
  };

  // Status groups actions
  const addGroup = () => { setEditingGroup(null); setGroupDialogOpen(true); };
  const onEditGroup = (row) => { setEditingGroup(row); setGroupDialogOpen(true); };
  const { mutateAsync: createGroupMut } = useCreateWorkflowStatusGroup();
  const { mutateAsync: updateGroupMut } = useUpdateWorkflowStatusGroup();
  const { mutateAsync: deleteGroupMut } = useDeleteWorkflowStatusGroup();

  const onDeleteGroup = async (row) => {
    try {
      await deleteGroupMut(row?.id);
      setAlertMessage('Groupe supprimé avec succès');
      setAlertSeverity('success');
      setAlertOpen(true);
    } catch (e) {
      const msg = e?.response?.data || e?.message || "Erreur lors de la suppression du groupe";
      setAlertMessage(msg);
      setAlertSeverity('error');
      setAlertOpen(true);
    }
  };

  const submitGroup = async (values) => {
    try {
      if (editingGroup?.id) {
        await updateGroupMut({ id: editingGroup.id, dto: values });
        setAlertMessage('Groupe mis à jour avec succès');
      } else {
        await createGroupMut(values);
        setAlertMessage('Groupe créé avec succès');
      }
      setAlertSeverity('success');
      setAlertOpen(true);
      setGroupDialogOpen(false);
      setEditingGroup(null);
    } catch (e) {
      const msg = e?.response?.data || e?.message || "Erreur lors de l'enregistrement du groupe";
      setAlertMessage(msg);
      setAlertSeverity('error');
      setAlertOpen(true);
    }
  };

  return (
    <MainCard
      title={
        <Stack direction="row" alignItems="center" spacing={1}>
          <Tooltip title="Retour à la liste des workflows">
            <IconButton onClick={handleBack} size="small">
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <Typography variant="h3">{workflow ? `${workflow.code} - ${workflow.libelle}` : 'Détails du workflow'}</Typography>
        </Stack>
      }
      loading={loading}
    >
      <Grid container spacing={gridSpacing}>
        <Grid item xs={12}>
          <Tabs value={value} indicatorColor="primary" textColor="primary" onChange={handleChange} aria-label="workflow tabs" variant="scrollable">
            {tabsOption.map((tab, index) => (
              <Tab key={index} label={tab.label} icon={tab.icon} iconPosition="start" id={`workflow-tab-${index}`} aria-controls={`workflow-tabpanel-${index}`} sx={{ textTransform: 'none' }} />
            ))}
          </Tabs>
        </Grid>
        <Grid item xs={12}>
          <TabPanel value={value} index={0}>
            <DetailsTab loading={loading} workflow={workflow} />
          </TabPanel>

          <TabPanel value={value} index={1}>
            <StatusesTab
              controller={statusesController}
              addStep={addStep}
              onEditStep={onEditStep}
              onDeleteStep={onDeleteStep}
              stepDialogOpen={stepDialogOpen}
              closeStepDialog={() => { setStepDialogOpen(false); setEditingStep(null); }}
              editingStep={editingStep}
              submitStep={submitStep}
            />
          </TabPanel>

          <TabPanel value={value} index={2}>
            <StatusGroupsTab
              controller={statusGroupsController}
              addGroup={addGroup}
              onEditGroup={onEditGroup}
              onDeleteGroup={onDeleteGroup}
              groupDialogOpen={groupDialogOpen}
              closeGroupDialog={() => { setGroupDialogOpen(false); setEditingGroup(null); }}
              editingGroup={editingGroup}
              submitGroup={submitGroup}
              workflowId={id}
            />
          </TabPanel>

          <TabPanel value={value} index={3}>
            <TransitionsTab
              controller={transitionsController}
              addTransition={addTransition}
              onEditTransition={onEditTransition}
              onShowRules={onShowRules}
              onShowSideEffects={onShowSideEffects}
              onDeleteTransition={onDeleteTransition}
              openTransitionDialog={openTransitionDialog}
              closeTransitionDialog={() => setOpenTransitionDialog(false)}
              editingTransition={editingTransition}
              transitionDefaultStep={transitionDefaultStep}
              submitTransition={submitTransition}
            />
          </TabPanel>
        </Grid>
      </Grid>

      {/* Floating feedback alert for all mutations in this page */}
      <FloatingAlert
        open={alertOpen}
        feedBackMessages={alertMessage}
        severity={alertSeverity}
        onClose={() => setAlertOpen(false)}
      />
    </MainCard>
  );
}
