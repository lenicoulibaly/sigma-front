import { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Snackbar,
  Stack,
  Switch,
  FormControlLabel,
  Typography,
  Paper
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  getTransitionValidationConfig,
  putTransitionValidationConfig,
  deleteTransitionValidationConfig
} from 'src/sigma/api/workflowAdminApi';
import { listDocTypes } from 'src/sigma/api/typesApi';

export default function TransitionValidationConfigPage() {
  const { privilegeCode } = useParams();
  const [values, setValues] = useState({ commentRequired: false, requiredDocTypeCodes: [] });
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const t = await listDocTypes();
      setTypes(t || []);
      try {
        const data = await getTransitionValidationConfig(privilegeCode);
        setValues({ commentRequired: !!data.commentRequired, requiredDocTypeCodes: data.requiredDocTypeCodes || [] });
      } catch (e) {
        if (e?.response?.status === 404) {
          setValues({ commentRequired: false, requiredDocTypeCodes: [] });
        } else {
          throw e;
        }
      }
    } catch (e) {
      setError(e?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (privilegeCode) load();
  }, [privilegeCode]);

  const save = async () => {
    try {
      await putTransitionValidationConfig(privilegeCode, { transitionPrivilegeCode: privilegeCode, ...values });
      setSuccess('Configuration enregistrée');
    } catch (e) {
      setError(e?.message || 'Erreur lors de la sauvegarde');
    }
  };

  const resetCfg = async () => {
    if (!window.confirm('Supprimer la configuration de validation ?')) return;
    try {
      await deleteTransitionValidationConfig(privilegeCode);
      setValues({ commentRequired: false, requiredDocTypeCodes: [] });
      setSuccess('Configuration supprimée');
    } catch (e) {
      setError(e?.message || 'Erreur lors de la suppression');
    }
  };

  return (
    <Box p={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Validation — {privilegeCode}</Typography>
        <Button component={RouterLink} to={`/admin/workflows`} startIcon={<ArrowBackIcon />}>Workflows</Button>
      </Stack>
      <Paper sx={{ p: 2 }}>
        <Stack spacing={2}>
          <FormControlLabel
            control={<Switch checked={!!values.commentRequired} onChange={(e) => setValues((v) => ({ ...v, commentRequired: e.target.checked }))} />}
            label="Commentaire obligatoire"
          />
          <FormControl fullWidth>
            <InputLabel>Types de documents requis</InputLabel>
            <Select
              multiple
              value={values.requiredDocTypeCodes}
              onChange={(e) => setValues((v) => ({ ...v, requiredDocTypeCodes: e.target.value }))}
              input={<OutlinedInput label="Types de documents requis" />}
              renderValue={(selected) => (
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {selected.map((val) => (
                    <Chip key={val} label={types.find((t) => t.code === val)?.name || val} />
                  ))}
                </Stack>
              )}
            >
              {types.map((t) => (
                <MenuItem key={t.code} value={t.code}>
                  {t.name || t.code}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={save} disabled={loading}>Enregistrer</Button>
            <Button color="error" onClick={resetCfg}>Supprimer</Button>
          </Stack>
        </Stack>
      </Paper>
      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError('')} message={error} />
      <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess('')} message={success} />
    </Box>
  );
}
