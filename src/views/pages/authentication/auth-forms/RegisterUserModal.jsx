import React, { useState } from 'react';
import PropTypes from 'prop-types';

// material-ui
import {
    Box,
    Button,
    Divider,
    FormControl,
    FormHelperText,
    Grid,
    InputLabel,
    OutlinedInput,
    Stack,
    TextField,
    Typography,
    Autocomplete,
    IconButton,
    styled
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { fr } from 'date-fns/locale';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';

// project imports
import AnimateButton from 'ui-component/extended/AnimateButton';
import Modal from 'src/sigma/components/commons/Modal';
import FloatingAlert from 'src/sigma/components/commons/FloatingAlert';
import { useVisibleStructures } from 'src/sigma/hooks/query/useStructures';
import { useTypesByGroupCode } from 'src/sigma/hooks/query/useTypes';
import { useCreateUser } from 'src/sigma/hooks/query/useUsers';

// yup
import * as Yup from 'yup';
import { Formik } from 'formik';

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

// ==============================|| REGISTER USER MODAL ||============================== //

// Custom style for slightly rounded borders and better vertical alignment
const inputStyle = {
    '& .MuiOutlinedInput-root': {
        borderRadius: '2px !important', // Slightly rounded borders with !important
    },
    '& .MuiInputLabel-root': {
        transform: 'translate(14px, 9px) scale(1)', // Better vertical alignment for label
    },
    '& .MuiInputLabel-shrink': {
        transform: 'translate(14px, -6px) scale(0.75)', // Adjust shrunk label position
    }
};

const RegisterUserModal = ({ open, handleClose }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertSeverity, setAlertSeverity] = useState('success');

    // Fetch data for dropdowns
    const { data: structures, isLoading: isLoadingStructures } = useVisibleStructures();
    const { data: grades, isLoading: isLoadingGrades } = useTypesByGroupCode('GRADE');
    const { data: emplois, isLoading: isLoadingEmplois } = useTypesByGroupCode('EMPLOI');

    // Mutation for creating a user
    const createUserMutation = useCreateUser();

    // Initial form values
    const initialValues = {
        // Personal information
        firstName: '',
        lastName: '',
        dateNaissance: null,
        lieuNaissance: '',
        tel: '',
        email: '',
        adresse: '',

        // Professional information
        matricule: '',
        emploiCode: '',
        gradeCode: '',
        strId: null,
        datePremierePriseService: null,

        // Hidden fields
        password: 'password123', // Default password that will be changed on first login
        rePassword: 'password123',
        submit: null
    };

    // Validation schema
    const validationSchema = Yup.object().shape({
        // Personal information
        firstName: Yup.string().max(255).required('Le prénom est requis'),
        lastName: Yup.string().max(255).required('Le nom est requis'),
        dateNaissance: Yup.date().nullable().required('La date de naissance est requise'),
        lieuNaissance: Yup.string().max(255).required('Le lieu de naissance est requis'),
        tel: Yup.string().max(20).required('Le téléphone est requis'),
        email: Yup.string().email('Format d\'email invalide').max(255).required('L\'email est requis'),
        adresse: Yup.string().max(255).required('L\'adresse est requise'),

        // Professional information
        matricule: Yup.string().max(50).required('Le matricule est requis'),
        emploiCode: Yup.string().required('L\'emploi est requis'),
        gradeCode: Yup.string().required('Le grade est requis'),
        strId: Yup.number().nullable().required('La structure est requise'),
        datePremierePriseService: Yup.date().nullable().required('La date de première prise de service est requise')
    });

    // Handle form submission
    const handleSubmit = async (values, { setErrors, setStatus, setSubmitting }) => {
        setIsSubmitting(true);
        setSubmitError(null);

        try {
            await createUserMutation.mutateAsync(values);
            setStatus({ success: true });
            setSubmitting(false);
            setIsSubmitting(false);
            setAlertOpen(true);
            setAlertMessage('Compte créé avec succès');
            setAlertSeverity('success');
            setTimeout(() => {
                handleClose();
            }, 1500);
        } catch (error) {
            setSubmitError(error.message || 'Une erreur est survenue lors de la création de l\'utilisateur');
            setStatus({ success: false });
            setErrors({ submit: error.message });
            setSubmitting(false);
            setIsSubmitting(false);
            setAlertOpen(true);
            setAlertMessage(error.message || 'Une erreur est survenue lors de la création de l\'utilisateur');
            setAlertSeverity('error');
        }
    };

    const formikRef = React.useRef();

    const handleConfirmation = () => {
        if (formikRef.current) {
            formikRef.current.handleSubmit();
        }
    };

    return (
        <>
            <Modal
                open={open}
                handleClose={handleClose}
                title="Créer un compte"
                maxWidth="md"
                handleConfirmation={handleConfirmation}
                actionDisabled={isSubmitting}
                actionLabel="Créer le compte"
            >
                <Formik
                    initialValues={initialValues}
                    validationSchema={validationSchema}
                    onSubmit={handleSubmit}
                    innerRef={formikRef}
                >
                    {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values, setFieldValue }) => (
                        <form noValidate onSubmit={handleSubmit}>
                            {/* Personal Information Section */}
                            <LabeledFrame>
                                <FrameLabel>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <PersonIcon sx={{ mr: 1, fontSize: '1rem' }} /> 
                                        Informations personnelles
                                    </Box>
                                </FrameLabel>

                                {/* Row 1: Nom, Prénom */}
                                <Grid container spacing={2} mb={2}>
                                    <Grid item xs={12} sm={6}>
                                        <FormControl fullWidth error={Boolean(touched.lastName && errors.lastName)} sx={inputStyle}>
                                            <InputLabel htmlFor="lastName">Nom</InputLabel>
                                            <OutlinedInput
                                                size="small"
                                                id="lastName"
                                                name="lastName"
                                                label="Nom"
                                                value={values.lastName}
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                            />
                                            {touched.lastName && errors.lastName && (
                                                <FormHelperText error>{errors.lastName}</FormHelperText>
                                            )}
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <FormControl fullWidth error={Boolean(touched.firstName && errors.firstName)} sx={inputStyle}>
                                            <InputLabel htmlFor="firstName">Prénom</InputLabel>
                                            <OutlinedInput
                                                size="small"
                                                id="firstName"
                                                name="firstName"
                                                label="Prénom"
                                                value={values.firstName}
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                            />
                                            {touched.firstName && errors.firstName && (
                                                <FormHelperText error>{errors.firstName}</FormHelperText>
                                            )}
                                        </FormControl>
                                    </Grid>
                                </Grid>

                                {/* Row 2: Date de naissance, Lieu de naissance */}
                                <Grid container spacing={2} mb={2}>
                                    <Grid item xs={12} sm={6}>
                                        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                                            <DatePicker
                                                label="Date de naissance"
                                                value={values.dateNaissance}
                                                onChange={(date) => setFieldValue('dateNaissance', date)}
                                                slotProps={{
                                                    textField: {
                                                        fullWidth: true,
                                                        error: Boolean(touched.dateNaissance && errors.dateNaissance),
                                                        helperText: touched.dateNaissance && errors.dateNaissance,
                                                        size: "small",
                                                        sx: { 
                                                            ...inputStyle
                                                        }
                                                    }
                                                }}
                                            />
                                        </LocalizationProvider>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <FormControl fullWidth error={Boolean(touched.lieuNaissance && errors.lieuNaissance)} sx={inputStyle}>
                                            <InputLabel htmlFor="lieuNaissance">Lieu de naissance</InputLabel>
                                            <OutlinedInput
                                                size="small"
                                                id="lieuNaissance"
                                                name="lieuNaissance"
                                                label="Lieu de naissance"
                                                value={values.lieuNaissance}
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                            />
                                            {touched.lieuNaissance && errors.lieuNaissance && (
                                                <FormHelperText error>{errors.lieuNaissance}</FormHelperText>
                                            )}
                                        </FormControl>
                                    </Grid>
                                </Grid>

                                {/* Row 3: Téléphone, Email, Adresse */}
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={4}>
                                        <FormControl fullWidth error={Boolean(touched.tel && errors.tel)} sx={inputStyle}>
                                            <InputLabel htmlFor="tel">Téléphone</InputLabel>
                                            <OutlinedInput
                                                size="small"
                                                id="tel"
                                                name="tel"
                                                label="Téléphone"
                                                value={values.tel}
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                            />
                                            {touched.tel && errors.tel && (
                                                <FormHelperText error>{errors.tel}</FormHelperText>
                                            )}
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <FormControl fullWidth error={Boolean(touched.email && errors.email)} sx={inputStyle}>
                                            <InputLabel htmlFor="email">Email</InputLabel>
                                            <OutlinedInput
                                                size="small"
                                                id="email"
                                                name="email"
                                                label="Email"
                                                value={values.email}
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                            />
                                            {touched.email && errors.email && (
                                                <FormHelperText error>{errors.email}</FormHelperText>
                                            )}
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <FormControl fullWidth error={Boolean(touched.adresse && errors.adresse)} sx={inputStyle}>
                                            <InputLabel htmlFor="adresse">Adresse</InputLabel>
                                            <OutlinedInput
                                                size="small"
                                                id="adresse"
                                                name="adresse"
                                                label="Adresse"
                                                value={values.adresse}
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                            />
                                            {touched.adresse && errors.adresse && (
                                                <FormHelperText error>{errors.adresse}</FormHelperText>
                                            )}
                                        </FormControl>
                                    </Grid>
                                </Grid>
                            </LabeledFrame>

                            {/* Add spacing between sections */}
                            <Box sx={{ mb: 3 }}></Box>

                            {/* Professional Information Section */}
                            <LabeledFrame>
                                <FrameLabel>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <BusinessIcon sx={{ mr: 1, fontSize: '1rem' }} /> 
                                        Informations professionnelles
                                    </Box>
                                </FrameLabel>

                                {/* Row 1: Matricule, Emploi, Grade */}
                                <Grid container spacing={2} mb={2}>
                                    <Grid item xs={12} sm={4}>
                                        <FormControl fullWidth error={Boolean(touched.matricule && errors.matricule)} sx={inputStyle}>
                                            <InputLabel htmlFor="matricule">Matricule</InputLabel>
                                            <OutlinedInput
                                                size="small"
                                                id="matricule"
                                                name="matricule"
                                                label="Matricule"
                                                value={values.matricule}
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                            />
                                            {touched.matricule && errors.matricule && (
                                                <FormHelperText error>{errors.matricule}</FormHelperText>
                                            )}
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <FormControl fullWidth error={Boolean(touched.emploiCode && errors.emploiCode)} sx={inputStyle}>
                                            <Autocomplete
                                                size="small"
                                                id="emploiCode"
                                                options={emplois || []}
                                                getOptionLabel={(option) => option.name || ''}
                                                onChange={(event, newValue) => {
                                                    setFieldValue('emploiCode', newValue ? newValue.code : '');
                                                }}
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        label="Emploi"
                                                        error={Boolean(touched.emploiCode && errors.emploiCode)}
                                                        helperText={touched.emploiCode && errors.emploiCode}
                                                        size="small"
                                                        sx={{ 
                                                            ...inputStyle
                                                        }}
                                                    />
                                                )}
                                                isOptionEqualToValue={(option, value) => option.code === value?.code}
                                            />
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <FormControl fullWidth error={Boolean(touched.gradeCode && errors.gradeCode)} sx={inputStyle}>
                                            <Autocomplete
                                                size="small"
                                                id="gradeCode"
                                                options={grades || []}
                                                getOptionLabel={(option) => option.name || ''}
                                                onChange={(event, newValue) => {
                                                    setFieldValue('gradeCode', newValue ? newValue.code : '');
                                                }}
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        label="Grade"
                                                        error={Boolean(touched.gradeCode && errors.gradeCode)}
                                                        helperText={touched.gradeCode && errors.gradeCode}
                                                        size="small"
                                                        sx={{ 
                                                            ...inputStyle
                                                        }}
                                                    />
                                                )}
                                                isOptionEqualToValue={(option, value) => option.code === value?.code}
                                            />
                                        </FormControl>
                                    </Grid>
                                </Grid>

                                {/* Row 2: Structure, Première prise de service */}
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <FormControl fullWidth error={Boolean(touched.strId && errors.strId)} sx={inputStyle}>
                                            <Autocomplete
                                                size="small"
                                                id="strId"
                                                options={structures || []}
                                                getOptionLabel={(option) => option.strName || ''}
                                                onChange={(event, newValue) => {
                                                    setFieldValue('strId', newValue ? newValue.strId : null);
                                                }}
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        label="Structure"
                                                        error={Boolean(touched.strId && errors.strId)}
                                                        helperText={touched.strId && errors.strId}
                                                        size="small"
                                                        sx={{ 
                                                            ...inputStyle
                                                        }}
                                                    />
                                                )}
                                                isOptionEqualToValue={(option, value) => option.strId === value?.strId}
                                            />
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                                            <DatePicker
                                                label="Première prise de service"
                                                value={values.datePremierePriseService}
                                                onChange={(date) => setFieldValue('datePremierePriseService', date)}
                                                slotProps={{
                                                    textField: {
                                                        fullWidth: true,
                                                        error: Boolean(touched.datePremierePriseService && errors.datePremierePriseService),
                                                        helperText: touched.datePremierePriseService && errors.datePremierePriseService,
                                                        size: "small",
                                                        sx: { 
                                                            ...inputStyle
                                                        }
                                                    }
                                                }}
                                            />
                                        </LocalizationProvider>
                                    </Grid>
                                </Grid>
                            </LabeledFrame>

                            {/* Error message */}
                            {(errors.submit || submitError) && (
                                <Box sx={{ mt: 3 }}>
                                    <FormHelperText error>{errors.submit || submitError}</FormHelperText>
                                </Box>
                            )}
                        </form>
                    )}
                </Formik>
            </Modal>
            <FloatingAlert 
                open={alertOpen} 
                feedBackMessages={alertMessage} 
                severity={alertSeverity}
                onClose={() => setAlertOpen(false)}
            />
        </>
    );
};

RegisterUserModal.propTypes = {
    open: PropTypes.bool.isRequired,
    handleClose: PropTypes.func.isRequired
};

export default RegisterUserModal;
