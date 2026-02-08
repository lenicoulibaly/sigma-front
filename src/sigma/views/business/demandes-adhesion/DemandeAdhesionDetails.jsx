import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, Button, CircularProgress, Alert, Stack } from '@mui/material';
import WorkflowManager from 'src/sigma/components/workflow/WorkflowManager';
import { useWorkflowGeneralInfo } from 'src/sigma/hooks/query/useWorkflow';
import useAuth from 'src/sigma/hooks/useAuth';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const DemandeAdhesionDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    // On tente de récupérer les infos de statut depuis le state de navigation (venant de la liste)
    const rowFromState = location.state?.row;
    // Hook pour les infos de workflow générales (utilisé pour l'affichage des onglets)
    const { data: generalInfoFields, isLoading: isGeneralLoading, isError: isGeneralError, refetch } = useWorkflowGeneralInfo('DemandeAdhesion', id);

    // Récupération des transitions disponibles pour alimenter les extraActions

    const referenceField = generalInfoFields?.find(f => f.label === 'Référence' || f.label === 'ID');
    const reference = referenceField?.value || rowFromState?.reference || `DEM-${id}`;
    
    // Déterminer si l'utilisateur est le propriétaire de la demande
    const isOwner = user?.userId === Number(id);

    // On priorise le state, puis éventuellement generalInfoFields
    const currentStatus = rowFromState ? {
        libelle: rowFromState.statutNom,
        color: rowFromState.statutColor,
        icon: rowFromState.statutIcon,
        onClick: () => navigate(`/business/demandes-adhesion/${id}`),
        sx: { cursor: 'pointer' }
    } : (generalInfoFields?.find(f => f.label === 'Statut Actuel') ? {
        libelle: generalInfoFields.find(f => f.label === 'Statut Actuel').value,
        onClick: () => navigate(`/business/demandes-adhesion/${id}`),
        sx: { cursor: 'pointer' }
    } : null);

    if (isGeneralLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (isGeneralError || !generalInfoFields) {
        return (
            <Box p={3}>
                <Alert severity="error">Erreur lors du chargement de la demande d'adhésion.</Alert>
                <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mt: 2 }}>
                    Retour
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 0 }}>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
                    Retour
                </Button>
                <Typography variant="h2">Détails de la demande : {reference}</Typography>
            </Stack>

            <WorkflowManager
                workflow={{ code: 'DMD_ADH' }}
                objectType="DemandeAdhesion"
                tableName="DEMANDE_ADHESION"
                objectId={String(id)}
                currentStatus={currentStatus}
                generalInfoFields={generalInfoFields}
                onTransitionApplied={() => {
                    refetch();
                }}
                onEdit={isOwner ? () => alert('Edit clicked') : undefined}
                onView={() => alert('View clicked')}
            />
        </Box>
    );
};

export default DemandeAdhesionDetails;
