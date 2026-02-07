import React from 'react';
import PropTypes from 'prop-types';
import { 
  Stepper, 
  Step, 
  StepLabel, 
  Box, 
  Typography, 
  CircularProgress,
  useTheme
} from '@mui/material';
import { useWorkflowStatuses } from 'src/sigma/hooks/query/useWorkflow';
import { formatLabel } from 'src/sigma/utilities/formatUtils';
import StatusBadge from './StatusBadge';

/**
 * WorkflowStepper - Une barre de progression visuelle pour situer l'objet dans son cycle de vie.
 * Utilise les statuts du workflow ordonnés par le champ 'ordre'.
 */
const WorkflowStepper = ({ workflowId, currentStatus, statuses: propStatuses }) => {
  const { data: queryStatuses = [], isLoading, isError } = useWorkflowStatuses(workflowId, {
    enabled: !!workflowId && !propStatuses
  });

  const statuses = propStatuses || queryStatuses;

  const theme = useTheme();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (isError || !statuses.length) {
    return null;
  }

  // Trier les statuts par ordre
  const sortedStatuses = [...statuses].sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
  
  // Trouver l'index du statut actuel
  const activeStep = sortedStatuses.findIndex(s => s.code === currentStatus?.code);

  return (
    <Box sx={{ width: '100%', py: 2 }}>
      <Stepper activeStep={activeStep} alternativeLabel>
        {sortedStatuses.map((status, index) => {
          const isCompleted = index < activeStep;
          const isActive = index === activeStep;
          
          return (
            <Step key={status.id} completed={isCompleted}>
              <StepLabel
                optional={
                  isActive && (
                    <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 0.5, color: status.color }}>
                      Actuel
                    </Typography>
                  )
                }
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: isActive ? 'bold' : 'normal',
                        color: isActive ? status.color : 'text.secondary'
                      }}
                    >
                      {formatLabel(status.libelle)}
                    </Typography>
                </Box>
              </StepLabel>
            </Step>
          );
        })}
      </Stepper>
    </Box>
  );
};

WorkflowStepper.propTypes = {
  workflowId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  statuses: PropTypes.array,
  currentStatus: PropTypes.shape({
    code: PropTypes.string,
    libelle: PropTypes.string,
    color: PropTypes.string,
  }),
};

export default WorkflowStepper;
