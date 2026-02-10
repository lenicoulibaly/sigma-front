import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';

// material-ui
import {
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Typography,
    Divider,
    CircularProgress,
    Box
} from '@mui/material';

// project imports
import Modal from 'src/sigma/components/commons/Modal';
import CustomAlertDialog from 'src/sigma/components/commons/CustomAlertDialog';
import FloatingAlert from 'src/sigma/components/commons/FloatingAlert';
import { useActiveUserProfiles, useChangeDefaultProfile } from 'src/sigma/hooks/query/useAuthorities';
import { getUserAuthorities } from 'src/sigma/store/slices/authoritySlice';
import apiClient from 'src/sigma/api/apiClient';
import useAuth from 'hooks/useAuth';

// assets
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';

// ==============================|| USER PROFILES MODAL ||============================== //

const UserProfilesModal = ({ open, handleClose, userId }) => {
    const { data: profiles, isLoading, isError, error } = useActiveUserProfiles(userId);
    const changeDefaultProfileMutation = useChangeDefaultProfile();
    const [isChangingDefault, setIsChangingDefault] = useState(false);
    const dispatch = useDispatch();
    const { user } = useAuth();

    // State for confirmation dialog
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [selectedProfileId, setSelectedProfileId] = useState(null);

    // State for floating alert
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertSeverity, setAlertSeverity] = useState('info');

    // No longer needed as we use the onClose prop of FloatingAlert

    const handleOpenConfirmDialog = (profileId) => {
        setSelectedProfileId(profileId);
        setConfirmDialogOpen(true);
    };

    const handleCloseConfirmDialog = () => {
        setConfirmDialogOpen(false);
    };

    const handleConfirmSetDefault = () => {
        setIsChangingDefault(true);
        changeDefaultProfileMutation.mutate(selectedProfileId, {
            onSuccess: (data) => {
                // The API returns an object with accessToken and refreshToken
                if (data && data.accessToken && data.refreshToken) {
                    console.log('Received new tokens from changeDefaultProfile');

                    // Update localStorage with the new tokens
                    localStorage.setItem('sigma-access-token', data.accessToken);
                    localStorage.setItem('sigma-refresh-token', data.refreshToken);

                    // Update API client's Authorization header
                    apiClient.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;

                    // Update Redux store with the new tokens
                    dispatch({
                        type: 'auth/refreshToken/fulfilled',
                        payload: {
                            token: data.accessToken,
                            refreshToken: data.refreshToken
                        }
                    });

                    // Update user authorities in Redux store
                    if (user && user.email) {
                        dispatch(getUserAuthorities(user.email))
                            .unwrap()
                            .then(() => {
                                console.log('User authorities updated successfully');
                            })
                            .catch((error) => {
                                console.error('Error updating user authorities:', error);
                            });
                    }
                } else {
                    console.warn('No tokens received from changeDefaultProfile');
                }

                setIsChangingDefault(false);
                setConfirmDialogOpen(false);
                setAlertMessage('Le profil par défaut a été modifié avec succès. La page va s\'actualiser...');
                setAlertSeverity('success');
                setAlertOpen(true);

                // Refresh the page after a short delay to apply changes throughout the application
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            },
            onError: (error) => {
                console.error('Error setting default profile:', error);
                setIsChangingDefault(false);
                setAlertMessage(`Erreur lors de la modification du profil par défaut: ${error?.message || 'Erreur inconnue'}`);
                setAlertSeverity('error');
                setAlertOpen(true);
            }
        });
    };

    return (
        <>
            <Modal
                open={open}
                handleClose={handleClose}
                title="Mes profils actifs"
                actionVisible={false}
                width="sm"
            >
                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                    </Box>
                ) : isError ? (
                    <Typography color="error">
                        Erreur lors du chargement des profils: {error?.message || 'Erreur inconnue'}
                    </Typography>
                ) : profiles && profiles.length > 0 ? (
                    <List>
                        {profiles.map((profile, index) => {
                            const isDefault = profile.assStatusCode === 'STA_ASS_CUR';
                            return (
                                <React.Fragment key={profile.id}>
                                    {index > 0 && <Divider component="li" />}
                                    <ListItem>
                                        <ListItemText
                                            primary={
                                                <Typography variant="subtitle1">
                                                    {profile.profileName}
                                                    {isDefault && (
                                                        <Typography
                                                            component="span"
                                                            variant="caption"
                                                            sx={{
                                                                ml: 1,
                                                                bgcolor: 'success.main',
                                                                color: 'success.contrastText',
                                                                borderRadius: 1,
                                                                px: 1,
                                                                py: 0.25
                                                            }}
                                                        >
                                                            Par défaut
                                                        </Typography>
                                                    )}
                                                </Typography>
                                            }
                                            secondary={profile.strName + '(' +profile.id + ')' || 'Non spécifiée'}
                                        />
                                        {!isDefault && (
                                            <ListItemSecondaryAction>
                                                <IconButton
                                                    edge="end"
                                                    aria-label="set-default"
                                                    onClick={() => handleOpenConfirmDialog(profile.id)}
                                                    disabled={isChangingDefault}
                                                    color="warning"
                                                >
                                                    <StarBorderIcon />
                                                </IconButton>
                                            </ListItemSecondaryAction>
                                        )}
                                    </ListItem>
                                </React.Fragment>
                            );
                        })}
                    </List>
                ) : (
                    <Typography variant="body1" sx={{ p: 2 }}>
                        Aucun profil actif trouvé.
                    </Typography>
                )}
            </Modal>

            {/* Confirmation Dialog */}
            <CustomAlertDialog
                open={confirmDialogOpen}
                handleClose={handleCloseConfirmDialog}
                handleConfirm={handleConfirmSetDefault}
                title="Définir comme profil par défaut"
                content="Êtes-vous sûr de vouloir définir ce profil comme profil par défaut ?"
                confirmBtnText="Confirmer"
                cancelBtnText="Annuler"
                loading={isChangingDefault}
            />

            {/* Floating Alert for feedback */}
            <FloatingAlert
                open={alertOpen}
                feedBackMessages={alertMessage}
                severity={alertSeverity}
                timeout={alertSeverity === 'success' ? 2 : 7}
                onClose={() => setAlertOpen(false)}
            />
        </>
    );
};

UserProfilesModal.propTypes = {
    open: PropTypes.bool.isRequired,
    handleClose: PropTypes.func.isRequired,
    userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

export default UserProfilesModal;
