import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useQueryClient } from '@tanstack/react-query';

// material-ui
import {
    Autocomplete,
    Box,
    Button,
    Divider,
    Grid,
    TextField,
    Typography
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { fr } from 'date-fns/locale';

// project imports
import Modal from '../../../components/commons/Modal';
import FloatingAlert from '../../../components/commons/FloatingAlert';
import { useVisibleStructures } from '../../../hooks/query/useStructures';
import { useAllProfiles } from '../../../hooks/query/useAuthorities';
import { useTypesByGroupCode } from '../../../hooks/query/useTypes';
import { useCreateUserWithProfile } from '../../../hooks/query/useUsers';

// ==============================|| ADD USER MODAL ||============================== //

const AddUserModal = ({ open, handleClose }) => {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        email: '',
        firstName: '',
        lastName: '',
        tel: '',
        strId: null,
        profileCode: '',
        userProfileAssTypeCode: '',
        startingDate: new Date(),
        endingDate: null
    });
    const [errors, setErrors] = useState({});
    const [isCreateSuccess, setIsCreateSuccess] = useState(false);
    const [isCreateError, setIsCreateError] = useState(false);
    const [createErrorMessage, setCreateErrorMessage] = useState('');

    // Fetch data for dropdowns
    const { data: structures, isLoading: isLoadingStructures } = useVisibleStructures();
    const { data: profiles, isLoading: isLoadingProfiles } = useAllProfiles();
    const { data: profileTypes, isLoading: isLoadingProfileTypes } = useTypesByGroupCode('USR_PRFL_TYPE');

    // Mutation for creating a user
    const createUserMutation = useCreateUserWithProfile();

    // Handle form input changes
    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData({
            ...formData,
            [name]: value
        });
        // Clear error for this field
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: null
            });
        }
    };

    // Handle structure selection
    const handleStructureChange = (event, newValue) => {
        setFormData({
            ...formData,
            strId: newValue?.strId || null
        });
        // Clear error for this field
        if (errors.strId) {
            setErrors({
                ...errors,
                strId: null
            });
        }
    };

    // Handle date changes
    const handleStartDateChange = (date) => {
        setFormData({
            ...formData,
            startingDate: date
        });
    };

    const handleEndDateChange = (date) => {
        setFormData({
            ...formData,
            endingDate: date
        });
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        if (!formData.email) newErrors.email = 'L\'email est requis';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Format d\'email invalide';

        if (!formData.firstName) newErrors.firstName = 'Le prénom est requis';
        if (!formData.lastName) newErrors.lastName = 'Le nom est requis';
        if (!formData.tel) newErrors.tel = 'Le téléphone est requis';
        if (!formData.strId) newErrors.strId = 'La structure est requise';
        if (!formData.profileCode) newErrors.profileCode = 'Le profil est requis';
        if (!formData.userProfileAssTypeCode) newErrors.userProfileAssTypeCode = 'Le type de profil est requis';
        if (!formData.startingDate) newErrors.startingDate = 'La date de début est requise';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async () => {
        if (validateForm()) {
            try {
                await createUserMutation.mutateAsync(formData);
                queryClient.invalidateQueries('users');
                setIsCreateSuccess(true);
                setIsCreateError(false);
            } catch (error) {
                setIsCreateError(true);
                setIsCreateSuccess(false);
                // Handle API errors
                if (error.response?.data) {
                    const errorMessage = typeof error.response.data === 'object' 
                        ? error.response.data.message || JSON.stringify(error.response.data) 
                        : error.response.data;
                    setCreateErrorMessage(errorMessage);
                    setErrors({
                        ...errors,
                        submit: errorMessage
                    });
                } else {
                    setCreateErrorMessage('Une erreur est survenue lors de la création de l\'utilisateur');
                    setErrors({
                        ...errors,
                        submit: 'Une erreur est survenue lors de la création de l\'utilisateur'
                    });
                }
            }
        }
    };

    return (
        <Modal
            open={open}
            handleClose={handleClose}
            title="Ajouter un nouvel utilisateur"
            maxWidth="md"
            handleConfirmation={handleSubmit}
            actionDisabled={!!createUserMutation.isLoading}
        >
            <Grid container spacing={2}>
                {/* General Information Section */}
                <Grid item xs={12}>
                    <Typography variant="h5" gutterBottom>
                        Informations générales
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                </Grid>

                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        id="firstName"
                        name="firstName"
                        label="Prénom"
                        value={formData.firstName}
                        onChange={handleChange}
                        error={Boolean(errors.firstName)}
                        helperText={errors.firstName}
                        size="small"
                    />
                </Grid>

                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        id="lastName"
                        name="lastName"
                        label="Nom"
                        value={formData.lastName}
                        onChange={handleChange}
                        error={Boolean(errors.lastName)}
                        helperText={errors.lastName}
                        size="small"
                    />
                </Grid>

                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        id="email"
                        name="email"
                        label="Email"
                        value={formData.email}
                        onChange={handleChange}
                        error={Boolean(errors.email)}
                        helperText={errors.email}
                        size="small"
                    />
                </Grid>

                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        id="tel"
                        name="tel"
                        label="Téléphone"
                        value={formData.tel}
                        onChange={handleChange}
                        error={Boolean(errors.tel)}
                        helperText={errors.tel}
                        size="small"
                    />
                </Grid>

                <Grid item xs={12}>
                    <Autocomplete
                        id="structure"
                        options={structures || []}
                        getOptionLabel={(option) => option.strName || ''}
                        onChange={handleStructureChange}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Structure"
                                error={Boolean(errors.strId)}
                                helperText={errors.strId}
                                size="small"
                            />
                        )}
                        isOptionEqualToValue={(option, value) => option.strId === value?.strId}
                        size="small"
                    />
                </Grid>

                {/* Profile Information Section */}
                <Grid item xs={12} sx={{ mt: 2 }}>
                    <Typography variant="h5" gutterBottom>
                        Profil de l'utilisateur
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                </Grid>

                <Grid item xs={12} md={6}>
                    <Autocomplete
                        id="profileCode"
                        options={profiles || []}
                        getOptionLabel={(option) => option.name || ''}
                        isOptionEqualToValue={(option, value) => option.code === value.code}
                        value={profiles?.find((p) => p.code === formData.profileCode) || null}
                        onChange={(event, newValue) => {
                            setFormData({
                                ...formData,
                                profileCode: newValue ? newValue.code : ''
                            });
                            if (errors.profileCode) {
                                setErrors({
                                    ...errors,
                                    profileCode: null
                                });
                            }
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Profil"
                                error={Boolean(errors.profileCode)}
                                helperText={errors.profileCode}
                                fullWidth
                                size="small"
                            />
                        )}
                        loading={isLoadingProfiles}
                        size="small"
                    />
                </Grid>

                <Grid item xs={12} md={6}>
                    <Autocomplete
                        id="userProfileAssTypeCode"
                        options={profileTypes || []}
                        getOptionLabel={(option) => option.name || ''}
                        isOptionEqualToValue={(option, value) => option.code === value.code}
                        value={profileTypes?.find((t) => t.code === formData.userProfileAssTypeCode) || null}
                        onChange={(event, newValue) => {
                            setFormData({
                                ...formData,
                                userProfileAssTypeCode: newValue ? newValue.code : ''
                            });
                            if (errors.userProfileAssTypeCode) {
                                setErrors({
                                    ...errors,
                                    userProfileAssTypeCode: null
                                });
                            }
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Type de profil"
                                error={Boolean(errors.userProfileAssTypeCode)}
                                helperText={errors.userProfileAssTypeCode}
                                fullWidth
                                size="small"
                            />
                        )}
                        loading={isLoadingProfileTypes}
                        size="small"
                    />
                </Grid>

                <Grid item xs={12} md={6}>
                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                        <DatePicker
                            label="Date de début"
                            value={formData.startingDate}
                            onChange={handleStartDateChange}
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    error: Boolean(errors.startingDate),
                                    helperText: errors.startingDate,
                                    size: 'small'
                                }
                            }}
                        />
                    </LocalizationProvider>
                </Grid>

                <Grid item xs={12} md={6}>
                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                        <DatePicker
                            label="Date de fin (optionnelle)"
                            value={formData.endingDate}
                            onChange={handleEndDateChange}
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    size: 'small'
                                }
                            }}
                        />
                    </LocalizationProvider>
                </Grid>

                {/* Error message */}
                {errors.submit && (
                    <Grid item xs={12}>
                        <Typography color="error">{errors.submit}</Typography>
                    </Grid>
                )}
            </Grid>
            <FloatingAlert 
                open={isCreateError || isCreateSuccess} 
                feedBackMessages={isCreateError ? createErrorMessage : isCreateSuccess ? 'Utilisateur créé avec succès' : ''} 
                severity={isCreateError ? 'error' : isCreateSuccess ? 'success' : 'info'}
            />
        </Modal>
    );
};

AddUserModal.propTypes = {
    open: PropTypes.bool.isRequired,
    handleClose: PropTypes.func.isRequired
};

export default AddUserModal;
