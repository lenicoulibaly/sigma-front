import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useCreateAssociation } from '../../../hooks/query/useAssociations';

// material-ui
import {
    Grid,
    TextField,
    InputAdornment,
    Button,
    Box,
    Avatar,
    Typography,
    Autocomplete,
    Chip,
    Stepper,
    Step,
    StepLabel,
    Paper,
    Divider,
    styled,
    Tooltip,
    Select,
    MenuItem,
    IconButton,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell
} from '@mui/material';

// project imports
import Modal from '../../../components/commons/Modal';
import FloatingAlert from '../../../components/commons/FloatingAlert';
import { gridSpacing } from 'store/constant';
import { useVisibleStructures } from '../../../hooks/query/useStructures';
import { useDirectSousTypes, useTypesByGroupCode } from '../../../hooks/query/useTypes';

// assets
import { IconCoin } from '@tabler/icons-react';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { AddCircle, AddCircleOutline, AddCircleOutlined, RemoveCircle, RemoveCircleOutline } from '@mui/icons-material';
import { EditOutlined, DeleteOutline } from '@mui/icons-material';

// Custom styled components for frames with labels
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

// Round icon button for + / - actions
const RoundIconButton = styled(IconButton)(({ theme }) => ({
    width: 36,
    height: 36,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
}));

// ==============================|| 3-STEP ASSOCIATION MODAL ||============================== //

const AssociationModal = ({ open, handleClose, isEdit }) => {
    // Parent state matching CreateAssociationDTO + wizard-only fields
    const [state, setState] = useState({
        // Step 1
        assoName: '',
        situationGeo: '',
        sigle: '',
        droitAdhesion: '',
        logo: null,
        email: '',
        tel: '',
        adresse: '',
        structures: [], // full objects for UI
        strIds: [], // extracted on submit
        piecesJointes: [{ id: 1, file: null, type: '', description: '' }], // Step1 attachments rows
        // Step 2
        createSectionDTOS: [],
        editingSectionId: null, // current section being edited (id) or null
        // Step 3
        piecesAFournir: [{ id: Date.now(), type: '', statut: '', description: '' }],
        conditionsAdhesion: ''
    });

    const emptySection = { id: Date.now(), name: '', sigle: '', structure: null, adresse: '', situationGeo: '', tel: '', email: '' };
    const emptyPieceAFournir = { id: Date.now(), type: '', statut: '', description: '' };

    // Validation state per step
    const [errors, setErrors] = useState({});

    // Wizard state
    const [activeStep, setActiveStep] = useState(0);
    const steps = ['Informations', 'Sections', 'Adhésion'];

    // Alerts
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertSeverity, setAlertSeverity] = useState('success');
    const [submitting, setSubmitting] = useState(false);

    // Fetch structures
    const { data: structures, isLoading: loadingStructures } = useVisibleStructures();

    // Fetch types de pièces jointes (sous-types directs du groupe DOC_ASSO)
    const { data: pjTypes, isLoading: loadingPjTypes } = useDirectSousTypes({ parentCode: 'DOC_ASSO' });

    const { data: pfTypes, isLoading: loadingpfTypes } = useTypesByGroupCode('DOC');


    // React Query mutation
    const { mutateAsync: createAssociation } = useCreateAssociation();

    // Reset modal on open/close
    useEffect(() => {
        if (open && !isEdit) {
            setActiveStep(0);
            setErrors({});
        }
    }, [open, isEdit]);

    // Helpers
    const handleField = (name, value) => {
        setState((s) => ({ ...s, [name]: value }));
        setErrors((e) => ({ ...e, [name]: undefined }));
    };

    // Piece jointe helpers
    const handlePieceChange = (id, field, value) => {
        setState((s) => ({
            ...s,
            piecesJointes: s.piecesJointes.map((row) => (row.id === id ? { ...row, [field]: value } : row))
        }));
    };
    const addPieceRow = () => {
        setState((s) => ({
            ...s,
            piecesJointes: [...s.piecesJointes, { id: Date.now(), file: null, type: '', description: '' }]
        }));
    };
    const removePieceRow = (id) => {
        setState((s) => {
            if (s.piecesJointes.length <= 1) return s; // cannot remove last row
            return { ...s, piecesJointes: s.piecesJointes.filter((r) => r.id !== id) };
        });
    };

    const fileTypes = useMemo(() => [
        { value: 'STATUTS', label: 'Statuts' },
        { value: 'PV', label: 'Procès-verbal' },
        { value: 'RECEPISSE', label: 'Récépissé' },
        { value: 'AUTRE', label: 'Autre' }
    ], []);

    const pieceStatusOptions = useMemo(() => [
        { value: 'OBLIGATOIRE', label: 'Obligatoire' },
        { value: 'FACULTATIVE', label: 'Facultative' }
    ], []);

    const handleStructuresChange = (evt, value) => {
        handleField('structures', value || []);
        handleField('strIds', (value || []).map((v) => v.strId));
    };

    // Step 3: Pièces à fournir helpers (mirror Step 1 pattern)
    const handlePieceFournirChange = (id, field, value) => {
        setState((s) => ({
            ...s,
            piecesAFournir: s.piecesAFournir.map((row) => (row.id === id ? { ...row, [field]: value } : row))
        }));
    };
    const addPieceFournirRow = () => {
        setState((s) => ({
            ...s,
            piecesAFournir: [...s.piecesAFournir, { id: Date.now(), type: '', statut: '', description: '' }]
        }));
    };
    const removePieceFournirRow = (id) => {
        setState((s) => {
            if (s.piecesAFournir.length <= 1) return s; // cannot remove last row
            return { ...s, piecesAFournir: s.piecesAFournir.filter((r) => r.id !== id) };
        });
    };

    // Step validations
    const validateStep = (stepIndex) => {
        const e = {};
        if (stepIndex === 0) {
            if (!state.assoName || !state.assoName.trim()) e.assoName = "Le nom de l'association est obligatoire";
            if (state.droitAdhesion !== '' && !/^[0-9]+(\.[0-9]+)?$/.test(String(state.droitAdhesion))) e.droitAdhesion = "Montant invalide";
        } else if (stepIndex === 1) {
            // Sections are optional during creation, but validate entries if present
            const invalid = state.createSectionDTOS.some((sec) => !sec.name || !sec.sigle || !sec.structure);
            if (invalid) e.createSectionDTOS = 'Complétez les champs requis des sections';
        } else if (stepIndex === 2) {
            // Pièces à fournir: if a row is partially filled, require Type and Statut
            const invalidPieces = state.piecesAFournir.some((p) => {
                const any = (p.type && String(p.type).trim()) || (p.statut && String(p.statut).trim()) || (p.description && String(p.description).trim());
                if (!any) return false; // empty row is fine
                return !p.type || !p.statut; // require both when row used
            });
            if (invalidPieces) e.piecesAFournir = 'Chaque ligne renseignée doit avoir un Type et un Statut';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const next = () => {
        if (validateStep(activeStep)) setActiveStep((s) => Math.min(s + 1, steps.length - 1));
    };
    const back = () => setActiveStep((s) => Math.max(s - 1, 0));

    // Submit
    const handleSubmit = async () => {

        if (!validateStep(2))
        {
            alert("Erreurrrrrrrrrrrrrr");
            return;
        }
        setSubmitting(true);
        try {
            const payload = {
                assoName: state.assoName,
                situationGeo: state.situationGeo,
                sigle: state.sigle,
                droitAdhesion: state.droitAdhesion === '' ? null : Number(state.droitAdhesion),
                logo: state.logo,
                email: state.email,
                tel: state.tel,
                adresse: state.adresse,
                strIds: state.strIds,
                createSectionDTOS: state.createSectionDTOS,
                piecesJointes: state.piecesJointes,
                piecesAFournir: state.piecesAFournir,
                conditionsAdhesion: state.conditionsAdhesion
            };

            // Call backend API via hook (multipart/form-data)
            alert("En cours...");
            await createAssociation(payload);

            setAlertMessage('Association créée avec succès');
            setAlertSeverity('success');
            setAlertOpen(true);
            setTimeout(() => {
                setSubmitting(false);
                handleClose();
            }, 500);
        } catch (err) {
            const msg = err?.response?.data?.message || "Une erreur est survenue lors de la création de l'association";
            setAlertMessage(msg);
            setAlertSeverity('error');
            setAlertOpen(true);
            setSubmitting(false);
        }
    };

    // Step 1 UI
    const renderStep1 = () => (
        <>
            <LabeledFrame>
                <FrameLabel>Informations générale</FrameLabel>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth size="small" required
                            label="Nom de l'association" value={state.assoName}
                            onChange={(e) => handleField('assoName', e.target.value)}
                            error={Boolean(errors.assoName)} helperText={errors.assoName}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField fullWidth size="small" label="Sigle" value={state.sigle}
                                   onChange={(e) => handleField('sigle', e.target.value)} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField fullWidth size="small" label="Situation géographique" value={state.situationGeo}
                                   onChange={(e) => handleField('situationGeo', e.target.value)} placeholder="Abidjan/Plateau" />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth size="small" label="Droit d'adhésion (F CFA)"
                            value={state.droitAdhesion}
                            onChange={(e) => handleField('droitAdhesion', e.target.value.replace(/[^0-9.]/g, ''))}
                            error={Boolean(errors.droitAdhesion)} helperText={errors.droitAdhesion}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <IconCoin size="1rem" />
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth size="small" label="Logo" placeholder="Attacher le logo" value={state.logo?.name || ''} disabled
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <Button component="label" variant="contained" size="small">
                                            Choisir
                                            <input hidden type="file" accept="image/*" onChange={(e) => handleField('logo', e.target.files?.[0] || null)} />
                                        </Button>
                                    </InputAdornment>
                                ),
                                startAdornment: state.logo ? (
                                    <InputAdornment position="start">
                                        <Avatar src={URL.createObjectURL(state.logo)} sx={{ width: 24, height: 24 }} />
                                    </InputAdornment>
                                ) : undefined
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Autocomplete multiple options={structures || []}
                                      getOptionLabel={(o) => o?.strName || ''}
                                      loading={loadingStructures}
                                      value={state.structures}
                                      onChange={handleStructuresChange}
                                      renderInput={(params) => <TextField {...params} size="small" label="Structures" />} 
                                      renderTags={(value, getTagProps) => value.map((opt, i) => (
                                          <Chip {...getTagProps({ index: i })} key={opt.strId} label={opt.strName} size="small" />
                                      ))}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField fullWidth size="small" label="Téléphone" value={state.tel}
                                   onChange={(e) => handleField('tel', e.target.value)} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField fullWidth size="small" label="Email" value={state.email}
                                   onChange={(e) => handleField('email', e.target.value)} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField fullWidth size="small" label="Adresse" value={state.adresse}
                                   onChange={(e) => handleField('adresse', e.target.value)} />
                    </Grid>
                </Grid>
            </LabeledFrame>

            <LabeledFrame>
                <FrameLabel>Pièces jointes</FrameLabel>
                <Grid container spacing={2}>
                    {state.piecesJointes.map((row, idx) => (
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
                                                        <input hidden type="file" onChange={(e) => handlePieceChange(row.id, 'file', e.target.files?.[0] || null)} />
                                                    </Button>
                                                </InputAdornment>
                                            )
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <Autocomplete
                                        options={pjTypes || []}
                                        getOptionLabel={(o) => o?.name || ''}
                                        value={(pjTypes || []).find((opt) => opt.code === row.type) || null}
                                        onChange={(e, v) => handlePieceChange(row.id, 'type', v?.code || '')}
                                        loading={loadingPjTypes}
                                        renderInput={(params) => <TextField {...params} size="small" label="Type de fichier" />}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField fullWidth size="small" label="Description"
                                               value={row.description || ''}
                                               onChange={(e) => handlePieceChange(row.id, 'description', e.target.value)} />
                                </Grid>
                                <Grid item xs={12} md={1}>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Tooltip title="Ajouter une ligne">
                                            <RoundIconButton color="primary" onClick={addPieceRow} aria-label="add-row">
                                                <AddCircleOutline />
                                            </RoundIconButton>
                                        </Tooltip>
                                        {idx > 0 && (
                                            <Tooltip title="Supprimer cette ligne">
                                                <span>
                                                    <RoundIconButton color="error" onClick={() => removePieceRow(row.id)} aria-label="remove-row">
                                                        <RemoveCircleOutline />
                                                    </RoundIconButton>
                                                </span>
                                            </Tooltip>
                                        )}
                                    </Box>
                                </Grid>
                            </Grid>
                        </Grid>
                    ))}
                    {errors.piecesJointes && (
                        <Grid item xs={12}>
                            <Typography color="error" variant="caption">{errors.piecesJointes}</Typography>
                        </Grid>
                    )}
                </Grid>
            </LabeledFrame>
        </>
    );

    // Step 2 UI
    const renderStep2 = () => (
        <>
            <LabeledFrame>
                <FrameLabel>Sections</FrameLabel>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                        <TextField fullWidth size="small" label="Nom"
                                   value={state._secName || ''} onChange={(e) => handleField('_secName', e.target.value)} />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField fullWidth size="small" label="Sigle"
                                   value={state._secSigle || ''} onChange={(e) => handleField('_secSigle', e.target.value)} />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Autocomplete options={structures || []} getOptionLabel={(o) => o?.strName || ''}
                                      loading={loadingStructures}
                                      value={state._secStructure || null}
                                      onChange={(e, v) => handleField('_secStructure', v)}
                                      renderInput={(p) => <TextField {...p} size="small" label="Structure" />} />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField fullWidth size="small" label="Adresse" value={state._secAdresse || ''}
                                   onChange={(e) => handleField('_secAdresse', e.target.value)} />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField fullWidth size="small" label="Situation géographique" value={state._secSituation || ''}
                                   onChange={(e) => handleField('_secSituation', e.target.value)} />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField fullWidth size="small" label="Téléphone" value={state._secTel || ''}
                                   onChange={(e) => handleField('_secTel', e.target.value)} />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField fullWidth size="small" label="Email" value={state._secEmail || ''}
                                   onChange={(e) => handleField('_secEmail', e.target.value)} />
                    </Grid>
                    <Grid item xs={12} md={3} sx={{ display: 'flex', alignItems: 'stretch', gap: 1 }}>
                        <Button fullWidth variant="contained" onClick={() => {
                            // Validation Step2: ensure required fields before adding/updating a section
                            const missingRequired = !state._secName || !state._secSigle || !state._secStructure;
                            if (missingRequired) {
                                setErrors((prev) => ({
                                    ...prev,
                                    createSectionDTOS: 'Veuillez renseigner au minimum Nom, Sigle et Structure'
                                }));
                                return;
                            }

                            // Clear step2 error if previously set
                            setErrors((prev) => {
                                const { createSectionDTOS, ...rest } = prev;
                                return rest;
                            });

                            if (state.editingSectionId) {
                                // Update existing section
                                setState((s) => ({
                                    ...s,
                                    createSectionDTOS: s.createSectionDTOS.map((sec) =>
                                        sec.id === s.editingSectionId
                                            ? { ...sec, name: s._secName, sigle: s._secSigle, structure: s._secStructure, adresse: s._secAdresse || '', situationGeo: s._secSituation || '', tel: s._secTel || '', email: s._secEmail || '' }
                                            : sec
                                    ),
                                    // reset inline form fields
                                    _secName: '', _secSigle: '', _secStructure: null, _secAdresse: '', _secSituation: '', _secTel: '', _secEmail: '',
                                    editingSectionId: null
                                }));
                            } else {
                                // Add new section
                                const newSec = { id: Date.now(), name: state._secName || '', sigle: state._secSigle || '', structure: state._secStructure || null, adresse: state._secAdresse || '', situationGeo: state._secSituation || '', tel: state._secTel || '', email: state._secEmail || '' };
                                setState((s) => ({ ...s, createSectionDTOS: [...s.createSectionDTOS, newSec], _secName: '', _secSigle: '', _secStructure: null, _secAdresse: '', _secSituation: '', _secTel: '', _secEmail: '' }));
                            }
                        }}>{state.editingSectionId ? 'Mettre à jour' : 'Ajouter'}</Button>
                        {state.editingSectionId && (
                            <Button color="inherit" variant="outlined" onClick={() => setState((s) => ({...s, editingSectionId: null, _secName: '', _secSigle: '', _secStructure: null, _secAdresse: '', _secSituation: '', _secTel: '', _secEmail: ''}))}>Annuler</Button>
                        )}
                    </Grid>
                </Grid>
                {errors.createSectionDTOS && <Typography color="error" variant="caption">{errors.createSectionDTOS}</Typography>}
            </LabeledFrame>

            <LabeledFrame>
                <FrameLabel>Liste des sections</FrameLabel>
                {state.createSectionDTOS.length === 0 ? (
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="body2" color="textSecondary">Aucune section ajoutée</Typography>
                    </Paper>
                ) : (
                    <Paper variant="outlined" sx={{ width: '100%', overflowX: 'auto' }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell align="center" width={60}>N°</TableCell>
                                    <TableCell>Nom</TableCell>
                                    <TableCell>Structure</TableCell>
                                    <TableCell>Situation géo</TableCell>
                                    <TableCell>Téléphone</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell align="center" width={120}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {state.createSectionDTOS.map((s, idx) => (
                                    <TableRow key={s.id} selected={state.editingSectionId === s.id}>
                                        <TableCell align="center">{idx + 1}</TableCell>
                                        <TableCell>{s.name}</TableCell>
                                        <TableCell>{s.structure?.strName || ''}</TableCell>
                                        <TableCell>{s.situationGeo || ''}</TableCell>
                                        <TableCell>{s.tel || ''}</TableCell>
                                        <TableCell>{s.email || ''}</TableCell>
                                        <TableCell align="center">
                                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                                                <Tooltip title="Modifier">
                                                    <span>
                                                        <IconButton size="small" color="primary" onClick={() => setState((st) => ({
                                                            ...st,
                                                            editingSectionId: s.id,
                                                            _secName: s.name || '',
                                                            _secSigle: s.sigle || '',
                                                            _secStructure: s.structure || null,
                                                            _secAdresse: s.adresse || '',
                                                            _secSituation: s.situationGeo || '',
                                                            _secTel: s.tel || '',
                                                            _secEmail: s.email || ''
                                                        }))}>
                                                            <EditOutlined fontSize="small" />
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                                <Tooltip title="Supprimer">
                                                    <span>
                                                        <IconButton size="small" color="error" onClick={() => setState((st) => ({ ...st, createSectionDTOS: st.createSectionDTOS.filter((x) => x.id !== s.id), ...(st.editingSectionId === s.id ? { editingSectionId: null, _secName: '', _secSigle: '', _secStructure: null, _secAdresse: '', _secSituation: '', _secTel: '', _secEmail: '' } : {}) }))}>
                                                            <DeleteOutline fontSize="small" />
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Paper>
                )}
            </LabeledFrame>
        </>
    );

    // Step 3 UI
    const renderStep3 = () => (
        <>
            <LabeledFrame>
                <FrameLabel>Conditions d'adhésion</FrameLabel>
                <Box sx={{ '& .ql-container': { minHeight: 140 }, '& .ql-toolbar': { borderTopLeftRadius: 1, borderTopRightRadius: 1 } }}>
                    <ReactQuill
                        theme="snow"
                        value={state.conditionsAdhesion}
                        onChange={(html) => handleField('conditionsAdhesion', html)}
                        placeholder="Saisir les conditions d'adhésion"
                        modules={{
                            toolbar: [
                                [{ header: [false, 3, 4] }],
                                ['bold', 'italic', 'underline'],
                                [{ list: 'ordered' }, { list: 'bullet' }],
                                ['clean']
                            ]
                        }}
                        formats={[
                            'header',
                            'bold', 'italic', 'underline',
                            'list', 'bullet'
                        ]}
                    />
                </Box>
            </LabeledFrame>

            <LabeledFrame>
                <FrameLabel>Pièces à fournir</FrameLabel>
                <Grid container spacing={2}>
                    {state.piecesAFournir.map((row, idx) => (
                        <Grid key={row.id} item xs={12}>
                            <Grid container spacing={1} alignItems="center">
                                <Grid item xs={12} md={3}>
                                    <Autocomplete
                                        options={pfTypes}
                                        getOptionLabel={(o) => o?.name || ''}
                                        value={pfTypes.find((opt) => opt.code === row.type) || null}
                                        onChange={(e, v) => handlePieceFournirChange(row.id, 'type', v?.code || '')}
                                        renderInput={(params) => <TextField {...params} size="small" label="Type de pièce" />}
                                    />
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <Autocomplete
                                        options={pieceStatusOptions}
                                        getOptionLabel={(o) => o?.label || ''}
                                        value={pieceStatusOptions.find((opt) => opt.value === row.statut) || null}
                                        onChange={(e, v) => handlePieceFournirChange(row.id, 'statut', v?.value || '')}
                                        renderInput={(params) => <TextField {...params} size="small" label="Statut" />}
                                    />
                                </Grid>
                                <Grid item xs={12} md={5}>
                                    <TextField fullWidth size="small" label="Description"
                                               value={row.description || ''}
                                               onChange={(e) => handlePieceFournirChange(row.id, 'description', e.target.value)} />
                                </Grid>
                                <Grid item xs={12} md={1}>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Tooltip title="Ajouter une ligne">
                                            <RoundIconButton color="primary" onClick={addPieceFournirRow} aria-label="add-row-pf">
                                                <AddCircleOutline />
                                            </RoundIconButton>
                                        </Tooltip>
                                        {idx > 0 && (
                                            <Tooltip title="Supprimer cette ligne">
                                                <span>
                                                    <RoundIconButton color="error" onClick={() => removePieceFournirRow(row.id)} aria-label="remove-row-pf">
                                                        <RemoveCircleOutline />
                                                    </RoundIconButton>
                                                </span>
                                            </Tooltip>
                                        )}
                                    </Box>
                                </Grid>
                            </Grid>
                        </Grid>
                    ))}
                    {errors.piecesAFournir && (
                        <Grid item xs={12}>
                            <Typography color="error" variant="caption">{errors.piecesAFournir}</Typography>
                        </Grid>
                    )}
                </Grid>
            </LabeledFrame>
        </>
    );

    return (
        <>
            <Modal
                open={open}
                title={isEdit ? 'Modifier une association' : "Ajout d'une nouvelle association"}
                handleClose={handleClose}
                actionVisible={false}
                width="lg"
            >
                <Grid container spacing={gridSpacing}>
                    <Grid item xs={12}>
                        <Stepper activeStep={activeStep} alternativeLabel>
                            {steps.map((label) => (
                                <Step key={label}>
                                    <StepLabel>{label}</StepLabel>
                                </Step>
                            ))}
                        </Stepper>
                    </Grid>

                    <Grid item xs={12}>
                        {activeStep === 0 && renderStep1()}
                        {activeStep === 1 && renderStep2()}
                        {activeStep === 2 && renderStep3()}
                    </Grid>

                    <Grid item xs={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Button variant="outlined" color="error" onClick={handleClose}>Annuler</Button>
                            <Box>
                                <Button sx={{ mr: 1 }} variant="contained" color="inherit" disabled={activeStep === 0} onClick={back}>Précédent</Button>
                                {activeStep < steps.length - 1 ? (
                                    <Button variant="contained" onClick={next}>Suivant</Button>
                                ) : (
                                    <Button variant="contained" color="primary" disabled={submitting} onClick={handleSubmit}>Enregistrer</Button>
                                )}
                            </Box>
                        </Box>
                    </Grid>
                </Grid>
            </Modal>

            <FloatingAlert
                open={alertOpen}
                feedBackMessages={alertMessage}
                severity={alertSeverity}
                timeout={alertSeverity === 'error' ? 7 : 3}
                onClose={() => setAlertOpen(false)}
            />
        </>
    );
};

AssociationModal.propTypes = {
    open: PropTypes.bool.isRequired,
    handleClose: PropTypes.func.isRequired,
    isEdit: PropTypes.bool
};

AssociationModal.defaultProps = {
    isEdit: false
};

export default AssociationModal;
