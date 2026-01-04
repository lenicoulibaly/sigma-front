import { useEffect, useState } from 'react';
import { Grid, TextField, FormControlLabel, Switch, Autocomplete, Button, IconButton, Typography, Divider, Box, styled } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Modal from '../../components/commons/Modal';
import { gridSpacing } from 'store/constant';
import { useTypesByGroupCode, useDirectSousTypes } from '../../hooks/query/useTypes';
import { useCreateWorkflow } from '../../hooks/query/useWorkflow';

// Styled components for labeled frames (align with AssociationModal)
const LabeledFrame = styled(Box)(({ theme }) => ({
  position: 'relative',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(3, 2, 2),
  marginBottom: theme.spacing(1),
  marginTop: theme.spacing(1)
}));

const FrameLabel = styled(Typography)(({ theme }) => ({
  position: 'absolute',
  top: '-12px',
  left: theme.spacing(2),
  padding: theme.spacing(0, 1),
  backgroundColor: theme.palette.background.paper,
  fontWeight: 500,
  fontSize: '0.875rem',
  color: theme.palette.text.primary
}));

export default function WorkflowFormDialog({ open, onClose, initialValues, onSubmit }) {
  const [values, setValues] = useState({ code: '', libelle: '', targetTableNameCode: '', active: true, statuses: [] });
  const [newStatus, setNewStatus] = useState({ statusCode: '', ordre: '', regulatoryDurationValue: '', regulatoryDurationUnitCode: '', start: false, end: false });
  const [selectedTarget, setSelectedTarget] = useState(null);
  const { data: tableTypes, isLoading: isLoadingTables } = useTypesByGroupCode('TABLE');
  const { data: statusTypes, isLoading: isLoadingStatuses } = useDirectSousTypes({ parentCode: 'WKFL_STA' });
  const { data: timeUnitTypes, isLoading: isLoadingTimeUnits } = useTypesByGroupCode('TIME_UNIT');
  const createWorkflowMutation = useCreateWorkflow();

    // Utility: sort statuses by ordre ascending (undefined at end), then by statusCode
    const sortStatuses = (arr = []) => {
      return [...(arr || [])].sort((a, b) => {
        const ao = typeof a?.ordre === 'number' ? a.ordre : Number.isFinite(parseInt(a?.ordre, 10)) ? parseInt(a?.ordre, 10) : Infinity;
        const bo = typeof b?.ordre === 'number' ? b.ordre : Number.isFinite(parseInt(b?.ordre, 10)) ? parseInt(b?.ordre, 10) : Infinity;
        if (ao !== bo) return ao - bo;
        const ac = a?.statusCode || '';
        const bc = b?.statusCode || '';
        return ac.localeCompare(bc);
      });
    };

    const getStatusName = (code) => {
      const found = (statusTypes || []).find((t) => t.code === code);
      return found?.name || code || '';
    };

  useEffect(() => {
    setValues({
      code: initialValues?.code || '',
      libelle: initialValues?.libelle || '',
      targetTableNameCode: initialValues?.targetTableNameCode || '',
      active: initialValues?.active ?? true,
      statuses: Array.isArray(initialValues?.statuses) ? sortStatuses(initialValues.statuses) : []
    });
  }, [initialValues]);

  // Sync selected target option when initial values or options change
  useEffect(() => {
    if (!tableTypes) return;
    const code = (initialValues?.targetTableNameCode) || values.targetTableNameCode;
    if (code) {
      const found = (tableTypes || []).find((t) => t.code === code) || null;
      setSelectedTarget(found);
    } else {
      setSelectedTarget(null);
    }
  }, [tableTypes, initialValues, values.targetTableNameCode]);

  const handleChange = (field) => (e) => setValues((v) => ({ ...v, [field]: e.target.value }));

  const handleToggle = (e) => setValues((v) => ({ ...v, active: e.target.checked }));

  const handleTargetChange = (event, newValue) => {
    setSelectedTarget(newValue);
    setValues((v) => ({ ...v, targetTableNameCode: newValue?.code || '' }));
  };

  // Statuses handlers
  const handleNewStatusChange = (field) => (e) => setNewStatus((s) => ({ ...s, [field]: e.target.value }));
  const handleNewStatusToggle = (field) => (e) => setNewStatus((s) => ({ ...s, [field]: e.target.checked }));
  const handleAddStatus = () => {
    const statusCode = newStatus.statusCode?.trim();
    const ordre = newStatus.ordre !== '' && newStatus.ordre !== undefined ? parseInt(newStatus.ordre, 10) : (values.statuses?.length || 0) + 1;
    if (!statusCode) return;
    const regulatoryDurationValue = newStatus.regulatoryDurationValue !== '' && newStatus.regulatoryDurationValue !== undefined ? parseInt(newStatus.regulatoryDurationValue, 10) : undefined;
    const item = {
      statusCode,
      ordre: Number.isNaN(ordre) ? undefined : ordre,
      regulatoryDurationValue: Number.isNaN(regulatoryDurationValue) ? undefined : regulatoryDurationValue,
      regulatoryDurationUnitCode: newStatus.regulatoryDurationUnitCode?.trim() || undefined,
      start: !!newStatus.start,
      end: !!newStatus.end
    };
    setValues((v) => ({ ...v, statuses: sortStatuses([...(v.statuses || []), item]) }));
    setNewStatus({ statusCode: '', ordre: '', regulatoryDurationValue: '', regulatoryDurationUnitCode: '', start: false, end: false });
  };
  const handleRemoveStatus = (index) => () => {
    setValues((v) => ({ ...v, statuses: sortStatuses((v.statuses || []).filter((_, i) => i !== index)) }));
  };

  const handleEditStatus = (index) => () => {
    setValues((v) => {
      const list = [...(v.statuses || [])];
      const item = list[index];
      if (!item) return v;
      // preload into form fields for editing
      setNewStatus({
        statusCode: item.statusCode || '',
        ordre: item.ordre ?? '',
        regulatoryDurationValue: item.regulatoryDurationValue ?? '',
        regulatoryDurationUnitCode: item.regulatoryDurationUnitCode || '',
        start: !!item.start,
        end: !!item.end
      });
      // remove from list; user will re-add after editing
      const newList = list.filter((_, i) => i !== index);
      return { ...v, statuses: sortStatuses(newList) };
    });
  };

  const handleSubmit = async () => {
    if (!values.code || !values.targetTableNameCode) return;
    // If editing, delegate to parent (update handled there)
    if (initialValues?.id) {
      onSubmit && onSubmit(values);
      return;
    }
    // Creation handled locally via React Query hook
    try {
      await createWorkflowMutation.mutateAsync(values);
      onSubmit && onSubmit(values);
    } catch (e) {
      // Optionally handle error locally; keep minimal changes: do nothing so user can retry
      // Could add feedback later if needed
    }
  };

  const title = initialValues?.id ? 'Modifier le workflow' : 'Nouveau workflow';
  // Ensure we always pass a strict boolean to Modal/CustomAlertDialog to avoid defaulting to true inside
  const isCreating = !!(createWorkflowMutation?.isPending ?? false);
  const actionDisabled = !!(!values.code?.trim() || !values.targetTableNameCode?.trim() || (initialValues?.id ? false : isCreating));
  return (
    <Modal
      open={open}
      title={title}
      handleClose={onClose}
      handleConfirmation={handleSubmit}
      actionDisabled={actionDisabled}
      actionLabel="Enregistrer"
      width="sm"
    >
      <Grid container spacing={gridSpacing}>
        {/* Informations générales */}
        <Grid item xs={12}>
          <LabeledFrame>
            <FrameLabel>Informations générales</FrameLabel>
            <Grid container spacing={gridSpacing}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            size="small"
            label="Code"
            value={values.code}
            onChange={handleChange('code')}
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            size="small"
            label="Libellé"
            value={values.libelle}
            onChange={handleChange('libelle')}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Autocomplete
            options={tableTypes || []}
            getOptionLabel={(option) => option?.name || option?.code || ''}
            value={selectedTarget}
            onChange={handleTargetChange}
            loading={isLoadingTables}
            loadingText="Chargement..."
            noOptionsText="Aucune table"
            size="small"
            renderInput={(params) => (
              <TextField
                {...params}
                fullWidth
                size="small"
                label="Table cible"
                required
              />
            )}
            isOptionEqualToValue={(opt, val) => (opt?.code || '') === (val?.code || '')}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControlLabel control={<Switch checked={!!values.active} onChange={handleToggle} />} label="Actif" />
        </Grid>

        {/* Close Informations générales encart */}
            </Grid>
          </LabeledFrame>
        </Grid>

        {/* Etapes du workflow (Statut) */}
        <Grid item xs={12}>
          <LabeledFrame>
            <FrameLabel>Etapes du workflow</FrameLabel>
            <Grid container spacing={gridSpacing}>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={statusTypes || []}
                  getOptionLabel={(option) => option?.name || option?.code || ''}
                  value={(statusTypes || []).find((t) => t.code === (newStatus.statusCode || '')) || null}
                  onChange={(e, val) => setNewStatus((s) => ({ ...s, statusCode: val?.code || '' }))}
                  loading={isLoadingStatuses}
                  loadingText="Chargement..."
                  noOptionsText="Aucun statut"
                  size="small"
                  isOptionEqualToValue={(opt, val) => (opt?.code || '') === (val?.code || '')}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth size="small" label="Statut" placeholder="Choisir un statut" />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Ordre"
                  value={newStatus.ordre}
                  onChange={handleNewStatusChange('ordre')}
                  placeholder="Ex: 1"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Durée réglementaire"
                  value={newStatus.regulatoryDurationValue}
                  onChange={handleNewStatusChange('regulatoryDurationValue')}
                  placeholder="Ex: 24"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={timeUnitTypes || []}
                  getOptionLabel={(option) => option?.name || option?.code || ''}
                  value={(timeUnitTypes || []).find((t) => t.code === (newStatus.regulatoryDurationUnitCode || '')) || null}
                  onChange={(e, val) => setNewStatus((s) => ({ ...s, regulatoryDurationUnitCode: val?.code || '' }))}
                  loading={isLoadingTimeUnits}
                  loadingText="Chargement..."
                  noOptionsText="Aucune unité"
                  size="small"
                  isOptionEqualToValue={(opt, val) => (opt?.code || '') === (val?.code || '')}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth size="small" label="Unité de durée" placeholder="Choisir une unité" />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControlLabel control={<Switch checked={!!newStatus.start} onChange={handleNewStatusToggle('start')} />} label="Début" />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControlLabel control={<Switch checked={!!newStatus.end} onChange={handleNewStatusToggle('end')} />} label="Fin" />
              </Grid>
              <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                <Button variant="outlined" size="small" onClick={handleAddStatus} disabled={!newStatus.statusCode?.trim()}>
                  Ajouter le statut
                </Button>
              </Grid>

              {/* List of added statuses */}
              {Array.isArray(values.statuses) && values.statuses.length > 0 && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  {sortStatuses(values.statuses).map((s, idx) => (
                    <Grid key={`${s.statusCode}-${idx}`} container spacing={1} alignItems="center" sx={{ py: 0.5 }}>
                      <Grid item xs={12} md={4}>
                        <Typography variant="body2"><b>Statut:</b> {getStatusName(s.statusCode)}</Typography>
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <Typography variant="body2"><b>Ordre:</b> {s.ordre ?? '-'}</Typography>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant="body2">
                          <b>Durée:</b> {s.regulatoryDurationValue ?? '-'} {s.regulatoryDurationUnitCode || ''}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={2} sx={{ textAlign: 'right' }}>
                        <IconButton size="small" color="primary" onClick={handleEditStatus(idx)} aria-label={`Modifier statut ${s.statusCode}`} sx={{ mr: 0.5 }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={handleRemoveStatus(idx)} aria-label={`Supprimer statut ${s.statusCode}`}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Grid>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Grid>
          </LabeledFrame>
        </Grid>
      </Grid>
    </Modal>
  );
}
