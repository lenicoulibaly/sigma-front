import React, { useState } from 'react';
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
import useAuth from '../../../hooks/useAuth';
import { useVisibleStructures } from '../../../hooks/query/useStructures';
import { useAllProfiles } from '../../../hooks/query/useAuthorities';
import { useAssociationSections } from '../../../hooks/query/useSections';
import { useTypesByGroupCode } from '../../../hooks/query/useTypes';
import { useAddProfileToUser } from '../../../hooks/query/useAuthorities';

// ==============================|| ADD USER PROFILE MODAL ||============================== //

const AddUserProfileModal = ({ open, handleClose, userId, user: propUser }) => {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        userId: userId,
        profileCode: '',
        strId: '',
        sectionId: '',
        userProfileAssTypeCode: '',
        startingDate: new Date(),
        endingDate: null
    });
    const [errors, setErrors] = useState({});
    const [isCreateSuccess, setIsCreateSuccess] = useState(false);
    const [isCreateError, setIsCreateError] = useState(false);
    const [createErrorMessage, setCreateErrorMessage] = useState('');

    // Use user directly from props

    // Fetch data for dropdowns
    const { data: structures, isLoading: isLoadingStructures } = useVisibleStructures();
    const { data: profiles, isLoading: isLoadingProfiles } = useAllProfiles();
    const { data: profileTypes, isLoading: isLoadingProfileTypes } = useTypesByGroupCode('USR_PRFL_TYPE');
    const { data: sections, isLoading: isLoadingSections } = useAssociationSections(user?.assoId);

    // Mutation for adding a profile
    const addProfileMutation = useAddProfileToUser();

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
        if (!formData.sectionId) newErrors.sectionId = 'La section est requise';
        if (!formData.userProfileAssTypeCode) newErrors.userProfileAssTypeCode = 'Le type de profil est requis';
        if (!formData.startingDate) newErrors.startingDate = 'La date de début est requise';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async () => {
        if (validateForm()) {
            try {
                await addProfileMutation.mutateAsync(formData);
                queryClient.invalidateQueries(['userProfiles', userId]);
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
                    setCreateErrorMessage('Une erreur est survenue lors de l\'ajout du profil');
                    setErrors({
                        ...errors,
                        submit: 'Une erreur est survenue lors de l\'ajout du profil'
                    });
                }
            }
        }
    };

    return (
        <Modal
            open={open}
            handleClose={handleClose}
            title={propUser ? `Ajouter un profil pour ${propUser.lastName}, ${propUser.firstName} (${propUser.email})` : "Ajouter un profil"}
            maxWidth="md"
            handleConfirmation={handleSubmit}
            actionDisabled={!!addProfileMutation.isLoading}
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
                        id="sectionId"
                        options={sections || []}
                        getOptionLabel={(option) => option.sectionName || ''}
                        isOptionEqualToValue={(option, value) => option.sectionId === value.sectionId}
                        value={sections?.find((s) => s.sectionId === formData.sectionId) || null}
                        onChange={(event, newValue) => {
                            setFormData({
                                ...formData,
                                sectionId: newValue ? newValue.sectionId : ''
                            });
                            if (errors.sectionId) {
                                setErrors({
                                    ...errors,
                                    sectionId: null
                                });
                            }
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Section"
                                error={Boolean(errors.sectionId)}
                                helperText={errors.sectionId}
                                fullWidth
                                size="small"
                            />
                        )}
                        loading={isLoadingSections}
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
                feedBackMessages={isCreateError ? createErrorMessage : isCreateSuccess ? 'Profil ajouté avec succès' : ''} 
                severity={isCreateError ? 'error' : isCreateSuccess ? 'success' : 'info'}
            />
        </Modal>
    );
};

AddUserProfileModal.propTypes = {
    open: PropTypes.bool.isRequired,
    handleClose: PropTypes.func.isRequired,
    userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    user: PropTypes.object
};

export default AddUserProfileModal;
