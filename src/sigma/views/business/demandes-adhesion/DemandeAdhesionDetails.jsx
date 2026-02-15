import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, Button, CircularProgress, Alert, Stack } from '@mui/material';
import WorkflowManager from 'src/sigma/components/workflow/WorkflowManager';
import { useWorkflowGeneralInfo, useApplyTransition, useAvailableTransitions } from 'src/sigma/hooks/query/useWorkflow';
import { useDemandeAdhesionById } from 'src/sigma/hooks/query/useDemandeAdhesion';
import useAuth from 'src/sigma/hooks/useAuth';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RegisterUserWizard from 'src/sigma/views/business/adhesions/RegisterUserWizard';
import { useEffect, useRef } from 'react';

const DemandeAdhesionDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [modalState, setModalState] = useState({ open: false });
    const hasTriggeredAuto = useRef(false);

    // On tente de récupérer les infos de statut depuis le state de navigation (venant de la liste)
    const rowFromState = location.state?.row;
    // Hook pour les infos de workflow générales (utilisé pour l'affichage des onglets)
    const { data: generalInfoFields, isLoading: isGeneralLoading, isError: isGeneralError, refetch: refetchGeneral } = useWorkflowGeneralInfo('DemandeAdhesion', id);

    // Récupération des données complètes de la demande pour vérifier les droits d'édition
    const { data: demande, isLoading: isDemandeLoading, refetch: refetchDemande } = useDemandeAdhesionById(id);

    const { data: transitions = [] } = useAvailableTransitions('DMD_ADH', 'DemandeAdhesion', id, {
        enabled: !!id && !!demande && demande.demandeurId !== user?.userId
    });

    const { mutateAsync: applyTransition } = useApplyTransition();

    useEffect(() => {
        const triggerAutoTransitions = async () => {
            if (demande && user && demande.demandeurId !== user.userId && transitions.length > 0 && !hasTriggeredAuto.current) {
                const invisibleTransitions = transitions.filter(t => t.visible === false);
                if (invisibleTransitions.length > 0) {
                    hasTriggeredAuto.current = true;
                    try {
                        for (const t of invisibleTransitions) {
                            await applyTransition({
                                workflowCode: 'DMD_ADH',
                                objectType: 'DemandeAdhesion',
                                objectId: String(id),
                                transitionId: t.transitionId || t.id,
                                request: { commentaire: `Exécution automatique de la transition ${t.libelle}` }
                            });
                        }
                        refetchDemande();
                        refetchGeneral();
                    } catch (error) {
                        console.error('Erreur transitions automatiques:', error);
                    }
                }
            }
        };
        triggerAutoTransitions();
    }, [demande, user, transitions, id, applyTransition, refetchDemande, refetchGeneral]);

    const handleEdit = () => {
        setModalState({ open: true });
    };

    const handleCloseModal = () => {
        setModalState({ open: false });
        refetchGeneral();
        refetchDemande();
    };

    const referenceField = generalInfoFields?.find(f => f.label === 'Référence' || f.label === 'ID');
    const reference = referenceField?.value || rowFromState?.reference || (demande?.reference) || `DEM-${id}`;
    
    // Déterminer si l'utilisateur est le propriétaire de la demande et si elle est éditable
    const canEdit = demande && user && demande.demandeurId === user.userId && ['BROUIL', 'AJRN'].includes(demande.statutCode);
    // On priorise le state, puis éventuellement generalInfoFields
    const currentStatus = rowFromState ? {
        libelle: rowFromState.statutNom,
        color: rowFromState.statutColor,
        icon: rowFromState.statutIcon,
        onClick: () => navigate(`/business/demandes-adhesion/${id}`),
        sx: { cursor: 'pointer' }
    } : (demande ? {
        libelle: demande.statutNom,
        color: demande.statutColor,
        icon: demande.statutIcon,
        onClick: () => navigate(`/business/demandes-adhesion/${id}`),
        sx: { cursor: 'pointer' }
    } : (generalInfoFields?.find(f => f.label === 'Statut Actuel') ? {
        libelle: generalInfoFields.find(f => f.label === 'Statut Actuel').value,
        onClick: () => navigate(`/business/demandes-adhesion/${id}`),
        sx: { cursor: 'pointer' }
    } : null));

    if (isGeneralLoading || isDemandeLoading) {
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
                    refetchGeneral();
                    refetchDemande();
                }}
                onEdit={canEdit ? handleEdit : undefined}
                onView={() => navigate(`/business/demandes-adhesion/${id}`)}
            />
            <RegisterUserWizard
                open={modalState.open}
                handleClose={handleCloseModal}
                mode="edit"
                row={demande}
                onRegistered={() => {
                    refetchGeneral();
                    refetchDemande();
                }}
            />
        </Box>
    );
};

export default DemandeAdhesionDetails;
