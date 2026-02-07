import React, { useState } from 'react';
import { Box, Typography, Paper, Divider, Stack, Alert } from '@mui/material';
import WorkflowManager from 'src/sigma/components/workflow/WorkflowManager';
import WorkflowStatusTabsList from 'src/sigma/components/workflow/WorkflowStatusTabsList';
import StatusBadge from 'src/sigma/components/workflow/StatusBadge';
import { useWorkflows } from 'src/sigma/hooks/query/useWorkflow';

/**
 * Page de démonstration pour les composants de workflow.
 * Note: Cette page nécessite que le backend soit configuré avec au moins un workflow
 * et un objet existant pour être pleinement fonctionnelle avec des données réelles.
 */
const WorkflowComponentsDemo = () => {
    const { data: workflows = [] } = useWorkflows();
    
    // Données fictives complètes pour la démo si le backend n'a rien
    const mockStatuses = [
        { id: 1, code: 'DRAFT', libelle: 'Brouillon', color: '#808080', ordre: 1 },
        { id: 2, code: 'PENDING_VALIDATION', libelle: 'En attente de validation', color: '#ff9800', ordre: 2 },
        { id: 3, code: 'VALIDATED', libelle: 'Validé', color: '#4caf50', ordre: 3 },
        { id: 4, code: 'REJECTED', libelle: 'Rejeté', color: '#f44336', ordre: 4 }
    ];

    const mockCurrentStatus = mockStatuses[1]; // En attente de validation

    const mockTransitions = [
        { transitionId: 101, code: 'APPROVE', libelle: 'Approuver', fromStatusCode: 'PENDING_VALIDATION', toStatusCode: 'VALIDATED' },
        { transitionId: 102, code: 'REJECT', libelle: 'Rejeter', fromStatusCode: 'PENDING_VALIDATION', toStatusCode: 'REJECTED' }
    ];

    const mockHistory = {
        content: [
            { 
                id: 1, 
                createdAt: new Date(Date.now() - 86400000).toISOString(), 
                fromStatus: mockStatuses[0], 
                toStatus: mockStatuses[1], 
                transitionLibelle: 'Soumettre pour validation', 
                createdBy: 'Jean Dupont', 
                comment: 'Dossier complet, prêt pour revue.' 
            },
            { 
                id: 0, 
                createdAt: new Date(Date.now() - 172800000).toISOString(), 
                fromStatus: null, 
                toStatus: mockStatuses[0], 
                transitionLibelle: 'Création', 
                createdBy: 'Système', 
                comment: 'Initialisation de l\'objet.' 
            }
        ],
        totalElements: 2
    };

    const demoConfig = {
        workflowCode: workflows[0]?.code || 'DEMO_WF',
        objectType: 'ASSOCIATION',
        objectId: '1'
    };

    return (
        <Box p={3}>
            <Typography variant="h2" gutterBottom>
                Démonstration des Composants de Workflow
            </Typography>
            <Typography variant="body1" sx={{ mb: 4 }}>
                Cette page présente les composants génériques "Metadata-Driven" développés pour l'intégration du moteur de workflow.
            </Typography>

            <Alert severity="info" sx={{ mb: 4 }}>
                Cette page utilise des données fictives pour illustrer le rendu visuel complet des composants de workflow 
                (Statut, Stepper, Boutons d'action, Informations générales et Historique).
            </Alert>

            <Stack spacing={4}>
                {/* 1. Workflow Status Tabs List */}
                <Paper sx={{ p: 2 }}>
                    <Typography variant="h4" gutterBottom color="primary">
                        1. WorkflowStatusTabsList
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Génère dynamiquement des onglets basés sur les groupes de statuts définis dans le backend.
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <WorkflowStatusTabsList 
                        workflowCode={demoConfig.workflowCode} 
                        onGroupChange={(group) => console.log('Group changed:', group)}
                    />
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                        <Typography variant="caption" display="block">
                            Usage: <code>{`<WorkflowStatusTabsList workflowCode="${demoConfig.workflowCode}" />`}</code>
                        </Typography>
                    </Box>
                </Paper>

                {/* 2. Workflow Manager (Stepper + General Info + History) */}
                <Paper sx={{ p: 2 }}>
                    <Typography variant="h4" gutterBottom color="primary">
                        2. WorkflowManager (Composant Orchestrateur)
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Regroupe le <code>WorkflowStepper</code>, les informations générales, l'historique et les actions de transition.
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <WorkflowManager 
                        workflow={{ code: demoConfig.workflowCode }}
                        objectType={demoConfig.objectType}
                        tableName={demoConfig.objectType}
                        objectId={demoConfig.objectId}
                        currentStatus={mockCurrentStatus}
                        availableTransitions={mockTransitions}
                        historyData={mockHistory}
                        statuses={mockStatuses}
                        generalInfoFields={[
                            { label: 'Nom de l\'objet', value: 'Exemple de structure' },
                            { label: 'Date de création', value: '01/01/2026' },
                            { label: 'Responsable', value: 'Jean Dupont' }
                        ]}
                        onEdit={() => alert('Action Modifier cliquée')}
                        onView={() => alert('Action Consulter cliquée')}
                    />
                </Paper>

                {/* 3. Status Badge Utility */}
                <Paper sx={{ p: 2 }}>
                    <Typography variant="h4" gutterBottom color="primary">
                        3. StatusBadge
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Composant de rendu simple pour afficher un statut avec sa couleur et son icône backend.
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Stack direction="row" spacing={2}>
                        <StatusBadge status={{ libelle: 'Brouillon', color: '#808080' }} />
                        <StatusBadge status={{ libelle: 'En attente', color: '#ff9800' }} />
                        <StatusBadge status={{ libelle: 'Validé', color: '#4caf50' }} />
                        <StatusBadge status={{ libelle: 'Rejeté', color: '#f44336' }} />
                    </Stack>
                </Paper>
            </Stack>
        </Box>
    );
};

export default WorkflowComponentsDemo;
