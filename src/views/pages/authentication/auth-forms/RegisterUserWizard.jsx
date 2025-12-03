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
  Divider,
  styled,
  InputAdornment,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { fr } from 'date-fns/locale';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';

// project imports
import Modal from 'src/sigma/components/commons/Modal';
import FloatingAlert from 'src/sigma/components/commons/FloatingAlert';
import { useVisibleStructures } from 'src/sigma/hooks/query/useStructures';
import { useTypesByGroupCode, useDirectSousTypes } from 'src/sigma/hooks/query/useTypes';
import { useSearchAssociations } from 'src/sigma/hooks/query/useAssociations';
import { useCreateUser } from 'src/sigma/hooks/query/useUsers';

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

const RegisterUserWizard = ({ open, handleClose, docParentCode = 'DOC_USER', defaultObjectTableName = 'users', onRegistered }) => {
  // Stepper
  const steps = ['Infos personnelles & professionnelles', 'Association & pièces jointes'];
  const [activeStep, setActiveStep] = useState(0);

  // Alerts
  const [alert, setAlert] = useState({ open: false, severity: 'success', message: '' });

  // Data sources
  const { data: structures = [], isLoading: loadingStructures } = useVisibleStructures();
  const { data: grades = [], isLoading: loadingGrades } = useTypesByGroupCode('GRADE');
  const { data: emplois = [], isLoading: loadingEmplois } = useTypesByGroupCode('EMPLOI');
  const { data: docTypes = [], isLoading: loadingDocTypes } = useDirectSousTypes({ parentCode: docParentCode });

  // Associations search (with a light client filter)
  const [assoQuery, setAssoQuery] = useState('');
  const { data: associationsPage } = useSearchAssociations({ q: assoQuery, size: 20, page: 0 });
  const associations = useMemo(() => (associationsPage?.content ?? associationsPage ?? []), [associationsPage]);

  // Form state mapped to UserDTO
  const [values, setValues] = useState({
    email: '',
    matricule: '',
    gradeCode: '',
    firstName: '',
    lastName: '',
    tel: '',
    strId: null,
    adresse: '',
    lieuNaissance: '',
    dateNaissance: null,
    emploiCode: '',
    emploiName: '',
    datePremierePriseService: null,
    assoId: null,
    documents: [emptyDocumentRow()]
  });

  const createUser = useCreateUser();

  const setField = (name, value) => setValues((prev) => ({ ...prev, [name]: value }));

  const requiredErrors = useMemo(() => {
    const e = {};
    if (!values.firstName) e.firstName = 'Prénom requis';
    if (!values.lastName) e.lastName = 'Nom requis';
    if (!values.tel) e.tel = 'Téléphone requis';
    return e;
  }, [values.firstName, values.lastName, values.tel]);

  const canContinueStep1 = useMemo(() => Object.keys(requiredErrors).length === 0, [requiredErrors]);

  const handleNext = () => setActiveStep((s) => Math.min(s + 1, steps.length - 1));
  const handleBack = () => setActiveStep((s) => Math.max(s - 1, 0));

  const reset = () => {
    setValues((prev) => ({
      ...prev,
      email: '', matricule: '', gradeCode: '', firstName: '', lastName: '', tel: '', strId: null, adresse: '', lieuNaissance: '', dateNaissance: null,
      emploiCode: '', emploiName: '', datePremierePriseService: null, assoId: null, documents: [emptyDocumentRow()]
    }));
    setActiveStep(0);
  };

  const showAlert = (message, severity = 'success') => setAlert({ open: true, severity, message });

  const onCloseAlert = () => setAlert((a) => ({ ...a, open: false }));

  const handleSubmit = async () => {
    // Build payload matching UserDTO
    const payload = {
      email: values.email || undefined,
      matricule: values.matricule || undefined,
      gradeCode: values.gradeCode || undefined,
      firstName: values.firstName,
      lastName: values.lastName,
      tel: values.tel,
      strId: values.strId || undefined,
      adresse: values.adresse || undefined,
      lieuNaissance: values.lieuNaissance || undefined,
      dateNaissance: values.dateNaissance ? new Date(values.dateNaissance) : undefined,
      emploiCode: values.emploiCode || undefined,
      emploiName: values.emploiName || undefined,
      datePremierePriseService: values.datePremierePriseService ? new Date(values.datePremierePriseService) : undefined,
      assoId: values.assoId || undefined,
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
      await createUser.mutateAsync(payload);
      showAlert("Utilisateur créé avec succès", 'success');
      if (typeof onRegistered === 'function') onRegistered();
      reset();
      handleClose?.();
    } catch (e) {
      const apiMsgs = e?.response?.data;
      let msg = '';
      if (Array.isArray(apiMsgs)) msg = apiMsgs.filter(Boolean).join('\n');
      else if (typeof apiMsgs === 'string') msg = apiMsgs;
      else msg = e?.message;
      showAlert(msg || "Échec de l'inscription", 'error');
    }
  };

  const gradeOptions = useMemo(() => (grades || []).map((g) => ({ code: g?.code, label: g?.name })), [grades]);
  const emploiOptions = useMemo(() => (emplois || []).map(toOption), [emplois]);
  const structureOptions = useMemo(() => (structures || []).map((s) => ({ id: s?.strId, label: s?.strName || s?.strSigle })), [structures]);
  const associationOptions = useMemo(() => (associations || []).map((a) => ({ id: a.id, label: a.name || a.sigle || a.assoName || a.libelle })), [associations]);
  const docTypeOptions = useMemo(() => (docTypes || []).map((t) => ({ code: t.code || t.value || t.key, label: t.libelle || t.label || t.name || t.code })), [docTypes]);

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
          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
              <DatePicker label="Date de naissance" value={values.dateNaissance} onChange={(d) => setField('dateNaissance', d)} slotProps={{ textField: { fullWidth: true, size: 'small' } }} />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6}>
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
          <Grid item xs={12} sm={4}>
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
          <Grid item xs={12} sm={4}>
            <Autocomplete
              size="small"
              options={emploiOptions}
              loading={loadingEmplois}
              value={emploiOptions.find((o) => o.id === values.emploiCode) || null}
              onChange={(_e, opt) => setField('emploiCode', opt?.id || '')}
              renderInput={(params) => <TextField {...params} label="Emploi" />}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Autocomplete
              size="small"
              options={structureOptions}
              loading={loadingStructures}
              value={structureOptions.find((o) => o.id === values.strId) || null}
              onChange={(_e, opt) => setField('strId', opt?.id ?? null)}
              renderInput={(params) => <TextField {...params} label="Structure" />}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
              <DatePicker label="Date de 1ère prise de service" value={values.datePremierePriseService} onChange={(d) => setField('datePremierePriseService', d)} slotProps={{ textField: { fullWidth: true, size: 'small' } }} />
            </LocalizationProvider>
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
  const removeDocRow = (id) => setValues((prev) => ({ ...prev, documents: prev.documents.filter((d) => d.id !== id) }));

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
              onChange={(_e, opt) => setField('assoId', opt?.id ?? null)}
              onInputChange={(_e, input) => setAssoQuery(input || '')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Rechercher une association"
                  placeholder="Nom, sigle, ..."
                  InputProps={{ ...params.InputProps, endAdornment: (<>{params.InputProps.endAdornment}</>) }}
                />
              )}
            />
          </Grid>
        </Grid>
      </LabeledFrame>

      <LabeledFrame>
        <FrameLabel>Pièces jointes</FrameLabel>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell style={{ width: 260 }}>Type</TableCell>
              <TableCell>Numéro</TableCell>
              <TableCell>Nom</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Fichier</TableCell>
              <TableCell align="center" style={{ width: 64 }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(values.documents || []).map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Autocomplete
                    size="small"
                    options={docTypeOptions}
                    loading={loadingDocTypes}
                    value={docTypeOptions.find((o) => o.code === row.docTypeCode) || null}
                    onChange={(_e, opt) => updateDocField(row.id, 'docTypeCode', opt?.code || '')}
                    renderInput={(params) => <TextField {...params} label="Type de document" />}
                  />
                </TableCell>
                <TableCell>
                  <TextField size="small" value={row.docNum} onChange={(e) => updateDocField(row.id, 'docNum', e.target.value)} />
                </TableCell>
                <TableCell>
                  <TextField size="small" value={row.docName} onChange={(e) => updateDocField(row.id, 'docName', e.target.value)} />
                </TableCell>
                <TableCell>
                  <TextField size="small" value={row.docDescription} onChange={(e) => updateDocField(row.id, 'docDescription', e.target.value)} />
                </TableCell>
                <TableCell>
                  <Button variant="outlined" size="small" component="label">
                    Choisir un fichier
                    <input hidden type="file" onChange={(e) => updateDocField(row.id, 'file', e.target.files?.[0] || null)} />
                  </Button>
                  {row.file && (
                    <Typography variant="caption" sx={{ ml: 1 }}>
                      {row.file.name}
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="center">
                  <RoundIconButton color="error" onClick={() => removeDocRow(row.id)}>
                    <RemoveCircleOutlineIcon />
                  </RoundIconButton>
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={6}>
                <Button startIcon={<AddCircleOutlineIcon />} onClick={addDocRow} size="small">
                  Ajouter une pièce
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </LabeledFrame>
    </Box>
  );

  return (
    <>
      <Modal
        open={!!open}
        title={'Inscription utilisateur'}
        maxWidth="md"
        handleClose={handleClose}
        handleConfirmation={activeStep === steps.length - 1 ? handleSubmit : handleNext}
        actionLabel={activeStep === steps.length - 1 ? (createUser.isLoading ? 'Enregistrement…' : "Terminer") : 'Suivant'}
        secondaryActionLabel={activeStep > 0 ? 'Précédent' : undefined}
        handleSecondaryAction={activeStep > 0 ? handleBack : undefined}
        disableConfirm={activeStep === 0 && !canContinueStep1}
      >
        <Box>
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 2 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Paper variant="outlined" sx={{ p: 2 }}>
            {activeStep === 0 ? renderStep1() : renderStep2()}
          </Paper>
        </Box>
      </Modal>

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
