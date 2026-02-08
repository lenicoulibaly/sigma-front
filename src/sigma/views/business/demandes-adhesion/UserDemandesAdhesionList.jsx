import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Stack } from '@mui/material';
import UserWorkflowObjectsList from 'src/sigma/components/workflow/UserWorkflowObjectsList';
import { useSearchUserDemandesAdhesion } from 'src/sigma/hooks/query/useDemandeAdhesion';
import StatusBadge from 'src/sigma/components/workflow/StatusBadge';

/**
 * Exemple d'utilisation du composant UserWorkflowObjectsList pour les demandes d'adhésion de l'utilisateur.
 */
const UserDemandesAdhesionList = () => {
    const navigate = useNavigate();

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
            header: 'Association',
            field: 'associationNom'
        },
        {
            header: 'Date Demande',
            field: 'dateCreation',
            render: (row) => (row.dateCreation ? new Date(row.dateCreation).toLocaleDateString('fr-FR') : '-')
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
        <UserWorkflowObjectsList
            title="Mes demandes d'adhésion"
            workflowCode="DMD_ADH"
            objectType="DemandeAdhesion"
            queryHook={useSearchUserDemandesAdhesion}
            columns={columns}
            onView={handleNavigate}
            // L'invalidité de la query après une action de workflow est gérée par défaut via objectType
        />
    );
};

export default UserDemandesAdhesionList;
