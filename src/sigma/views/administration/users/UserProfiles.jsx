import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

// material-ui
import {
    Button,
    Chip,
    Grid,
    IconButton,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    CircularProgress,
    Box,
    Tooltip,
    TextField,
    Autocomplete,
    FormControl,
    InputLabel,
    OutlinedInput,
    InputAdornment
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';

// project imports
import MainCard from 'ui-component/cards/MainCard';
import { gridSpacing } from 'store/constant';
import { useProfilesByUser, useRevokeProfileAssignment, useChangeDefaultProfile, useRestoreProfileAssignment } from '../../../hooks/query/useAuthorities';
import { useSearchUsers } from '../../../hooks/query/useUsers';
import { useVisibleStructures } from '../../../hooks/query/useStructures';
import Pagination from '../../../components/commons/Pagination';
import CustomAlertDialog from '../../../components/commons/CustomAlertDialog';
import FloatingAlert from '../../../components/commons/FloatingAlert';
import AddUserProfileModal from './AddUserProfileModal';
import EditUserProfileModal from './EditUserProfileModal';

// assets
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import AddIcon from '@mui/icons-material/Add';
import RestoreIcon from '@mui/icons-material/Restore';
import { IconSearch } from '@tabler/icons-react';

// ==============================|| USER PROFILES ||============================== //

const UserProfiles = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();

    // Get user from location state if available
    const userFromState = location.state?.user;

    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [inputValue, setInputValue] = useState('');
    const searchTimeoutRef = useRef(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedStructure, setSelectedStructure] = useState(null);
    const [openAddModal, setOpenAddModal] = useState(false);
    const [openEditModal, setOpenEditModal] = useState(false);
    const [openRevokeDialog, setOpenRevokeDialog] = useState(false);
    const [openRestoreDialog, setOpenRestoreDialog] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState(null);

    // Alert state
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertSeverity, setAlertSeverity] = useState('success');

    // Mutations for profile actions
    const revokeProfileMutation = useRevokeProfileAssignment();
    const changeDefaultProfileMutation = useChangeDefaultProfile();
    const restoreProfileMutation = useRestoreProfileAssignment();

    // Fetch users for autocomplete
    const { data: usersData } = useSearchUsers({
        page: 0,
        size: 100
    });
    const users = usersData?.content || [];

    // Fetch structures for autocomplete
    const { data: structures } = useVisibleStructures();

    // Use user from state if available, otherwise try to find it in the users list
    const [user, setUser] = useState(userFromState || null);
    const [isLoadingUser, setIsLoadingUser] = useState(!userFromState && !!userId);

    // Try to find user in users list if not available from state
    useEffect(() => {
        if (userId && !user && users.length > 0) {
            const foundUser = users.find(u => u.userId === parseInt(userId));
            if (foundUser) {
                setUser(foundUser);
                setIsLoadingUser(false);
            }
        }
    }, [userId, user, users]);

    // Set selected user from URL param if available
    useEffect(() => {
        if (userId && user) {
            setSelectedUser(user);
        }
    }, [userId, user]);

    // Fetch user profiles based on whether we have a userId or a selected user
    const effectiveUserId = userId || selectedUser?.userId;
    const { data: profilesPage, isLoading, isError, error, refetch } = useProfilesByUser(effectiveUserId, {
        page: page,
        size: pageSize,
        key: searchTerm,
        strId: selectedStructure?.strId
    });
    const profiles = profilesPage?.content;
    // Refetch when userId, searchTerm, selectedStructure, page, or pageSize changes
    useEffect(() => {
        refetch();
    }, [effectiveUserId, searchTerm, selectedStructure?.strId, page, pageSize, refetch]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    // Determine if we should show the "select a user" message
    const showSelectUserMessage = !userId && !selectedUser;

    // Handle page change
    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    // Handle page size change
    const handlePageSizeChange = (newSize) => {
        setPageSize(newSize);
        setPage(0); // Reset to first page when changing page size
    };

    // Handle back button
    const handleBack = () => {
        if (userId) {
            navigate('/administration/users');
        } else {
            navigate(-1);
        }
    };

    // Handle search with debouncing
    const handleSearch = (event) => {
        const value = event.target.value;
        setInputValue(value);

        // Clear any existing timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        // Set a new timeout to update searchTerm after 300ms
        searchTimeoutRef.current = setTimeout(() => {
            setSearchTerm(value);
        }, 300);
    };

    // Handle user selection
    const handleUserChange = (event, newValue) => {
        setSelectedUser(newValue);
        setPage(0); // Reset to first page when changing user
    };

    // Handle structure selection
    const handleStructureChange = (event, newValue) => {
        setSelectedStructure(newValue);
        setPage(0); // Reset to first page when changing structure
    };

    // Handle add profile
    const handleAddProfile = () => {
        setOpenAddModal(true);
    };

    // Handle edit profile
    const handleEditProfile = (profile) => {
        setSelectedProfile(profile);
        setOpenEditModal(true);
    };

    // Handle revoke profile
    const handleRevokeProfile = (profile) => {
        setSelectedProfile(profile);
        setOpenRevokeDialog(true);
    };

    // Handle restore profile
    const handleRestoreProfile = (profile) => {
        setSelectedProfile(profile);
        setOpenRestoreDialog(true);
    };


    // Handle close modals and dialogs
    const handleCloseAddModal = () => {
        setOpenAddModal(false);
    };

    const handleCloseEditModal = () => {
        setOpenEditModal(false);
        setSelectedProfile(null);
    };

    const handleCloseRevokeDialog = () => {
        setOpenRevokeDialog(false);
        setSelectedProfile(null);
    };


    const handleCloseRestoreDialog = () => {
        setOpenRestoreDialog(false);
        setSelectedProfile(null);
    };

    // Handle confirm actions
    const handleConfirmRevoke = () => {
        if (selectedProfile) {
            revokeProfileMutation.mutate(selectedProfile.id, {
                onSuccess: () => {
                    setOpenRevokeDialog(false);
                    setSelectedProfile(null);
                    // Show success message
                    setAlertMessage(`Le profil ${selectedProfile.profileName} a été révoqué avec succès`);
                    setAlertSeverity('success');
                    setAlertOpen(true);
                },
                onError: (error) => {
                    console.error('Error revoking profile:', error);
                    // Keep dialog open to show error
                }
            });
        }
    };


    const handleConfirmRestore = () => {
        if (selectedProfile) {
            restoreProfileMutation.mutate(selectedProfile.id, {
                onSuccess: () => {
                    setOpenRestoreDialog(false);
                    setSelectedProfile(null);
                    // Show success message
                    setAlertMessage(`Le profil ${selectedProfile.profileName} a été restauré avec succès`);
                    setAlertSeverity('success');
                    setAlertOpen(true);
                },
                onError: (error) => {
                    console.error('Error restoring profile:', error);
                    // Keep dialog open to show error
                }
            });
        }
    };

    // Show loading state
    if (isLoading || isLoadingUser) {
        return (
            <MainCard title="Assignations de profils">
                <Stack direction="row" justifyContent="center" alignItems="center" sx={{ py: 3 }}>
                    <CircularProgress />
                </Stack>
            </MainCard>
        );
    }

    // Show error state
    if (isError) {
        return (
            <MainCard title="Assignations de profils">
                <Stack direction="row" justifyContent="center" alignItems="center" sx={{ py: 3 }}>
                    <Typography color="error">Error loading profiles: {error?.message || 'Unknown error'}</Typography>
                </Stack>
            </MainCard>
        );
    }

    // Determine title based on context
    const pageTitle = userId 
        ? `Profils de l'utilisateur ${user ? `${user.firstName} ${user.lastName} (${user.email})` : ''}`
        : "Assignations de profils";

    return (
        <MainCard 
            title={
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Tooltip title="Retour à la liste des utilisateurs">
                        <IconButton onClick={handleBack} size="small">
                            <ArrowBackIcon />
                        </IconButton>
                    </Tooltip>
                    <Typography variant="h3">
                        {pageTitle}
                    </Typography>
                </Stack>
            }
        >
            <Grid container spacing={gridSpacing}>
                <Grid item xs={12}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth>
                                <InputLabel htmlFor="search-profiles">Recherche</InputLabel>
                                <OutlinedInput
                                    id="search-profiles"
                                    size="small"
                                    value={inputValue}
                                    onChange={handleSearch}
                                    placeholder="Rechercher des profils..."
                                    startAdornment={
                                        <InputAdornment position="start">
                                            <IconSearch stroke={1.5} size="1rem" />
                                        </InputAdornment>
                                    }
                                    label="Recherche"
                                />
                            </FormControl>
                        </Grid>
                        {!userId && (
                            <Grid item xs={12} sm={6} md={3}>
                                <Autocomplete
                                    id="user-filter"
                                    options={users || []}
                                    getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.email})`}
                                    value={selectedUser}
                                    onChange={handleUserChange}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Filtrer par utilisateur"
                                            size="small"
                                            placeholder="Sélectionner un utilisateur"
                                        />
                                    )}
                                    isOptionEqualToValue={(option, value) => option.userId === value?.userId}
                                />
                            </Grid>
                        )}
                        <Grid item xs={12} sm={6} md={userId ? 4 : 3}>
                            <Autocomplete
                                id="structure-filter"
                                options={structures || []}
                                getOptionLabel={(option) => option.strName || ''}
                                value={selectedStructure}
                                onChange={handleStructureChange}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Filtrer par structure"
                                        size="small"
                                        placeholder="Sélectionner une structure"
                                    />
                                )}
                                isOptionEqualToValue={(option, value) => option.strId === value?.strId}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={userId ? 4 : 3} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <Tooltip title={selectedUser ? `Ajouter un profil pour ${selectedUser.firstName} ${selectedUser.lastName}` : "Ajouter un profil"}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleAddProfile}
                                    sx={{ minWidth: '40px', width: '40px', height: '40px', padding: 0 }}
                                    disabled={!effectiveUserId}
                                >
                                    <AddIcon />
                                </Button>
                            </Tooltip>
                        </Grid>
                    </Grid>
                </Grid>

                {/* Display total count if available */}
                {!showSelectUserMessage && (
                    <Grid item xs={12}>
                        <Typography variant="subtitle1" sx={{ mb: 1 }}>
                            Total: {profilesPage?.totalElements || 0} élément{(profilesPage?.totalElements || 0) !== 1 ? 's' : ''}
                        </Typography>
                    </Grid>
                )}

                <Grid item xs={12}>
                    <TableContainer component={Paper} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, maxHeight: 440 }}>
                        <Table sx={{ minWidth: 650 }} aria-label="user profiles table" size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Nom</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Profil</TableCell>
                                    <TableCell>Structure</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Date de début</TableCell>
                                    <TableCell>Date de fin</TableCell>
                                    <TableCell>Par défaut</TableCell>
                                    <TableCell align="center">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {profiles && profiles.length > 0 ? (
                                    profiles.map((profile) => {
                                        const isCurrent = profile.assStatusCode === 'STA_ASS_CUR';
                                        const isRevoked = profile.assStatusCode === 'STA_ASS_INACT';

                                        return (
                                            <TableRow
                                                key={profile.id}
                                                sx={{
                                                    '&:last-child td, &:last-child th': { border: 0 },
                                                    backgroundColor: isRevoked 
                                                        ? alpha(theme.palette.grey[300], 0.3)
                                                        : isCurrent 
                                                            ? alpha(theme.palette.primary.light, 0.1)
                                                            : 'inherit'
                                                }}
                                            >
                                                <TableCell>
                                                    <Typography variant="subtitle2">{profile.firstName} {profile.lastName}</Typography>
                                                </TableCell>
                                                <TableCell>{profile.email}</TableCell>
                                                <TableCell>
                                                    <Typography variant="subtitle2">{profile.profileName}</Typography>
                                                </TableCell>
                                                <TableCell>{profile.strName}</TableCell>
                                                <TableCell>{profile.userProfileAssTypeName}</TableCell>
                                                <TableCell>{new Date(profile.startingDate).toLocaleDateString()}</TableCell>
                                                <TableCell>
                                                    {profile.endingDate ? new Date(profile.endingDate).toLocaleDateString() : '-'}
                                                </TableCell>

                                                <TableCell align="center">
                                                    {isCurrent ? <StarIcon color="warning" /> : <StarBorderIcon />}
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Stack direction="row" spacing={1} justifyContent="center">
                                                        {isRevoked ? (
                                                            <Tooltip title="Restaurer">
                                                                <IconButton 
                                                                    size="small" 
                                                                    color="success"
                                                                    onClick={() => handleRestoreProfile(profile)}
                                                                >
                                                                    <RestoreIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        ) : (
                                                            <>
                                                                <Tooltip title="Modifier">
                                                                    <IconButton 
                                                                        size="small" 
                                                                        color="primary"
                                                                        onClick={() => handleEditProfile(profile)}
                                                                    >
                                                                        <EditIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title="Révoquer">
                                                                    <IconButton 
                                                                        size="small" 
                                                                        color="error"
                                                                        onClick={() => handleRevokeProfile(profile)}
                                                                    >
                                                                        <DeleteIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </>
                                                        )}
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={9} align="center">
                                            <Typography variant="subtitle1">Aucun profil trouvé</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>

                {/* Pagination */}
                { (
                    <Grid item xs={12}>
                        <Pagination
                            page={page}
                            count={profilesPage?.totalPages || 1}
                            rowsPerPage={pageSize}
                            onPageChange={handlePageChange}
                            onRowsPerPageChange={handlePageSizeChange}
                            totalCount={profilesPage?.totalElements || 0}
                        />
                    </Grid>
                )}
            </Grid>

            {/* Add Profile Modal */}
            <AddUserProfileModal 
                open={openAddModal} 
                handleClose={handleCloseAddModal} 
                userId={effectiveUserId}
                user={user || selectedUser}
            />

            {/* Edit Profile Modal */}
            {selectedProfile && (
                <EditUserProfileModal 
                    open={openEditModal} 
                    handleClose={handleCloseEditModal} 
                    profile={selectedProfile}
                />
            )}

            {/* Revoke Profile Dialog */}
            <CustomAlertDialog
                open={openRevokeDialog}
                handleClose={handleCloseRevokeDialog}
                title="Révoquer le profil"
                content={`Êtes-vous sûr de vouloir révoquer le profil ${selectedProfile?.profileName} ?`}
                confirmBtnText="Révoquer"
                cancelBtnText="Annuler"
                handleConfirm={handleConfirmRevoke}
                loading={revokeProfileMutation.isPending}
                error={revokeProfileMutation.isError ? revokeProfileMutation.error?.message || "Une erreur est survenue" : null}
            />


            {/* Restore Profile Dialog */}
            <CustomAlertDialog
                open={openRestoreDialog}
                handleClose={handleCloseRestoreDialog}
                title="Restaurer le profil"
                content={`Êtes-vous sûr de vouloir restaurer le profil ${selectedProfile?.profileName} ?`}
                confirmBtnText="Restaurer"
                cancelBtnText="Annuler"
                handleConfirm={handleConfirmRestore}
                loading={restoreProfileMutation.isPending}
                error={restoreProfileMutation.isError ? restoreProfileMutation.error?.message || "Une erreur est survenue" : null}
            />

            {/* Success Alert */}
            <FloatingAlert
                open={alertOpen}
                feedBackMessages={alertMessage}
                severity={alertSeverity}
                timeout={alertSeverity === 'success' ? 2 : 7}
                onClose={() => setAlertOpen(false)}
            />
        </MainCard>
    );
};

export default UserProfiles;
