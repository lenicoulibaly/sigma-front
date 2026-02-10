import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useQueryClient } from '@tanstack/react-query';

// material-ui
import {
    Autocomplete,
    Box,
    Button,
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
import { useUpdateUserProfile } from '../../../hooks/query/useAuthorities';

// ==============================|| EDIT USER PROFILE MODAL ||============================== //

const EditUserProfileModal = ({ open, handleClose, profile }) => {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        id: '',
        userId: '',
        profileCode: '',
        strId: '',
        userProfileAssTypeCode: '',
        startingDate: new Date(),
        endingDate: null
    });
    const [errors, setErrors] = useState({});
    const [isUpdateSuccess, setIsUpdateSuccess] = useState(false);
    const [isUpdateError, setIsUpdateError] = useState(false);
    const [updateErrorMessage, setUpdateErrorMessage] = useState('');

    // Fetch data for dropdowns
    const { data: structures, isLoading: isLoadingStructures } = useVisibleStructures();
    const { data: profiles, isLoading: isLoadingProfiles } = useAllProfiles();
    const { data: profileTypes, isLoading: isLoadingProfileTypes } = useTypesByGroupCode('USR_PRFL_TYPE');

    // Mutation for updating a profile
    const updateProfileMutation = useUpdateUserProfile();

    // Initialize form with profile data
    useEffect(() => {
        if (profile) {
            setFormData({
                id: profile.id,
                userId: profile.userId,
                profileCode: profile.profileCode,
                strId: profile.strId,
                userProfileAssTypeCode: profile.userProfileAssTypeCode,
                startingDate: profile.startingDate ? new Date(profile.startingDate) : new Date(),
                endingDate: profile.endingDate ? new Date(profile.endingDate) : null
            });
        }
    }, [profile]);

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

    // Handle date changes
    const handleStartDateChange = (date) => {
        setFormData({
            ...formData,
            startingDate: date
        });
        // Clear error for this field
        if (errors.startingDate) {
            setErrors({
                ...errors,
                startingDate: null
            });
        }
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

        if (!formData.profileCode) newErrors.profileCode = 'Le profil est requis';
        if (!formData.strId) newErrors.strId = 'La structure est requise';
        if (!formData.userProfileAssTypeCode) newErrors.userProfileAssTypeCode = 'Le type de profil est requis';
        if (!formData.startingDate) newErrors.startingDate = 'La date de début est requise';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async () => {
        if (validateForm()) {
            try {
                await updateProfileMutation.mutateAsync(formData);
                queryClient.invalidateQueries(['userProfiles', formData.userId]);
                setIsUpdateSuccess(true);
                setIsUpdateError(false);
                setTimeout(() => {
                    handleClose();
                }, 2000); // Close the modal after 2 seconds to allow the user to see the success message
            } catch (error) {
                console.error('Error updating profile:', error);
                setIsUpdateError(true);
                setIsUpdateSuccess(false);
                // Handle API errors
                if (error.response?.data) {
                    const errorMessage = typeof error.response.data === 'object' 
                        ? error.response.data.message || JSON.stringify(error.response.data) 
                        : error.response.data;
                    setUpdateErrorMessage(errorMessage);
                    setErrors({
                        ...errors,
                        submit: errorMessage
                    });
                } else {
                    setUpdateErrorMessage('Une erreur est survenue lors de la mise à jour du profil');
                    setErrors({
                        ...errors,
                        submit: 'Une erreur est survenue lors de la mise à jour du profil'
                    });
                }
            }
        }
    };

    return (
        <Modal
            open={open}
            handleClose={handleClose}
            title={`Modifier le profil de ${profile.lastName}, ${profile.firstName} (${profile.email})`}
            maxWidth="md"
            actions={
                <Box display="flex" justifyContent="flex-end" gap={1}>
                    <Button variant="outlined" color="secondary" onClick={handleClose}>
                        Annuler
                    </Button>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={handleSubmit}
                        disabled={updateProfileMutation.isLoading}
                    >
                        {updateProfileMutation.isLoading ? 'Mise à jour en cours...' : 'Mettre à jour'}
                    </Button>
                </Box>
            }
        >
            <Grid container spacing={2}>
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
                        id="strId"
                        options={structures || []}
                        getOptionLabel={(option) => option.strName || ''}
                        isOptionEqualToValue={(option, value) => option.strId === value.strId}
                        value={structures?.find((s) => s.strId === formData.strId) || null}
                        onChange={(event, newValue) => {
                            setFormData({
                                ...formData,
                                strId: newValue ? newValue.strId : ''
                            });
                            if (errors.strId) {
                                setErrors({
                                    ...errors,
                                    strId: null
                                });
                            }
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Structure"
                                error={Boolean(errors.strId)}
                                helperText={errors.strId}
                                fullWidth
                                size="small"
                            />
                        )}
                        loading={isLoadingStructures}
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
                open={isUpdateError || isUpdateSuccess} 
                feedBackMessages={isUpdateError ? updateErrorMessage : isUpdateSuccess ? 'Profil modifié avec succès' : ''} 
                severity={isUpdateError ? 'error' : isUpdateSuccess ? 'success' : 'info'}
            />
        </Modal>
    );
};

EditUserProfileModal.propTypes = {
    open: PropTypes.bool.isRequired,
    handleClose: PropTypes.func.isRequired,
    profile: PropTypes.object.isRequired
};

export default EditUserProfileModal;
