import { useEffect, useMemo, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CheckIcon from '@mui/icons-material/Check';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  useTransitionRulesByTransition,
  useCreateTransitionRule,
  useUpdateTransitionRule,
  useDeleteTransitionRule,
  useValidateTransitionRuleJson,
  useTestTransitionRules
} from 'sigma/hooks/query/useWorkflow';
import JsonEditor from 'src/sigma/components/workflow-admin/JsonEditor';
import FloatingAlert from 'src/sigma/components/commons/FloatingAlert';

export default function TransitionRulesPage() {
  const { transitionId } = useParams();
  const [rules, setRules] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState({ ordre: 1, statutDestinationCode: '', active: true, ruleJson: '{\n  \n}' });
  const [factsText, setFactsText] = useState('{\n  \n}');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  const showAlert = (message, severity = 'success') => setAlert({ open: true, message, severity });
  const [validationMsg, setValidationMsg] = useState('');

  const sortedRules = useMemo(() => [...rules].sort((a, b) => (a.ordre || 0) - (b.ordre || 0)), [rules]);

  const { data, isLoading, refetch } = useTransitionRulesByTransition(transitionId);

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading]);

  useEffect(() => {
    if (Array.isArray(data)) {
      setRules(data || []);
      if (data.length) {
        const r0 = data[0];
        setSelectedId(r0.id);
        setForm({
          ordre: r0.ordre || 1,
          statutDestinationCode: r0.statutDestinationCode || '',
          active: !!r0.active,
          ruleJson: r0.ruleJson || ''
        });
      }
    }
  }, [data]);

  const selectRule = (r) => {
    setSelectedId(r.id);
    setForm({ ordre: r.ordre || 1, statutDestinationCode: r.statutDestinationCode || '', active: !!r.active, ruleJson: r.ruleJson || '' });
  };

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const toggleActive = (e) => setForm((f) => ({ ...f, active: e.target.checked }));

  const handleNew = () => {
    setSelectedId(null);
    setForm({ ordre: (rules?.length || 0) + 1, statutDestinationCode: '', active: true, ruleJson: '{\n  \n}' });
  };

  // Mutations
  const { mutateAsync: createRule } = useCreateTransitionRule();
  const { mutateAsync: updateRule } = useUpdateTransitionRule();
  const { mutateAsync: deleteRule } = useDeleteTransitionRule();
  const { mutateAsync: validateRuleJson } = useValidateTransitionRuleJson();
  const { mutateAsync: runTestRules } = useTestTransitionRules();

  const save = async () => {
    try {
      const payload = {
        transitionId: transitionId,
        ordre: Number(form.ordre) || 0,
        statutDestinationCode: form.statutDestinationCode || null,
        active: !!form.active,
        ruleJson: form.ruleJson
      };
      if (selectedId) {
        await updateRule({ id: selectedId, payload: { id: selectedId, ...payload } });
        showAlert('Règle mise à jour');
      } else {
        await createRule(payload);
        showAlert('Règle créée');
      }
      await refetch();
    } catch (e) {
      showAlert(e?.message || "Erreur lors de l'enregistrement", 'error');
    }
  };

  const remove = async () => {
    if (!selectedId) return;
    if (!window.confirm('Supprimer cette règle ?')) return;
    try {
      await deleteRule(selectedId);
      showAlert('Règle supprimée');
      setSelectedId(null);
      await refetch();
    } catch (e) {
      showAlert(e?.message || 'Erreur lors de la suppression', 'error');
    }
  };

  const validate = async () => {
    try {
      const res = await validateRuleJson(form.ruleJson || '');
      setValidationMsg(res.valid ? 'JSON valide' : res.errorMessage || 'Invalide');
      showAlert(res.valid ? 'JSON valide' : 'JSON invalide', res.valid ? 'success' : 'warning');
    } catch (e) {
      setValidationMsg(e?.message || 'Erreur de validation');
      showAlert('Erreur de validation', 'error');
    }
  };

  const test = async () => {
    try {
      const facts = factsText ? JSON.parse(factsText) : {};
      const res = await runTestRules({ transitionId: transitionId, facts });
      showAlert(`nextStatus = ${res.nextStatus}`);
    } catch (e) {
      showAlert(e?.message || 'Erreur lors du test (vérifier le JSON)', 'error');
    }
  };

  return (
    <Box p={2}>
      <FloatingAlert
        open={alert.open}
        feedBackMessages={alert.message}
        severity={alert.severity}
        onClose={() => setAlert({ ...alert, open: false })}
      />
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="h4">Règles de transition — {transitionId}</Typography>
        <Button component={RouterLink} to={`/admin/workflows`} startIcon={<ArrowBackIcon />}>
          Workflows
        </Button>
      </Stack>
      <Paper sx={{ p: 1 }}>
        <Stack direction="row" spacing={2}>
          <Box sx={{ width: 320 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Règles</Typography>
              <IconButton color="primary" size="small" onClick={handleNew} title="Ajouter">
                <AddIcon />
              </IconButton>
            </Stack>
            <Divider sx={{ my: 1 }} />
            <List dense>
              {sortedRules.map((r) => (
                <ListItem key={r.id} disablePadding selected={r.id === selectedId}>
                  <ListItemButton onClick={() => selectRule(r)}>
                    <ListItemText primary={`#${r.ordre} → ${r.statutDestinationCode || '—'}`} secondary={r.active ? 'actif' : 'inactif'} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
          <Divider orientation="vertical" flexItem />
          <Box sx={{ flex: 1 }}>
            <Stack spacing={1}>
              <Stack direction="row" spacing={1}>
                <TextField label="Ordre" type="number" value={form.ordre} onChange={handleChange('ordre')} sx={{ width: 120 }} />
                <TextField label="Statut destination (code)" value={form.statutDestinationCode} onChange={handleChange('statutDestinationCode')} sx={{ flex: 1 }} />
                <FormControlLabel control={<Checkbox checked={!!form.active} onChange={toggleActive} />} label="Actif" />
              </Stack>
              <JsonEditor
                label="ruleJson"
                value={form.ruleJson}
                onChange={(v) => setForm((f) => ({ ...f, ruleJson: v }))}
                actions={
                  <>
                    <Button variant="contained" startIcon={<SaveIcon />} onClick={save} disabled={loading}>
                      Enregistrer
                    </Button>
                    <Button color="error" startIcon={<DeleteIcon />} onClick={remove} disabled={!selectedId}>
                      Supprimer
                    </Button>
                    <Button variant="outlined" startIcon={<CheckIcon />} onClick={validate}>
                      Valider JSON
                    </Button>
                  </>
                }
              />
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1">Tester les règles</Typography>
              <TextField label="facts (JSON)" value={factsText} onChange={(e) => setFactsText(e.target.value)} multiline minRows={6} />
              <Button startIcon={<PlayArrowIcon />} onClick={test} variant="contained">
                Calculer nextStatus
              </Button>
              {!!validationMsg && <Typography color="info.main">{validationMsg}</Typography>}
            </Stack>
          </Box>
        </Stack>
      </Paper>

      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError('')} message={error} />
      <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess('')} message={success} />
    </Box>
  );
}
