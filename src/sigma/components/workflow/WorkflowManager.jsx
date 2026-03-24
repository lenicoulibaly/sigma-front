import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  Tabs, 
  Tab, 
  Paper, 
  Divider, 
  Typography,
  Stack,
  Button
} from '@mui/material';
import WorkflowStepper from './WorkflowStepper';
import WorkflowHistoryTable from './WorkflowHistoryTable';
import ObjectDocumentsList from 'src/sigma/components/commons/ObjectDocumentsList';
import GeneralInfoDisplay from './GeneralInfoDisplay';
import StatusBadge from './StatusBadge';
import { useAvailableTransitions } from 'src/sigma/hooks/query/useWorkflow';
import { getTransitionComponent } from './TransitionExecCompRegistry';
import UnifiedActionDropdown from './UnifiedActionDropdown';
import useAuth from 'src/sigma/hooks/useAuth';

/**
 * WorkflowManager - Conteneur parent pour orchestrer la visualisation et les interactions du workflow.
 */
const WorkflowManager = ({ 
  workflow, 
  objectType, 
  objectId, 
  tableName,
  currentStatus, 
  generalInfoFields = [],
  onTransitionApplied,
  onEdit,
  onView,
  extraActions = [],
  availableTransitions: propTransitions,
  historyData,
  statuses,
  assoId: propAssoId,
  sectionId: propSectionId
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedTransition, setSelectedTransition] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { user } = useAuth();

  const assoId = propAssoId || user?.assoId;
  const sectionId = propSectionId || user?.sectionId;

  const workflowId = workflow?.id;
  const workflowCode = workflow?.code;

  const { data: queryTransitions = [] } = useAvailableTransitions(
    workflowCode, 
    objectType, 
    objectId,
    { enabled: !!workflowCode && !!objectId && !propTransitions }
  );

  const transitions = propTransitions || queryTransitions;

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleTransitionClick = (transition) => {
    setSelectedTransition(transition);
    setModalOpen(true);
  };

  const handleTransitionSuccess = () => {
    if (onTransitionApplied) {
      onTransitionApplied();
    }
  };

  return (
      <Box sx={{ width: '100%' }}>
          {/* Barre d'action et Statut Actuel */}
          <Paper sx={{ p: 2, mb: 2 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={2}>
                  <Stack direction="row" spacing={2} alignItems="center">
                      <Typography variant="subtitle1" fontWeight="bold">
                          Statut Actuel :
                      </Typography>
                      <StatusBadge status={currentStatus} sx={{ px: 2, py: 1, fontSize: '0.9rem' }} />
                  </Stack>

                  <Box>
                      <UnifiedActionDropdown
                          workflowCode={workflowCode}
                          objectType={objectType}
                          objectId={objectId}
                          onEdit={onEdit}
                          onView={onView}
                          extraActions={extraActions}
                          onTransitionApplied={handleTransitionSuccess}
                          availableTransitions={transitions}
                          assoId={assoId}
                          sectionId={sectionId}
                      />
                  </Box>
              </Stack>
          </Paper>

          {/* Workflow Stepper */}
          <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ mb: 2, color: 'text.secondary', fontWeight: 'bold' }}>
                  Cycle de vie de l'objet
              </Typography>
              <WorkflowStepper workflowId={workflowId} currentStatus={currentStatus} statuses={statuses} />
          </Paper>

          {/* Onglets de Détails */}
          <Paper sx={{ width: '100%' }}>
              <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Tab label="Informations Générales" />
                  <Tab label="Historique du cycle de vie" />
                  <Tab label="Pièces Jointes" />
              </Tabs>

              <Box sx={{ p: 2 }}>
                  {activeTab === 0 && <GeneralInfoDisplay fields={generalInfoFields} />}
                  {activeTab === 1 && <WorkflowHistoryTable objectType={objectType} objectId={objectId} data={historyData} />}
                  {activeTab === 2 && (
                      <ObjectDocumentsList
                          tableName={tableName || (workflowCode === 'DEMANDE_ADHESION_WF' ? 'DEMANDE_ADHESION' : objectType)}
                          objectId={objectId}
                      />
                  )}
              </Box>
          </Paper>

          {/* Modal d'exécution */}
          {selectedTransition && (
              React.createElement(getTransitionComponent(selectedTransition.transitionExecComponentCode), {
                  open: modalOpen,
                  handleClose: () => setModalOpen(false),
                  workflowCode: workflowCode,
                  objectType: objectType,
                  objectId: objectId,
                  transition: selectedTransition,
                  onSuccess: handleTransitionSuccess,
                  assoId: assoId,
                  sectionId: sectionId
              })
          )}
      </Box>
  );
};

WorkflowManager.propTypes = {
  workflow: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    code: PropTypes.string,
  }),
  objectType: PropTypes.string,
  objectId: PropTypes.string,
  tableName: PropTypes.string,
  currentStatus: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  generalInfoFields: PropTypes.array,
  onTransitionApplied: PropTypes.func,
  onEdit: PropTypes.func,
  onView: PropTypes.func,
  extraActions: PropTypes.array,
  availableTransitions: PropTypes.array,
  historyData: PropTypes.object,
  statuses: PropTypes.array,
  assoId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  sectionId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default WorkflowManager;
