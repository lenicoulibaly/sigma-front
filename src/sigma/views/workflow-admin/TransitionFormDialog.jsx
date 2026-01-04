import {
  TextField,
  FormControlLabel,
  Switch,
  Autocomplete,
  Box,
  InputAdornment,
  Grid,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Checkbox,
  Stack,
  CircularProgress
} from '@mui/material';
import { useFormik } from 'formik';
import Modal from '../../components/commons/Modal';
import FloatingAlert from '../../components/commons/FloatingAlert';
import {
  useWorkflowStatuses,
  useTransitionRulesByTransition,
  useCreateTransitionRule,
  useUpdateTransitionRule,
  useDeleteTransitionRule,
  useValidateTransitionRuleJson,
  useTestTransitionRules,
  useTransitionSideEffects,
  useCreateTransitionSideEffect,
  useUpdateTransitionSideEffect,
  useDeleteTransitionSideEffect,
  useCreateTransition,
  useUpdateTransition
} from 'sigma/hooks/query/useWorkflow';
import { ICON_OPTIONS } from '../../components/commons/IconByName';
import { useGetPrivilegesListByTypeCodes } from 'src/sigma/hooks/query/usePrivileges';
import { useTypesByGroupCode } from 'src/sigma/hooks/query/useTypes';
import { useEffect, useMemo, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckIcon from '@mui/icons-material/Check';
import JsonEditor from 'src/sigma/components/workflow-admin/JsonEditor';

const STEPS = ['Informations générales', 'Règles de transition', 'Effets de bord'];

export default function TransitionFormDialog({ open, onClose, initialValues, onSubmit, defaultStep = 0 }) {
  const [activeStep, setActiveStep] = useState(defaultStep);
  const [savedTransition, setSavedTransition] = useState(initialValues);
  const transitionId = savedTransition?.transitionId;
  const workflowId = initialValues?.workflowId;

  // Feedback state
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  const showAlert = (message, severity = 'success') => setAlert({ open: true, message, severity });

  const { data: statuses = [], isLoading: loadingTransitions } = useWorkflowStatuses(workflowId, { enabled: !!workflowId });

  // Mutations pour la transition (Step 1)
  const { mutateAsync: createTransitionMut } = useCreateTransition();
  const { mutateAsync: updateTransitionMut } = useUpdateTransition();

  useEffect(() => {
    if (open) {
      setActiveStep(defaultStep);
      setSavedTransition(initialValues);
      setSelectedRuleId(null);
      setSelectedSideEffectId(null);
    }
  }, [open, initialValues, defaultStep]);

  // --- Step 2: Rules ---
  const { data: rulesData, isLoading: loadingRules, refetch: refetchRules } = useTransitionRulesByTransition(transitionId, { enabled: activeStep === 1 && !!transitionId });
  const rules = useMemo(() => rulesData || [], [rulesData]);
  const [selectedRuleId, setSelectedRuleId] = useState(null);
  const [ruleForm, setRuleForm] = useState({ ordre: 1, statutDestinationCode: '', active: true, ruleJson: '{\n  \n}' });

  const sortedRules = useMemo(() => [...rules].sort((a, b) => (a.ordre || 0) - (b.ordre || 0)), [rules]);

  useEffect(() => {
    if (activeStep === 1 && Array.isArray(rules) && rules.length > 0 && !selectedRuleId) {
      const r0 = rules[0];
      setSelectedRuleId(r0.id);
      setRuleForm({ ordre: r0.ordre || 1, statutDestinationCode: r0.statutDestinationCode || '', active: !!r0.active, ruleJson: r0.ruleJson || '' });
    }
  }, [rules, activeStep]);

  const { mutateAsync: createRule } = useCreateTransitionRule();
  const { mutateAsync: updateRule } = useUpdateTransitionRule();
  const { mutateAsync: deleteRule } = useDeleteTransitionRule();
  const { mutateAsync: validateRuleJson } = useValidateTransitionRuleJson();
  const { mutateAsync: runTestRules } = useTestTransitionRules();

  const [factsText, setFactsText] = useState('{\n  \n}');
  const [validationMsg, setValidationMsg] = useState('');

  const handleValidateRuleJson = async () => {
    try {
      const res = await validateRuleJson(ruleForm.ruleJson || '');
      setValidationMsg(res.valid ? 'JSON valide' : res.errorMessage || 'Invalide');
      showAlert(res.valid ? 'JSON valide' : 'JSON invalide', res.valid ? 'success' : 'warning');
    } catch (e) {
      setValidationMsg(e?.message || 'Erreur de validation');
      showAlert('Erreur de validation', 'error');
    }
  };

  const handleTestRules = async () => {
    try {
      const facts = factsText ? JSON.parse(factsText) : {};
      const res = await runTestRules({ transitionId: transitionId, facts });
      showAlert(`nextStatus = ${res.nextStatus}`);
    } catch (e) {
      showAlert(e?.message || 'Erreur lors du test (vérifier le JSON)', 'error');
    }
  };

  const handleSaveRule = async () => {
    try {
      const payload = { ...ruleForm, transitionId, ordre: Number(ruleForm.ordre) };
      if (selectedRuleId) {
        await updateRule({ id: selectedRuleId, payload: { id: selectedRuleId, ...payload } });
        showAlert('Règle mise à jour');
      } else {
        const res = await createRule(payload);
        setSelectedRuleId(res.id);
        showAlert('Règle créée');
      }
      refetchRules();
    } catch (e) {
      console.error(e);
      showAlert(e?.message || "Erreur lors de l'enregistrement de la règle", 'error');
    }
  };

  const handleDeleteRule = async () => {
    if (!selectedRuleId || !window.confirm('Supprimer cette règle ?')) return;
    try {
      await deleteRule(selectedRuleId);
      showAlert('Règle supprimée');
      setSelectedRuleId(null);
      setRuleForm({ ordre: rules.length, statutDestinationCode: '', active: true, ruleJson: '{\n  \n}' });
      refetchRules();
    } catch (e) {
      showAlert(e?.message || 'Erreur lors de la suppression', 'error');
    }
  };

  // --- Step 3: Side Effects ---
  const { data: sideEffectsData, isLoading: loadingSideEffects, refetch: refetchSideEffects } = useTransitionSideEffects(transitionId, { enabled: activeStep === 2 && !!transitionId });
  const sideEffects = useMemo(() => sideEffectsData || [], [sideEffectsData]);
  const [selectedSideEffectId, setSelectedSideEffectId] = useState(null);
  const [sideEffectForm, setSideEffectForm] = useState({ name: '', actionType: '', actionConfig: '{\n  \n}', ordre: 0 });

  const sortedSideEffects = useMemo(() => [...sideEffects].sort((a, b) => (a.ordre || 0) - (b.ordre || 0)), [sideEffects]);

  useEffect(() => {
    if (activeStep === 2 && Array.isArray(sideEffects) && sideEffects.length > 0 && !selectedSideEffectId) {
      const s0 = sideEffects[0];
      setSelectedSideEffectId(s0.id);
      setSideEffectForm({ name: s0.name || '', actionType: s0.actionType || '', actionConfig: s0.actionConfig || '{\n  \n}', ordre: s0.ordre || 0 });
    }
  }, [sideEffects, activeStep]);

  const { mutateAsync: createSideEffect } = useCreateTransitionSideEffect();
  const { mutateAsync: updateSideEffect } = useUpdateTransitionSideEffect();
  const { mutateAsync: deleteSideEffect } = useDeleteTransitionSideEffect();

  const handleSaveSideEffect = async () => {
    try {
      const payload = { ...sideEffectForm, transitionId, ordre: Number(sideEffectForm.ordre) };
      if (selectedSideEffectId) {
        await updateSideEffect({ id: selectedSideEffectId, payload: { id: selectedSideEffectId, ...payload } });
        showAlert('Effet mis à jour');
      } else {
        const res = await createSideEffect(payload);
        setSelectedSideEffectId(res.id);
        showAlert('Effet créé');
      }
      refetchSideEffects();
    } catch (e) {
      console.error(e);
      showAlert(e?.message || "Erreur lors de l'enregistrement de l'effet", 'error');
    }
  };

  const handleDeleteSideEffect = async () => {
    if (!selectedSideEffectId || !window.confirm('Supprimer cet effet ?')) return;
    try {
      await deleteSideEffect({ id: selectedSideEffectId, transitionId });
      showAlert('Effet supprimé');
      setSelectedSideEffectId(null);
      setSideEffectForm({ name: '', actionType: '', actionConfig: '{\n  \n}', ordre: sideEffects.length });
      refetchSideEffects();
    } catch (e) {
      showAlert(e?.message || 'Erreur lors de la suppression', 'error');
    }
  };

  // --- Common Logic ---
  const options = Array.isArray(statuses)
    ? statuses.map((t) => ({ id: t.statusCode, label: t.statusName + '(' + t.statusCode + ')', raw: t }))
    : [];

  // Types de privilèges (multi-select) depuis le groupe PRV
  const { data: typesData = [] } = useTypesByGroupCode('PRV');
  const typeOptions = useMemo(
    () => (Array.isArray(typesData) ? typesData.map((t) => ({ id: t.code, label: t.name })) : []),
    [typesData]
  );
  const [selectedTypeCodes, setSelectedTypeCodes] = useState([]);

  // Types de documents (multi-select) depuis le groupe DOC
  const { data: docTypesData = [] } = useTypesByGroupCode('DOC');
  const docTypeOptions = useMemo(
    () => (Array.isArray(docTypesData) ? docTypesData.map((t) => ({ id: t.code, label: t.name })) : []),
    [docTypesData]
  );

  // Privileges list depending on selected type codes
  const privilegeParams = useMemo(() => ({ privilegeTypeCodes: selectedTypeCodes }), [selectedTypeCodes]);
  const { data: privilegesData = [], isLoading: loadingPrivileges } = useGetPrivilegesListByTypeCodes(privilegeParams);
  const privilegeOptions = useMemo(
    () => (Array.isArray(privilegesData) ? privilegesData.map((p) => ({ id: p.code, label: p.name })) : []),
    [privilegesData]
  );

  // Keep selected privilege if it still exists in the filtered list; otherwise clear it
  useEffect(() => {
    const exists = privilegeOptions.some((o) => o.id === formik.values.privilegeCode);
    if (!exists && formik.values.privilegeCode) {
      formik.setFieldValue('privilegeCode', '');
    }
  }, [privilegeOptions]);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      privilegeCode: savedTransition?.privilegeCode || '',
      libelle: savedTransition?.libelle || '',
      ordre: savedTransition?.ordre ?? 0,
      statutOrigineCode: savedTransition?.statutOrigineCode || '',
      defaultStatutDestinationCode: savedTransition?.defaultStatutDestinationCode || '',
      color: savedTransition?.color || '#2196f3',
      icon: savedTransition?.icon || '',
      workflowId: workflowId,
      active: savedTransition?.active ?? true,
      commentRequired: savedTransition?.commentRequired ?? false,
      requiredDocTypeCodes: savedTransition?.requiredDocTypeCodes || [],
    },
    onSubmit: async (vals) => {
      if (!vals.privilegeCode) return;
      try {
        let res;
        if (transitionId) {
          res = await updateTransitionMut({ id: transitionId, payload: { ...vals, transitionId } });
          showAlert('Transition mise à jour');
        } else {
          res = await createTransitionMut(vals);
          showAlert('Transition créée');
        }
        setSavedTransition(res);
      } catch (e) {
        console.error(e);
        showAlert(e?.message || "Erreur lors de l'enregistrement de la transition", 'error');
      }
    }
  });

  const selectedOrigine = options.find((o) => o.id === formik.values.statutOrigineCode || o.raw?.statusCode === formik.values.statutOrigineCode) || null;
  const selectedDestination = options.find((o) => o.id === formik.values.defaultStatutDestinationCode || o.raw?.statusCode === formik.values.defaultStatutDestinationCode) || null;

  const handleNext = () => {
    if (activeStep < STEPS.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  const isLastStep = activeStep === STEPS.length - 1;

  const handleFinish = () => {
    if (onSubmit) {
      onSubmit(savedTransition || initialValues);
    }
    onClose();
  };

  const renderActions = () => {
    return (
      <Stack direction="row" spacing={1} justifyContent="space-between" sx={{ width: '100%' }}>
        <Box>
          {activeStep > 0 && (
            <Button startIcon={<NavigateBeforeIcon />} onClick={handleBack}>
              Précédent
            </Button>
          )}
        </Box>
        <Stack direction="row" spacing={1}>
          {activeStep === 0 && (
            <Button variant="contained" color="primary" startIcon={<SaveIcon />} onClick={() => formik.submitForm()}>
              Enregistrer
            </Button>
          )}
          <Button
            variant="contained"
            color="secondary"
            endIcon={<NavigateNextIcon />}
            onClick={handleNext}
            disabled={(activeStep === 0 && !transitionId) || isLastStep}
          >
            Suivant
          </Button>
        </Stack>
      </Stack>
    );
  };

  return (
    <Modal
      open={open}
      title={transitionId ? 'Modifier la transition' : 'Nouvelle transition'}
      handleClose={onClose}
      width="md"
      actions={renderActions()}
    >
      <FloatingAlert
        open={alert.open}
        feedBackMessages={alert.message}
        severity={alert.severity}
        onClose={() => setAlert({ ...alert, open: false })}
      />
      <Box sx={{ mb: 1 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {activeStep === 0 && (
        <Grid container spacing={2} sx={{ pt: 2 }}>
          <Grid item xs={12} sm={12}>
            <Autocomplete
              multiple
              options={typeOptions}
              value={typeOptions.filter((o) => selectedTypeCodes.includes(o.id))}
              onChange={(e, newValues) => setSelectedTypeCodes(newValues.map((v) => v.id))}
              getOptionLabel={(opt) => opt?.label || ''}
              isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
              renderInput={(params) => (
                <TextField {...params} label="Types de privilège" placeholder="Sélectionner un ou plusieurs types" size="small" />
              )}
              fullWidth
              size="small"
            />
          </Grid>

          <Grid item xs={12} sm={12}>
            <Autocomplete
              options={privilegeOptions}
              loading={loadingPrivileges}
              getOptionLabel={(opt) => opt?.label || ''}
              isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
              value={privilegeOptions.find((o) => o.id === formik.values.privilegeCode) || null}
              onChange={(event, newValue) => {
                formik.setFieldValue('privilegeCode', newValue?.id || '');
              }}
              renderInput={(params) => (
                <TextField {...params} label="Privilège" placeholder="Sélectionner un privilège" size="small" required />
              )}
              fullWidth
              size="small"
            />
          </Grid>

          <Grid item xs={12} sm={12}>
            <TextField label="Libellé" value={formik.values.libelle} onChange={formik.handleChange('libelle')} fullWidth size="small" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Ordre" type="number" value={formik.values.ordre} onChange={formik.handleChange('ordre')} fullWidth size="small" />
          </Grid>


          <Grid item xs={12} sm={6}>
            <Autocomplete
              options={options}
              loading={loadingTransitions}
              getOptionLabel={(opt) => opt?.label || ''}
              isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
              value={selectedOrigine}
              onChange={(event, newValue) => {
                formik.setFieldValue('statutOrigineCode', newValue?.id ?? '');
              }}
              renderInput={(params) => (
                <TextField {...params} label="Statut origine" placeholder="Sélectionner le statut d'origine" size="small" />
              )}
              fullWidth
              size="small"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Autocomplete
              options={options}
              loading={loadingTransitions}
              getOptionLabel={(opt) => opt?.label || ''}
              isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
              value={selectedDestination}
              onChange={(event, newValue) => {
                formik.setFieldValue('defaultStatutDestinationCode', newValue?.id ?? '');
              }}
              renderInput={(params) => (
                <TextField {...params} label="Statut destination par défaut" placeholder="Sélectionner le statut de destination" size="small" />
              )}
              fullWidth
              size="small"
            />
          </Grid>


          <Grid item xs={12} sm={6}>
            <TextField
              label="Couleur"
              type="text"
              value={formik.values.color}
              onChange={(e) => formik.setFieldValue('color', e.target.value)}
              placeholder="#20a2f3"
              InputLabelProps={{ shrink: true }}
              size="small"
              inputProps={{ pattern: '^#?[0-9A-Fa-f]{3}([0-9A-Fa-f]{3})?$' }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Box
                      component="input"
                      type="color"
                      value={formik.values.color || '#2196f3'}
                      onChange={(e) => formik.setFieldValue('color', e.target.value)}
                      sx={{ width: 28, height: 28, p: 0, border: 'none', bgcolor: 'transparent', cursor: 'pointer' }}
                    />
                  </InputAdornment>
                )
              }}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Autocomplete
              options={ICON_OPTIONS}
              getOptionLabel={(opt) => opt?.label || ''}
              isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
              value={ICON_OPTIONS.find((o) => o.id === formik.values.icon) || null}
              onChange={(event, newValue) => {
                formik.setFieldValue('icon', newValue?.id || '');
              }}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {option.icon}
                    <span>{option.label}</span>
                  </Box>
                </li>
              )}
              renderInput={(params) => <TextField {...params} label="Icône" placeholder="Sélectionner une icône" size="small" />}
              fullWidth
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { minHeight: 40, height: 40 } }}
            />
          </Grid>

          {/* Types de documents requis */}
          <Grid item xs={12} sm={6}>
            <Autocomplete
              multiple
              options={docTypeOptions}
              value={docTypeOptions.filter((o) => (formik.values.requiredDocTypeCodes || []).includes(o.id))}
              onChange={(e, newValues) => formik.setFieldValue('requiredDocTypeCodes', newValues.map((v) => v.id))}
              getOptionLabel={(opt) => opt?.label || ''}
              isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
              renderInput={(params) => (
                <TextField {...params} label="Types de documents requis" placeholder="Sélectionner un ou plusieurs types" size="small" />
              )}
              fullWidth
              size="small"
            />
          </Grid>

          {/* Commentaire requis + Actif sur la même ligne */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <FormControlLabel
                control={<Switch size="small" checked={!!formik.values.commentRequired} onChange={(e) => formik.setFieldValue('commentRequired', e.target.checked)} />}
                label="Commentaire requis"
              />
              <FormControlLabel
                control={<Switch size="small" checked={!!formik.values.active} onChange={(e) => formik.setFieldValue('active', e.target.checked)} />}
                label="Actif"
              />
            </Box>
          </Grid>
        </Grid>
      )}

      {activeStep === 1 && (
        <Stack direction="row" spacing={2} sx={{ height: 400 }}>
          <Box sx={{ width: 240, borderRight: 1, borderColor: 'divider', pr: 2, pt: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1" fontWeight="bold">Règles</Typography>
              <IconButton color="primary" size="small" onClick={() => { setSelectedRuleId(null); setRuleForm({ ordre: rules.length + 1, statutDestinationCode: '', active: true, ruleJson: '{\n  \n}' }); }}>
                <AddIcon />
              </IconButton>
            </Stack>
            <Divider sx={{ my: 1 }} />
            {loadingRules ? <CircularProgress size={20} /> : (
              <List dense sx={{ overflowY: 'auto', maxHeight: 350 }}>
                {sortedRules.map((r) => (
                  <ListItem key={r.id} disablePadding selected={r.id === selectedRuleId}>
                    <ListItemButton onClick={() => { setSelectedRuleId(r.id); setRuleForm({ ordre: r.ordre, statutDestinationCode: r.statutDestinationCode, active: r.active, ruleJson: r.ruleJson }); }}>
                      <ListItemText primary={`#${r.ordre} → ${r.statutDestinationCode || '—'}`} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
          <Box sx={{ flex: 1, overflowY: 'auto', pt: 2 }}>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField 
                  label="Ordre" 
                  type="number" 
                  size="small" 
                  value={ruleForm.ordre} 
                  onChange={(e) => setRuleForm({ ...ruleForm, ordre: e.target.value })} 
                  sx={{ width: 80, '& .MuiOutlinedInput-root': { height: 40 } }} 
                />
                <Autocomplete
                  options={statuses}
                  getOptionLabel={(opt) => (opt?.statusName ? `${opt.statusName} (${opt.statusCode})` : opt?.statusCode || '')}
                  isOptionEqualToValue={(opt, val) => opt?.statusCode === val?.statusCode}
                  value={statuses.find((s) => s.statusCode === ruleForm.statutDestinationCode) || null}
                  onChange={(event, newValue) => {
                    setRuleForm({ ...ruleForm, statutDestinationCode: newValue?.statusCode || '' });
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Statut destination" size="small" />
                  )}
                  sx={{ flex: 1, '& .MuiOutlinedInput-root': { height: 40 } }}
                  size="small"
                />
                <FormControlLabel control={<Checkbox checked={ruleForm.active} onChange={(e) => setRuleForm({ ...ruleForm, active: e.target.checked })} />} label="Actif" />
              </Stack>
              <JsonEditor
                label="Condition (JSON)"
                value={ruleForm.ruleJson}
                onChange={(v) => setRuleForm({ ...ruleForm, ruleJson: v })}
                minRows={8}
                actions={
                  <>
                    <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveRule} size="small">
                      Enregistrer
                    </Button>
                    <Button color="error" startIcon={<DeleteIcon />} onClick={handleDeleteRule} size="small" disabled={!selectedRuleId}>
                      Supprimer
                    </Button>
                    <Button variant="outlined" startIcon={<CheckIcon />} onClick={handleValidateRuleJson} size="small">
                      Valider JSON
                    </Button>
                  </>
                }
              />
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" fontWeight="bold">Tester les règles</Typography>
              <TextField 
                label="facts (JSON)" 
                value={factsText} 
                onChange={(e) => setFactsText(e.target.value)} 
                multiline 
                minRows={4} 
                fullWidth
                size="small"
              />
              <Box>
                <Button startIcon={<PlayArrowIcon />} onClick={handleTestRules} variant="contained" size="small">
                  Calculer nextStatus
                </Button>
              </Box>
              {!!validationMsg && <Typography variant="caption" color="info.main">{validationMsg}</Typography>}
            </Stack>
          </Box>
        </Stack>
      )}

      {activeStep === 2 && (
        <Stack direction="row" spacing={2} sx={{ height: 400 }}>
          <Box sx={{ width: 240, borderRight: 1, borderColor: 'divider', pr: 2, pt: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1" fontWeight="bold">Effets</Typography>
              <IconButton color="primary" size="small" onClick={() => { setSelectedSideEffectId(null); setSideEffectForm({ name: '', actionType: '', actionConfig: '{\n  \n}', ordre: sideEffects.length }); }}>
                <AddIcon />
              </IconButton>
            </Stack>
            <Divider sx={{ my: 1 }} />
            {loadingSideEffects ? <CircularProgress size={20} /> : (
              <List dense sx={{ overflowY: 'auto', maxHeight: 350 }}>
                {sortedSideEffects.map((s) => (
                  <ListItem key={s.id} disablePadding selected={s.id === selectedSideEffectId}>
                    <ListItemButton onClick={() => { setSelectedSideEffectId(s.id); setSideEffectForm({ name: s.name || '', actionType: s.actionType, actionConfig: s.actionConfig, ordre: s.ordre }); }}>
                      <ListItemText 
                        primary={s.name || s.actionType} 
                        secondary={
                          <Typography variant="caption" display="block">
                            {`Ordre: ${s.ordre} | Type: ${s.actionType}`}
                          </Typography>
                        } 
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
          <Box sx={{ flex: 1, overflowY: 'auto', pt: 2 }}>
            <Stack spacing={2}>
              <TextField
                label="Nom de l'effet"
                value={sideEffectForm.name || ''}
                onChange={(e) => setSideEffectForm({ ...sideEffectForm, name: e.target.value })}
                size="small"
                fullWidth
                variant="outlined"
              />
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField 
                  label="Ordre" 
                  type="number" 
                  size="small" 
                  value={sideEffectForm.ordre} 
                  onChange={(e) => setSideEffectForm({ ...sideEffectForm, ordre: e.target.value })} 
                  sx={{ width: 80, '& .MuiOutlinedInput-root': { height: 40 } }} 
                />
                <Autocomplete
                  options={[{ value: 'RUN_BEAN_METHOD', label: 'Exécuter une méthode de bean' }]}
                  getOptionLabel={(opt) => opt?.label || ''}
                  isOptionEqualToValue={(opt, val) => (typeof val === 'string' ? opt.value === val : opt.value === val?.value)}
                  value={[{ value: 'RUN_BEAN_METHOD', label: 'Exécuter une méthode de bean' }].find(o => o.value === sideEffectForm.actionType) || null}
                  onChange={(event, newValue) => {
                    const actionType = newValue?.value || '';
                    let actionConfig = sideEffectForm.actionConfig;
                    if (actionType === 'RUN_BEAN_METHOD' && (!actionConfig || actionConfig === '{\n  \n}')) {
                      actionConfig = JSON.stringify({
                        beanName: "",
                        method: "",
                        args: ["${}"]
                      }, null, 2);
                    }
                    setSideEffectForm({ ...sideEffectForm, actionType, actionConfig });
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Type d'action" size="small" />
                  )}
                  sx={{ flex: 1, '& .MuiOutlinedInput-root': { height: 40 } }}
                  size="small"
                />
              </Stack>
              <JsonEditor
                label="Configuration (JSON)"
                value={sideEffectForm.actionConfig}
                onChange={(v) => setSideEffectForm({ ...sideEffectForm, actionConfig: v })}
                minRows={8}
                actions={
                  <>
                    <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveSideEffect} size="small">
                      Enregistrer
                    </Button>
                    <Button
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={handleDeleteSideEffect}
                      size="small"
                      disabled={!selectedSideEffectId}
                    >
                      Supprimer
                    </Button>
                  </>
                }
              />
            </Stack>
          </Box>
        </Stack>
      )}
    </Modal>
  );
}
