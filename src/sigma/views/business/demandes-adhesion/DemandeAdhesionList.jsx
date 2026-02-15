import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Box, Typography, Stack } from '@mui/material';
import GenericSearchablePaginatedList from 'src/sigma/components/commons/GenericSearchablePaginatedList';
import WorkflowStatusTabsList from 'src/sigma/components/workflow/WorkflowStatusTabsList';
import StatusBadge from 'src/sigma/components/workflow/StatusBadge';
import { useSearchDemandeAdhesion } from 'src/sigma/hooks/query/useDemandeAdhesion';
import { useApplyTransition, useAvailableTransitions, EXECUTION_KEYS } from 'src/sigma/hooks/query/useWorkflow';
import { getAvailableTransitions } from 'src/sigma/api/workflowApi';
import { demandeAdhesionApi } from 'src/sigma/api/businessApi';
import { formatLabel } from 'src/sigma/utilities/formatUtils';
import VisibilityIcon from '@mui/icons-material/Visibility';
import useAuth from 'src/sigma/hooks/useAuth';
import UnifiedActionDropdown from 'src/sigma/components/workflow/UnifiedActionDropdown';
import RegisterUserWizard from 'src/sigma/views/business/adhesions/RegisterUserWizard';

const DemandeAdhesionList = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const { mutateAsync: applyTransition } = useApplyTransition();
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [modalState, setModalState] = useState({ open: false, row: null });

    const handleNavigate = async (row) => {
        const id = row.demandeId || row.id;
        
        // Transition automatique si demandeurId !== userId
        if (row.demandeurId !== user?.userId) {
            try {
                // On récupère les transitions disponibles pour cet objet en utilisant les mêmes clés/fonctions que le hook
                const transitions = await queryClient.fetchQuery({
                    queryKey: EXECUTION_KEYS.availableTransitions('DMD_ADH', 'DemandeAdhesion', String(id)),
                    queryFn: () => getAvailableTransitions('DMD_ADH', 'DemandeAdhesion', String(id))
                });

                if (transitions && Array.isArray(transitions)) {
                    const invisibleTransitions = transitions.filter(t => t.visible === false);
                    for (const t of invisibleTransitions) {
                        await applyTransition({
                            workflowCode: 'DMD_ADH',
                            objectType: 'DemandeAdhesion',
                            objectId: String(id),
                            transitionId: t.transitionId || t.id,
                            request: { commentaire: `Exécution automatique de la transition ${t.libelle}` }
                        });
                    }
                    if (invisibleTransitions.length > 0) {
                        queryClient.invalidateQueries({ queryKey: ['demandes-adhesion'] });
                    }
                }
            } catch (error) {
                console.error('Erreur lors de l\'exécution des transitions automatiques:', error);
            }
        }
        
        navigate('/business/demandes-adhesion/' + String(id || ''), { state: { row } });
    };

    const columns = [
        {
            header: 'Référence',
            field: 'reference',
            render: (row) => {
                const id = row.demandeId || row.id;
                return <strong>{row.reference || (id ? 'DEM-' + String(id) : '')}</strong>;
            }
        },
        {
            header: 'Demandeur',
            render: (row) => (
                <Stack>
                    <Typography variant="body2">
                        {row.demandeurNom} {row.demandeurPrenom}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                        {row.demandeurEmail}
                    </Typography>
                </Stack>
            )
        },
        {
            header: 'Association',
            field: 'assoName'
        },
        {
            header: 'Date Demande',
            field: 'createdAt',
            render: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleDateString('fr-FR') : '-')
        },
        {
            header: 'Motif',
            field: 'motifStatut',
        },
        {
            header: 'Statut',
            render: (row) => (
                <StatusBadge
                    status={{ libelle: row.statutNom, color: row.statutColor, icon: row.statutIcon }}
                    onClick={() => handleNavigate(row)}
                    sx={{ cursor: 'pointer' }}
                />
            )
        },
        {
            header: 'Actions',
            render: (row) => {
                const id = row.demandeId || row.id;
                const isOwner = user?.userId === row.demandeurId;
                return (
                    <UnifiedActionDropdown
                        workflowCode="DMD_ADH"
                        objectType="DemandeAdhesion"
                        objectId={id ? String(id) : ''}
                        onView={() => handleNavigate(row)}
                        onEdit={isOwner && selectedGroup?.code === 'BROUIL' ? () => setModalState({ open: true, row }) : undefined}
                        onTransitionApplied={() => {
                            queryClient.invalidateQueries({ queryKey: ['demandes-adhesion'] });
                        }}
                    />
                );
            }
        }
    ];

    const handleGroupChange = useCallback((group) => {
        setSelectedGroup(group);
    }, []);

    const checkGroupEmpty = useCallback(async (group) => {
        try {
            const response = await demandeAdhesionApi.search(user?.assoId, {
                statusGroupCode: group.code,
                page: 0,
                size: 1
            });
            return !response || response.totalElements === 0;
        } catch (error) {
            console.error('Error checking group empty:', error);
            return false; // Par défaut, on l'affiche en cas d'erreur
        }
    }, [user?.assoId]);

    return (
        <Box sx={{ p: 0 }}>
            <WorkflowStatusTabsList 
                workflowCode="DMD_ADH" 
                onGroupChange={handleGroupChange} 
                checkGroupEmpty={checkGroupEmpty}
            />

            {selectedGroup && (
                <GenericSearchablePaginatedList
                    key={selectedGroup.code || selectedGroup.id}
                    title={`Liste des demandes : ${formatLabel(selectedGroup.name)}`}
                    queryHook={useSearchDemandeAdhesion}
                    columns={columns}
                    paramMapper={({ page, size, search }) => ({
                        page,
                        size,
                        key: search,
                        statusGroupCode: selectedGroup?.code,
                        assoId: user?.assoId // Fallback à 1 si non fourni, selon les recommandations
                    })}
                    getRowId={(row) => row.id}
                />
            )}

            <RegisterUserWizard
                open={modalState.open}
                handleClose={() => setModalState({ open: false, row: null })}
                mode="edit"
                row={modalState.row}
                onRegistered={() => {
                    queryClient.invalidateQueries({ queryKey: ['demandes-adhesion'] });
                }}
            />
        </Box>
    );
};

export default DemandeAdhesionList;
