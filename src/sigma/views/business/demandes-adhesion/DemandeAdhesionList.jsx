import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Box, Typography, Stack } from '@mui/material';
import GenericSearchablePaginatedList from 'src/sigma/components/commons/GenericSearchablePaginatedList';
import WorkflowStatusTabsList from 'src/sigma/components/workflow/WorkflowStatusTabsList';
import StatusBadge from 'src/sigma/components/workflow/StatusBadge';
import { useSearchDemandeAdhesion } from 'src/sigma/hooks/query/useDemandeAdhesion';
import { demandeAdhesionApi } from 'src/sigma/api/businessApi';
import { formatLabel } from 'src/sigma/utilities/formatUtils';
import VisibilityIcon from '@mui/icons-material/Visibility';
import useAuth from 'src/sigma/hooks/useAuth';
import UnifiedActionDropdown from 'src/sigma/components/workflow/UnifiedActionDropdown';

const DemandeAdhesionList = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    console.log('User:', user);
    const queryClient = useQueryClient();
    const [selectedGroup, setSelectedGroup] = useState(null);

    const handleNavigate = (row) => {
        const id = row.demandeId || row.id;
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
                const isOwner = user?.userId === id;
                return (
                    <UnifiedActionDropdown
                        workflowCode="DMD_ADH"
                        objectType="DemandeAdhesion"
                        objectId={id ? String(id) : ''}
                        onView={() => handleNavigate(row)}
                        onEdit={isOwner && selectedGroup?.code === 'BROUIL' ? () => console.log('Edit clicked for', id) : undefined}
                        onTransitionApplied={() => {
                            queryClient.invalidateQueries({ queryKey: ['demandes-adhesion'] });
                        }}
                    />
                );
            }
        }
    ];

    const handleGroupChange = (group) => {
        setSelectedGroup(group);
    };

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
        </Box>
    );
};

export default DemandeAdhesionList;
