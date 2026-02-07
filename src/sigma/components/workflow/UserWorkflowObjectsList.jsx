import React from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import GenericSearchablePaginatedList from 'src/sigma/components/commons/GenericSearchablePaginatedList';
import UnifiedActionDropdown from 'src/sigma/components/workflow/UnifiedActionDropdown';
import useAuth from 'src/sigma/hooks/useAuth';
import { useOpenAssociationsList } from 'src/sigma/hooks/query/useAssociations';
import { useAccessibleWorkflowStatusGroups } from 'src/sigma/hooks/query/useWorkflow';
import { formatLabel } from 'src/sigma/utilities/formatUtils';

/**
 * Composant générique permettant à l'utilisateur connecté de consulter ses propres objets de workflow.
 * Affiche une liste unique avec des filtres Multi-select pour l'association et le statut.
 */
const UserWorkflowObjectsList = ({
    workflowCode,
    objectType,
    queryHook,
    columns,
    onView,
    onEdit,
    paramMapper,
    title,
    queryKeyToInvalidate,
    ...props
}) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Chargement des options pour les filtres (Associations et Groupes de Statut)
    const { data: associations = [] } = useOpenAssociationsList('');
    const { data: statusGroups = [] } = useAccessibleWorkflowStatusGroups(workflowCode, { enabled: !!workflowCode });

    const handleTransitionApplied = () => {
        // Rafraîchir les données après une action de workflow
        const key = queryKeyToInvalidate || [objectType.toLowerCase() + 's'];
        queryClient.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key] });
    };

    // Ajout automatique de la colonne "Actions" avec le menu contextuel de workflow
    const finalColumns = [
        ...columns,
        {
            header: 'Actions',
            render: (row) => {
                const id = row.id || row.uuid || row.demandeId;
                return (
                    <UnifiedActionDropdown
                        workflowCode={workflowCode}
                        objectType={objectType}
                        objectId={id ? String(id) : ''}
                        onView={() => onView?.(row)}
                        onEdit={onEdit ? () => onEdit(row) : undefined}
                        onTransitionApplied={handleTransitionApplied}
                    />
                );
            }
        }
    ];

    // Définition des filtres Autocomplete Multiselect
    const dropdownFilters = [
        {
            name: 'assoIds',
            label: 'Associations',
            multi: true,
            options: associations.map((a) => ({
                value: a.assoId,
                label: a.assoName
            }))
        },
        {
            name: 'statusGroupCodes',
            label: 'Statuts',
            multi: true,
            options: statusGroups.map((g) => ({
                value: g.code,
                label: formatLabel(g.name)
            }))
        }
    ];

    return (
        <Box sx={{ p: 0 }}>
            <GenericSearchablePaginatedList
                title={title || 'Mes objets de workflow'}
                queryHook={queryHook}
                columns={finalColumns}
                dropdownFilters={dropdownFilters}
                initialFilters={{
                    assoIds: user?.assoId ? [user.assoId] : []
                }}
                paramMapper={(params) => {
                    const { filters, ...rest } = params;
                    const baseParams = {
                        ...rest,
                        // On injecte l'ID de l'utilisateur connecté pour filtrer ses propres objets
                        userId: user?.userId,
                        // On passe les listes de filtres sélectionnés
                        assoIds: filters?.assoIds,
                        workflowStatusGroupCodes: filters?.statusGroupCodes,
                        // Note: On peut conserver assoId (singulier) pour la compatibilité avec certains hooks
                        assoId: (filters?.assoIds?.length > 0) ? filters.assoIds[0] : user?.assoId
                    };
                    // Permet une personnalisation supplémentaire via la prop paramMapper
                    return paramMapper ? paramMapper(baseParams, user, filters) : baseParams;
                }}
                getRowId={(row) => row.id || row.uuid || row.demandeId}
                {...props}
            />
        </Box>
    );
};

UserWorkflowObjectsList.propTypes = {
    workflowCode: PropTypes.string.isRequired,
    objectType: PropTypes.string.isRequired,
    queryHook: PropTypes.func.isRequired,
    columns: PropTypes.array.isRequired,
    onView: PropTypes.func,
    onEdit: PropTypes.func,
    paramMapper: PropTypes.func,
    title: PropTypes.string,
    queryKeyToInvalidate: PropTypes.oneOfType([PropTypes.string, PropTypes.array])
};

export default UserWorkflowObjectsList;
