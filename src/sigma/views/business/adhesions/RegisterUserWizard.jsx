import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';

// mui
import {
  Box,
  Grid,
  Button,
  Typography,
  TextField,
  Autocomplete,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  Paper,
  styled,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  Tooltip
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { fr } from 'date-fns/locale';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import SaveIcon from '@mui/icons-material/Save';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

// project imports
import Modal from 'src/sigma/components/commons/Modal';
import FloatingAlert from 'src/sigma/components/commons/FloatingAlert';
import { useOpenStructuresSearch } from 'src/sigma/hooks/query/useStructures';
import { useTypesByGroupCode, useDirectSousTypes } from 'src/sigma/hooks/query/useTypes';
import { useOpenAssociationsList } from 'src/sigma/hooks/query/useAssociations';
import { useCreateUserWithDemandeAdhesion } from 'src/sigma/hooks/query/useAdhesions';
import { useLatestDocument } from 'src/sigma/hooks/query/useDocuments';
import { IFrameModal } from 'src/sigma/components/commons/IFrameModal';

// Styled frames (same spirit as AssociationModal & RegisterUserModal)
const LabeledFrame = styled(Box)(({ theme }) => ({
  position: 'relative',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(3, 2, 2),
  marginBottom: theme.spacing(2.5),
  marginTop: theme.spacing(2.5)
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

const RoundIconButton = styled(IconButton)(({ theme }) => ({
  width: 36,
  height: 36,
  borderRadius: '50%'
}));

// Helpers
const toOption = (item) => ({ id: item?.id ?? item?.value ?? item?.key, label: item?.libelle || item?.label || item?.name || item?.sigle || item?.assoName || `${item?.firstName ?? ''} ${item?.lastName ?? ''}`.trim() });

const emptyDocumentRow = () => ({
  id: Math.random().toString(36).slice(2),
  docTypeCode: '',
  docNum: '',
  docName: '',
  docDescription: '',
  file: null
});

// ==============================|| REGISTER USER WIZARD (2 STEPS) ||============================== //

const RegisterUserWizard = ({ open, handleClose, docParentCode = 'DOC_USER', defaultObjectTableName = 'DEMANDE_ADHESION', onRegistered }) => {
  // Stepper
  const steps = ['Infos personnelles & professionnelles', 'Association & pièces jointes'];
  const [activeStep, setActiveStep] = useState(0);

  // Alerts
  const [alert, setAlert] = useState({ open: false, severity: 'success', message: '' });

  // Data sources
  const [structureQuery, setStructureQuery] = useState('');
  const [structureInput, setStructureInput] = useState('');
  const { data: structures = [], isLoading: loadingStructures } = useOpenStructuresSearch({ key: structureQuery });
  const { data: grades = [], isLoading: loadingGrades } = useTypesByGroupCode('GRADE');
  const { data: emplois = [], isLoading: loadingEmplois } = useTypesByGroupCode('EMPLOI');
  const { data: docTypes = [], isLoading: loadingDocTypes } = useDirectSousTypes({ parentCode: docParentCode });

  // Associations search (open list for autocomplete)
  const [assoQuery, setAssoQuery] = useState('');
  const [assoInput, setAssoInput] = useState('');
  const { data: associations = [], isLoading: loadingAssociations } = useOpenAssociationsList(assoQuery);

  // Form state mapped to UserDTO
  const [values, setValues] = useState({
    email: '',
    matricule: '',
    gradeCode: '',
    firstName: '',
    lastName: '',
    codeCivilite: '',
    tel: '',
    strId: null,
    adresse: '',
    lieuNaissance: '',
    dateNaissance: null,
    emploiCode: '',
    emploiName: '',
    datePremierePriseService: null,
    indice: '',
    assoId: null,
    accepteRgpd: false,
    accepteCharte: false,
    accepteStatutsReglements: false,
    documents: [emptyDocumentRow()]
  });

  const createWithDemande = useCreateUserWithDemandeAdhesion();

  // Latest association docs (charte & statuts/règlements)
  const { data: latestCharteDoc } = useLatestDocument({
    typeCode: 'CHRT_ADH',
    objectId: values.assoId,
    objectTableName: 'ASSOCIATION',
  }, { enabled: !!values.assoId });
  const { data: latestStatutsDoc } = useLatestDocument({
    typeCode: 'DOC_ASSO_STATUTS_REGLEMENTS',
    objectId: values.assoId,
    objectTableName: 'ASSOCIATION',
  }, { enabled: !!values.assoId });

  // Viewer state for documents
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerBase64, setViewerBase64] = useState('');
  const [viewerMime, setViewerMime] = useState('application/pdf');
  const [viewerTitle, setViewerTitle] = useState('');

  const openDocInViewer = (doc, title) => {
    if (!doc) return;
    const base64 = doc?.file || doc?.base64 || '';
    const mime = doc?.docMimeType || doc?.mimeType || 'application/pdf';
    setViewerBase64(base64 || '');
    setViewerMime(mime);
    setViewerTitle(title || doc?.docName || 'Document');
    setViewerOpen(true);
  };

  const setField = (name, value) => setValues((prev) => ({ ...prev, [name]: value }));

  const requiredErrors = useMemo(() => {
    const e = {};
    if (!values.firstName) e.firstName = 'Prénom requis';
    if (!values.lastName) e.lastName = 'Nom requis';
    if (!values.tel) e.tel = 'Téléphone requis';
    return e;
  }, [values.firstName, values.lastName, values.tel]);

  // Validation: indice must be numeric and strictly positive when provided
  const indiceError = useMemo(() => {
    const raw = (values.indice ?? '').toString().trim();
    if (raw === '') return '';
    // Only digits allowed
    if (!/^\d+$/.test(raw)) return 'Indice doit être un nombre positif';
    const num = parseInt(raw, 10);
    if (Number.isNaN(num) || num <= 0) return 'Indice doit être supérieur à 0';
    return '';
  }, [values.indice]);

  const canContinueStep1 = useMemo(() => Object.keys(requiredErrors).length === 0 && !indiceError, [requiredErrors, indiceError]);

  const canSubmit = useMemo(() => {
    const needCharte = !!latestCharteDoc?.docId || !!latestCharteDoc?.id || !!latestCharteDoc;
    const rgpdOk = values.accepteRgpd === true;
    const charteOk = needCharte ? values.accepteCharte === true : true;
    return !!values.assoId && rgpdOk && charteOk;
  }, [values.assoId, values.accepteRgpd, values.accepteCharte, latestCharteDoc]);

  const handleNext = () => setActiveStep((s) => Math.min(s + 1, steps.length - 1));
  const handleBack = () => setActiveStep((s) => Math.max(s - 1, 0));

  const reset = () => {
    setValues({
      email: '', matricule: '', gradeCode: '', firstName: '', lastName: '', codeCivilite: '', tel: '', strId: null, adresse: '', lieuNaissance: '', dateNaissance: null,
      emploiCode: '', emploiName: '', datePremierePriseService: null, indice: '', assoId: null, accepteRgpd: false, accepteCharte: false, accepteStatutsReglements: false, documents: [emptyDocumentRow()]
    });
    setAssoInput('');
    setAssoQuery('');
    setActiveStep(0);
  };

  const showAlert = (message, severity = 'success') => setAlert({ open: true, severity, message });

  const onCloseAlert = () => setAlert((a) => ({ ...a, open: false }));

  const handleSubmit = async () => {
    // Build payload matching AdhesionDTO for /demandes-adhesion/inscription
    const payload = {
      // Required confirmations
      accepteRgpd: values.accepteRgpd === true,
      accepteCharte: values.accepteCharte === true,
      accepteStatutsReglements: values.accepteStatutsReglements === true, 

      // Identity & contact
      email: values.email || undefined,
      matricule: values.matricule || undefined,
      gradeCode: values.gradeCode || undefined,
      codeCivilite: values.codeCivilite || undefined,
      firstName: values.firstName,
      lastName: values.lastName,
      tel: values.tel,
      // Birth & address
      lieuNaissance: values.lieuNaissance || undefined,
      dateNaissance: values.dateNaissance || undefined,
      // Job
      emploiCode: values.emploiCode || undefined,
      emploiName: values.emploiName || undefined,
      indice: values.indice ? parseInt(values.indice, 10) : undefined,
      // Structure & association
      strId: values.strId || undefined,
      assoId: values.assoId || undefined,

      // Documents -> UploadDocReq list
      documents: (values.documents || [])
        .filter((d) => d.docTypeCode && d.file)
        .map((d) => ({
          objectId: undefined, // new user won't have id yet
          docTypeCode: d.docTypeCode,
          docNum: d.docNum || undefined,
          docName: d.docName || undefined,
          docDescription: d.docDescription || undefined,
          file: d.file,
          objectTableName: defaultObjectTableName
        }))
    };

    try {
      await createWithDemande.mutateAsync(payload);
      showAlert('Demande d\'adhésion soumise avec succès', 'success');
      if (typeof onRegistered === 'function') onRegistered();
      reset();
      handleClose?.();
    } catch (e) {
      const apiMsgs = e?.response?.data;
      let msg = '';
      if (Array.isArray(apiMsgs)) msg = apiMsgs.filter(Boolean).join('\n');
      else if (typeof apiMsgs === 'string') msg = apiMsgs;
      else msg = e?.message;
      showAlert(msg || 'Échec de la soumission de la demande', 'error');
    }
  };

  const gradeOptions = useMemo(() => (grades || []).map((g) => ({ code: g?.code, label: g?.name })), [grades]);
  const emploiOptions = useMemo(() => (emplois || []).map(toOption), [emplois]);
  const structureOptions = useMemo(
    () => (structures || []).map((s) => ({ id: s?.strId, label: `${s?.strName} (${s?.chaineSigles})`})),
    [structures]
  );
  const associationOptions = useMemo(
    () => (associations || []).map((a) => ({ id: a?.assoId ?? a?.id, label: a?.assoName || a?.sigle || a?.name || a?.libelle })),
    [associations]
  );
  const docTypeOptions = useMemo(() => (docTypes || []).map((t) => ({ code: t.code || t.value || t.key, label: t.libelle || t.label || t.name || t.code })), [docTypes]);
  const civilityOptions = useMemo(() => (
    [
      { code: 'M.', label: 'Monsieur' },
      { code: 'Mme', label: 'Madame' },
      { code: 'Mlle', label: 'Mademoiselle' }
    ]
  ), []);

  const renderStep1 = () => (
    <Box>
      <LabeledFrame>
        <FrameLabel>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PersonIcon sx={{ mr: 1, fontSize: '1rem' }} /> Informations personnelles
          </Box>
        </FrameLabel>
        <Grid container spacing={2}>

          <Grid item xs={12} sm={6}>
            <TextField size="small" fullWidth label="Nom" value={values.lastName} onChange={(e) => setField('lastName', e.target.value)} error={!!requiredErrors.lastName} helperText={requiredErrors.lastName || ''} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField size="small" fullWidth label="Prénom" value={values.firstName} onChange={(e) => setField('firstName', e.target.value)} error={!!requiredErrors.firstName} helperText={requiredErrors.firstName || ''} />
          </Grid>
          <Grid item xs={12} sm={4}>
                <Autocomplete
                    size="small"
                    options={civilityOptions}
                    value={civilityOptions.find((o) => o.code === values.codeCivilite) || null}
                    onChange={(_e, opt) => setField('codeCivilite', opt?.code || '')}
                    getOptionLabel={(opt) => opt?.label || ''}
                    renderInput={(params) => <TextField {...params} label="Civilité" />}
                />
          </Grid>
          <Grid item xs={12} sm={4}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
              <DatePicker label="Date de naissance" value={values.dateNaissance} onChange={(d) => setField('dateNaissance', d)} slotProps={{ textField: { fullWidth: true, size: 'small' } }} />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField size="small" fullWidth label="Lieu de naissance" value={values.lieuNaissance} onChange={(e) => setField('lieuNaissance', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField size="small" fullWidth label="Téléphone" value={values.tel} onChange={(e) => setField('tel', e.target.value)} error={!!requiredErrors.tel} helperText={requiredErrors.tel || ''} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField size="small" fullWidth label="Email" value={values.email} onChange={(e) => setField('email', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField size="small" fullWidth label="Adresse" value={values.adresse} onChange={(e) => setField('adresse', e.target.value)} />
          </Grid>
        </Grid>
      </LabeledFrame>

      <LabeledFrame>
        <FrameLabel>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <BusinessIcon sx={{ mr: 1, fontSize: '1rem' }} /> Informations professionnelles
          </Box>
        </FrameLabel>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField size="small" fullWidth label="Matricule" value={values.matricule} onChange={(e) => setField('matricule', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={2}>
            <Autocomplete
              size="small"
              options={gradeOptions}
              loading={loadingGrades}
              getOptionLabel={(o) => o?.label || ''}
              value={gradeOptions.find((o) => o.code === values.gradeCode) || null}
              onChange={(_e, opt) => setField('gradeCode', opt?.code || '')}
              renderInput={(params) => <TextField {...params} label="Grade" />}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Autocomplete
              size="small"
              options={emploiOptions}
              loading={loadingEmplois}
              value={emploiOptions.find((o) => o.id === values.emploiCode) || null}
              onChange={(_e, opt) => setField('emploiCode', opt?.id || '')}
              renderInput={(params) => <TextField {...params} label="Emploi" />}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
              <DatePicker label="Première prise de service" value={values.datePremierePriseService} onChange={(d) => setField('datePremierePriseService', d)} slotProps={{ textField: { fullWidth: true, size: 'small' } }} />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              size="small"
              fullWidth
              label="Indice"
              value={values.indice ? new Intl.NumberFormat('fr-FR').format(parseInt(values.indice, 10)) : ''}
              onChange={(e) => {
                const onlyDigits = (e.target.value || '').replace(/\D+/g, '');
                setField('indice', onlyDigits);
              }}
              error={!!indiceError}
              helperText={indiceError || ''}
              inputProps={{ inputMode: 'numeric' }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
                <Autocomplete
                    size="small"
                    options={structureOptions}
                    loading={loadingStructures}
                    value={structureOptions.find((o) => o.id === values.strId) || null}
                    inputValue={structureInput}
                    onChange={(_e, opt) => {
                        setField('strId', opt?.id ?? null);
                        if (opt?.label) setStructureInput(opt.label);
                    }}
                    onInputChange={(_e, input) => {
                        const val = (input || '');
                        setStructureInput(val);
                        setStructureQuery(val.trim());
                    }}
                    clearOnBlur={false}
                    getOptionLabel={(o) => o?.label || ''}
                    renderInput={(params) => <TextField {...params} label="Structure" />}
                />
          </Grid>
        </Grid>
      </LabeledFrame>

    </Box>
  );

  const updateDocField = (id, field, val) => {
    setValues((prev) => ({
      ...prev,
      documents: prev.documents.map((d) => (d.id === id ? { ...d, [field]: val } : d))
    }));
  };
  const addDocRow = () => setValues((prev) => ({ ...prev, documents: [...prev.documents, emptyDocumentRow()] }));
  const removeDocRow = (id) =>
    setValues((prev) => {
      const list = prev.documents || [];
      if (list.length <= 1) return prev; // cannot remove last row
      return { ...prev, documents: list.filter((d) => d.id !== id) };
    });

  const renderStep2 = () => (
    <Box>
      <LabeledFrame>
        <FrameLabel>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <BusinessIcon sx={{ mr: 1, fontSize: '1rem' }} /> Association
          </Box>
        </FrameLabel>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={8}>
            <Autocomplete
              size="small"
              options={associationOptions}
              value={associationOptions.find((o) => o.id === values.assoId) || null}
              inputValue={assoInput}
              onChange={(_e, opt) => {
                setField('assoId', opt?.id ?? null);
                // Reset approvals when association changes
                setField('accepteCharte', false);
                setField('accepteStatutsReglements', false);
                if (opt?.label) setAssoInput(opt.label);
              }}
              onInputChange={(_e, input) => {
                const val = input || '';
                setAssoInput(val);
                setAssoQuery(val.trim());
              }}
              clearOnBlur={false}
              getOptionLabel={(o) => o?.label || ''}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Rechercher une association"
                  placeholder="Nom, sigle, ..."
                />
              )}
            />
          </Grid>
        </Grid>
      </LabeledFrame>

      <LabeledFrame>
        <FrameLabel>Approbations</FrameLabel>
        <Grid container spacing={1} sx={{ mb: 1 }}>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={<Checkbox checked={values.accepteRgpd} onChange={(e) => setField('accepteRgpd', e.target.checked)} />}
              label="J'accepte le traitement de mes données (RGPD)"
            />
          </Grid>

          {latestCharteDoc && (
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={<Checkbox checked={values.accepteCharte} onChange={(e) => setField('accepteCharte', e.target.checked)} />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>{"J'ai lu et j'accepte la charte d'adhésion"}</span>
                    <Tooltip title="Voir le document">
                      <IconButton size="small" color="primary" aria-label="voir le document" onClick={() => openDocInViewer(latestCharteDoc, "Charte d'adhésion") }>
                        <VisibilityOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                }
              />
            </Grid>
          )}

          {latestStatutsDoc && (
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={<Checkbox checked={values.accepteStatutsReglements} onChange={(e) => setField('accepteStatutsReglements', e.target.checked)} />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>{"j'ai lu et j'accepte les statuts et règlements"}</span>
                    <Tooltip title="Voir le document">
                      <IconButton size="small" color="primary" aria-label="voir le document" onClick={() => openDocInViewer(latestStatutsDoc, 'Statuts et règlements')}>
                        <VisibilityOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                }
              />
            </Grid>
          )}
        </Grid>
      </LabeledFrame>

      <LabeledFrame>
        <FrameLabel>Pièces jointes</FrameLabel>
        <Grid container spacing={2}>
          {(values.documents || []).map((row, idx) => (
            <Grid key={row.id} item xs={12}>
              <Grid container spacing={1} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth size="small" label="Fichier" placeholder="Choisir un fichier"
                    value={row.file?.name || ''} disabled
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Button component="label" variant="contained" size="small">
                            Choisir
                            <input hidden type="file" onChange={(e) => updateDocField(row.id, 'file', e.target.files?.[0] || null)} />
                          </Button>
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <Autocomplete
                    options={docTypeOptions}
                    getOptionLabel={(o) => o?.label || ''}
                    value={(docTypeOptions || []).find((opt) => opt.code === row.docTypeCode) || null}
                    onChange={(_e, v) => updateDocField(row.id, 'docTypeCode', v?.code || '')}
                    loading={loadingDocTypes}
                    renderInput={(params) => <TextField {...params} size="small" label="Type de fichier" />}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth size="small" label="Description"
                    value={row.docDescription || ''}
                    onChange={(e) => updateDocField(row.id, 'docDescription', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={1}>
                  <RoundIconButton
                    color="error"
                    onClick={() => removeDocRow(row.id)}
                    aria-label="remove-row"
                    disabled={(values.documents || []).length <= 1}
                  >
                    <RemoveCircleOutlineIcon />
                  </RoundIconButton>
                </Grid>
              </Grid>
            </Grid>
          ))}
          <Grid item xs={12}>
            <Button startIcon={<AddCircleOutlineIcon />} onClick={addDocRow} size="small">
              Ajouter une pièce
            </Button>
          </Grid>
        </Grid>
      </LabeledFrame>
    </Box>
  );

  return (
    <>
      <Modal
        open={!!open}
        title={'Inscription utilisateur'}
        width={'md'}
        handleClose={handleClose}
        actionVisible={false}
        actions={
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <Box>
              {activeStep > 0 && (
                <Button variant="outlined" startIcon={<NavigateBeforeIcon />} onClick={handleBack}>
                  Précédent
                </Button>
              )}
            </Box>
            <Box>
              {activeStep < steps.length - 1 ? (
                <Button
                  variant="contained"
                  endIcon={<NavigateNextIcon />}
                  onClick={handleNext}
                  disabled={!canContinueStep1}
                  color="secondary"
                >
                  Suivant
                </Button>
              ) : (
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSubmit}
                  disabled={!canSubmit || createWithDemande.isLoading}
                  color="secondary"
                >
                  {createWithDemande.isLoading ? 'Envoi…' : 'Terminer'}
                </Button>
              )}
            </Box>
          </Box>
        }
      >
        <Box>
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 2 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box>
            {activeStep === 0 ? renderStep1() : renderStep2()}
          </Box>

        </Box>
      </Modal>

      <IFrameModal
        opened={viewerOpen}
        title={viewerTitle}
        base64String={viewerBase64}
        mimeType={viewerMime}
        handleClose={() => { setViewerOpen(false); setViewerBase64(''); }}
      />

      <FloatingAlert open={alert.open} message={alert.message} severity={alert.severity} onClose={onCloseAlert} />
    </>
  );
};

RegisterUserWizard.propTypes = {
  open: PropTypes.bool,
  handleClose: PropTypes.func,
  docParentCode: PropTypes.string,
  defaultObjectTableName: PropTypes.string,
  onRegistered: PropTypes.func
};

export default RegisterUserWizard;
