import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Stack } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import UserWorkflowObjectsList from 'src/sigma/components/workflow/UserWorkflowObjectsList';
import { useSearchUserDemandesAdhesion } from 'src/sigma/hooks/query/useDemandeAdhesion';
import StatusBadge from 'src/sigma/components/workflow/StatusBadge';
import useAuth from 'src/sigma/hooks/useAuth';
import RegisterUserWizard from 'src/sigma/views/business/adhesions/RegisterUserWizard';

/**
 * Exemple d'utilisation du composant UserWorkflowObjectsList pour les demandes d'adhésion de l'utilisateur.
 */
const UserDemandesAdhesionList = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const [modalState, setModalState] = useState({ open: false, row: null });

    const handleNavigate = (row) => {
        const id = row.demandeId || row.id;
        navigate('/business/demandes-adhesion/' + String(id || ''), { state: { row } });
    };

    const handleEdit = (row) => {
        setModalState({ open: true, row });
    };

    const handleCloseModal = () => {
        setModalState({ open: false, row: null });
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
            field: 'motifStatut'
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
        }
    ];

    return (
        <>
            <UserWorkflowObjectsList
                title="Mes demandes d'adhésion"
                workflowCode="DMD_ADH"
                objectType="DemandeAdhesion"
                queryHook={useSearchUserDemandesAdhesion}
                columns={columns}
                onView={handleNavigate}
                getRowId={(row) => row.demandeId || row.id}
                onEdit={(row, currentUser) => {
                    // Si currentUser est passé, c'est l'appel de rendu pour vérifier les droits
                    if (currentUser) {
                        const canEdit = row.demandeurId === currentUser?.userId && ['BROUIL', 'AJRN'].includes(row.statutCode);
                        return canEdit;
                    }
                    // Si pas de currentUser, c'est l'appel au clic
                    handleEdit(row);
                }}
                queryKeyToInvalidate={['demandes-adhesion']}
            />
            <RegisterUserWizard
                open={modalState.open}
                handleClose={handleCloseModal}
                mode="edit"
                row={modalState.row}
                onRegistered={() => {
                    queryClient.invalidateQueries({ queryKey: ['demandes-adhesion'] });
                }}
            />
        </>
    );
};

export default UserDemandesAdhesionList;
