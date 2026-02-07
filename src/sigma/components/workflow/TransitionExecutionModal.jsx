import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  TextField, 
  Typography, 
  CircularProgress, 
  Alert,
  Stack,
  Divider
} from '@mui/material';
import Modal from 'src/sigma/components/commons/Modal';
import FloatingAlert from 'src/sigma/components/commons/FloatingAlert';
import { 
  useTransitionValidationConfig, 
  useApplyTransition 
} from 'src/sigma/hooks/query/useWorkflow';
import { formatLabel } from 'src/sigma/utilities/formatUtils';
import UploadWithTypes from 'src/sigma/components/workflow-admin/UploadWithTypes';

/**
 * TransitionExecutionModal - Modal permettant de saisir les informations requises pour une transition
 * et de l'exécuter. Génère le formulaire selon la configuration de validation.
 */
const TransitionExecutionModal = ({ 
  open, 
  handleClose, 
  workflowCode, 
  objectType, 
  objectId, 
  transition, 
  onSuccess,
  assoId,
  sectionId
}) => {
  const [comment, setComment] = useState('');
  const [files, setFiles] = useState([]);
  const [fileTypes, setFileTypes] = useState([]);
  const [feedback, setFeedback] = useState({ open: false, messages: [], severity: 'success' });

  const transitionId = transition?.transitionId || transition?.id;
  
  const { 
    data: config, 
    isLoading: loadingConfig, 
    error: configError 
  } = useTransitionValidationConfig(transitionId, { 
    enabled: open && !!transitionId 
  });

  const applyTransitionMutation = useApplyTransition();

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setComment('');
      setFiles([]);
      setFileTypes([]);
    }
  }, [open]);

  const handleExecute = async () => {
    try {
      // Validation basique côté client
      if (config?.commentRequired && !comment.trim()) {
        setFeedback({
          open: true,
          messages: ["Le commentaire est obligatoire pour cette transition."],
          severity: 'error'
        });
        return;
      }

      const request = {
        transitionId,
        comment: comment || undefined,
        workflowCode,
        context: {
          assoId,
          sectionId
        }
      };

      await applyTransitionMutation.mutateAsync({
        workflowCode,
        objectType,
        objectId,
        transitionId,
        request,
        files,
        fileTypes
      });

      setFeedback({
        open: true,
        messages: ["Transition appliquée avec succès !"],
        severity: 'success'
      });

      if (onSuccess) onSuccess();
      setTimeout(handleClose, 1500);
    } catch (error) {
      const errorMsg = error?.response?.data?.message || error?.message || "Erreur lors de l'exécution de la transition";
      setFeedback({
        open: true,
        messages: [errorMsg],
        severity: 'error'
      });
    }
  };

  const isExecuting = applyTransitionMutation.isLoading;

  const hasFields = config?.commentRequired || (config?.requiredDocTypeCodes && config.requiredDocTypeCodes.length > 0);

  return (
    <>
      <Modal
        open={open}
        handleClose={handleClose}
        title={`Exécuter la transition : ${formatLabel(transition?.libelle) || ''}`}
        handleConfirmation={handleExecute}
        actionLabel="Valider"
        actionDisabled={isExecuting || loadingConfig}
        width={hasFields ? "md" : "sm"}
      >
        <Box sx={{ minHeight: hasFields ? 100 : 'auto', py: 1 }}>
          {loadingConfig ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : configError ? (
            <Alert severity="error">Erreur lors du chargement de la configuration de la transition.</Alert>
          ) : (
            <Stack spacing={hasFields ? 3 : 1}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Détails de la transition
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Vous allez passer l'objet à l'étape suivante : <strong>{formatLabel(transition?.toStatus?.libelle) || 'N/A'}</strong>
                </Typography>
              </Box>

              {hasFields && <Divider />}

              {config?.commentRequired && (
                <TextField
                  label="Commentaire"
                  fullWidth
                  multiline
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required={config?.commentRequired}
                  error={config?.commentRequired && !comment.trim()}
                  helperText={config?.commentRequired ? "Ce champ est obligatoire" : ""}
                  placeholder="Saisissez un commentaire..."
                  disabled={isExecuting}
                />
              )}

              {config?.requiredDocTypeCodes && config.requiredDocTypeCodes.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Pièces jointes
                  </Typography>
                  <UploadWithTypes 
                    files={files} 
                    setFiles={setFiles} 
                    fileTypes={fileTypes} 
                    setFileTypes={setFileTypes} 
                  />
                </Box>
              )}
            </Stack>
          )}
        </Box>
      </Modal>

      <FloatingAlert
        open={feedback.open}
        feedBackMessages={feedback.messages}
        severity={feedback.severity}
        onClose={() => setFeedback({ ...feedback, open: false })}
      />
    </>
  );
};

TransitionExecutionModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  workflowCode: PropTypes.string.isRequired,
  objectType: PropTypes.string.isRequired,
  objectId: PropTypes.string.isRequired,
  transition: PropTypes.object,
  onSuccess: PropTypes.func,
  assoId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  sectionId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default TransitionExecutionModal;
