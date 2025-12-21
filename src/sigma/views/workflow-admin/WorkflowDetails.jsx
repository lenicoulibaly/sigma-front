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
import AddIcon from '@mui/icons-material/Add';
import { IconSearch } from '@tabler/icons-react';

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
  { label: 'Liste des étapes', icon: <AccountTreeIcon sx={{ fontSize: '1.3rem' }} /> },
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

  const [stepDialogOpen, setStepDialogOpen] = useState(false);
  const [editingStep, setEditingStep] = useState(null);

  // Server-side search + pagination for statuses (Étapes)
  const [statusPage, setStatusPage] = useState(0);
  const [statusPageSize, setStatusPageSize] = useState(10);
  const [statusKey, setStatusKey] = useState('');

  // Server-side search + pagination for transitions
  const [transPage, setTransPage] = useState(0);
  const [transPageSize, setTransPageSize] = useState(10);
  const [transKey, setTransKey] = useState('');

  const { data: wf, isLoading: wfLoading, refetch: refetchWf } = useWorkflow(id);
  const { data: transData, isLoading: transLoading, refetch: refetchTrans } = useSearchTransitionsByWorkflow(
    { workflowId: id, key: transKey || undefined, page: transPage, size: transPageSize },
    { enabled: value === 2 && !!id }
  );
  const { data: statusData, isLoading: statusLoading, refetch: refetchStatuses } = useSearchWorkflowStatuses(
    { workflowId: id, key: statusKey || undefined, page: statusPage, size: statusPageSize },
    { enabled: value === 1 && !!id }
  );

  useEffect(() => {
    setLoading(wfLoading);
  }, [wfLoading]);

  useEffect(() => {
    if (wf) setWorkflow(wf);
  }, [wf]);


  const handleBack = () => {
    const listParams = location.state?.listParams;
    if (listParams) {
      navigate('/admin/workflows', { state: { restore: listParams } });
    } else {
      navigate('/admin/workflows');
    }
  };
  const handleChange = (e, nv) => setValue(nv);


  // Steps actions (create minimal: add new status by updating workflow)
  const addStep = () => { setEditingStep(null); setStepDialogOpen(true); };
  const { mutateAsync: updateWorkflowMut } = useUpdateWorkflow();
  const submitStep = async (values) => {
    const current = Array.isArray(workflow?.statuses) ? workflow.statuses : [];
    const newItem = {
      statusCode: values.statusCode,
      ordre: values.ordre !== '' ? parseInt(values.ordre, 10) : (current.length + 1),
      start: !!values.start,
      end: !!values.end,
      regulatoryDurationValue: values.regulatoryDurationValue !== '' ? parseInt(values.regulatoryDurationValue, 10) : undefined,
      regulatoryDurationUnitCode: values.regulatoryDurationUnitCode || undefined
    };
    const payload = { ...workflow, statuses: [...current, newItem] };
    await updateWorkflowMut({ id: workflow.id, payload });
    setStepDialogOpen(false);
    await refetchWf();
    // refresh paginated statuses list
    await refetchStatuses();
  };

  // Transitions actions
  const addTransition = () => { setEditingTransition({ workflowId: Number(id) }); setOpenTransitionDialog(true); };
  const { mutateAsync: createTransitionMut } = useCreateTransition();
  const { mutateAsync: updateTransitionMut } = useUpdateTransition();
  const submitTransition = async (values) => {
    if (editingTransition?.privilegeCode) {
      await updateTransitionMut({ privilegeCode: editingTransition.privilegeCode, payload: values });
    } else {
      await createTransitionMut({ ...values, workflowId: Number(id) });
    }
    setOpenTransitionDialog(false);
    await refetchTrans();
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
              <Tab key={index} label={tab.label} icon={tab.icon} iconPosition="start" id={`workflow-tab-${index}`} aria-controls={`workflow-tabpanel-${index}`} />
            ))}
          </Tabs>
        </Grid>
        <Grid item xs={12}>
          <TabPanel value={value} index={0}>
            {loading ? (
              <Box p={2} textAlign="center"><CircularProgress size={24} /></Box>
            ) : workflow ? (
              <Box sx={{ p: 2 }}>
                <Typography variant="subtitle1">Code: {workflow.code}</Typography>
                <Typography variant="subtitle1">Libellé: {workflow.libelle}</Typography>
                <Typography variant="subtitle1">Table cible: {workflow.targetTableNameCode}</Typography>
                <Typography variant="subtitle1">Actif: {workflow.active ? 'Oui' : 'Non'}</Typography>
              </Box>
            ) : null}
          </TabPanel>

          <TabPanel value={value} index={1}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              {/* Search input replaces the title */}
              <OutlinedInput
                value={statusKey}
                onChange={(e) => { setStatusKey(e.target.value); setStatusPage(0); }}
                placeholder="Rechercher une étape (code)"
                startAdornment={<InputAdornment position="start"><IconSearch size={18} /></InputAdornment>}
                size="small"
                sx={{ maxWidth: 360, flex: 1 }}
              />
              <Tooltip title="Ajouter une étape" placement="left" arrow>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={addStep}
                  sx={{ minWidth: '40px', width: 40, height: 40, p: 0, ml: 1 }}
                >
                  <AddIcon />
                </Button>
              </Tooltip>
            </Stack>
            <Paper variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Ordre</TableCell>
                    <TableCell>Code Statut</TableCell>
                    <TableCell>Début</TableCell>
                    <TableCell>Fin</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {statusLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center"><CircularProgress size={20} /></TableCell>
                    </TableRow>
                  ) : ((statusData?.content || []).length > 0 ? (
                    (statusData?.content || []).map((s, idx) => (
                      <TableRow key={`${s.id || s.statusCode}-${idx}`}>
                        <TableCell>{s.ordre}</TableCell>
                        <TableCell>{s.statusCode}</TableCell>
                        <TableCell>{s.start ? 'Oui' : 'Non'}</TableCell>
                        <TableCell>{s.end ? 'Oui' : 'Non'}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">Aucune étape</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
            {/* Pagination for statuses */}
            <Pagination
              count={statusData?.totalPages ?? 0}
              page={statusData?.number ?? statusPage}
              onPageChange={(newPage) => setStatusPage(newPage)}
              rowsPerPage={statusPageSize}
              onRowsPerPageChange={(size) => { setStatusPageSize(size); setStatusPage(0); }}
              totalCount={statusData?.totalElements ?? 0}
            />
            {/* Add dialog */}
            {stepDialogOpen && (
              <StepFormDialog
                open={stepDialogOpen}
                onClose={() => setStepDialogOpen(false)}
                initialValues={{}}
                onSubmit={(vals) => submitStep(vals)}
              />
            )}
          </TabPanel>

          <TabPanel value={value} index={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              {/* Search input replaces the title */}
              <OutlinedInput
                value={transKey}
                onChange={(e) => { setTransKey(e.target.value); setTransPage(0); }}
                placeholder="Rechercher une transition (code, libellé, privilège)"
                startAdornment={<InputAdornment position="start"><IconSearch size={18} /></InputAdornment>}
                size="small"
                sx={{ maxWidth: 360, flex: 1 }}
              />
              <Tooltip title="Ajouter une transition" placement="left" arrow>
                <Button color="primary" variant={'contained'} size="small" onClick={addTransition} sx={{ minWidth: 40, width: 40, height: 40, ml: 1 }}>
                  <AddIcon />
                </Button>
              </Tooltip>
            </Stack>
            <Paper variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Ordre</TableCell>
                    <TableCell>Privilege</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Libellé</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transLoading ? (
                    <TableRow><TableCell colSpan={4} align="center"><CircularProgress size={20} /></TableCell></TableRow>
                  ) : ((transData?.content || []).length > 0 ? (
                    (transData?.content || []).map((t) => (
                      <TableRow key={t.privilegeCode}>
                        <TableCell>{t.ordre}</TableCell>
                        <TableCell>{t.privilegeCode}</TableCell>
                        <TableCell>{t.code}</TableCell>
                        <TableCell>{t.libelle}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">Aucune transition</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
            {/* Pagination for transitions */}
            <Pagination
              count={transData?.totalPages ?? 0}
              page={transData?.number ?? transPage}
              onPageChange={(newPage) => setTransPage(newPage)}
              rowsPerPage={transPageSize}
              onRowsPerPageChange={(size) => { setTransPageSize(size); setTransPage(0); }}
              totalCount={transData?.totalElements ?? 0}
            />

            <TransitionFormDialog open={openTransitionDialog} onClose={() => setOpenTransitionDialog(false)} initialValues={editingTransition} onSubmit={submitTransition} />
          </TabPanel>
        </Grid>
      </Grid>
    </MainCard>
  );
}
