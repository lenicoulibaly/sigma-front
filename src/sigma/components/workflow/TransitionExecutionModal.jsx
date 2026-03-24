import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  TextField, 
  Typography, 
  CircularProgress, 
  Alert,
  Stack
} from '@mui/material';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import Modal from 'src/sigma/components/commons/Modal';
import FloatingAlert from 'src/sigma/components/commons/FloatingAlert';
import { 
  useTransitionValidationConfig, 
  useApplyTransition 
} from 'src/sigma/hooks/query/useWorkflow';
import { formatLabel } from 'src/sigma/utilities/formatUtils';
import TransitionDocumentUpload, { emptyDocumentRow } from 'src/sigma/components/workflow/TransitionDocumentUpload';
import { IFrameModal } from 'src/sigma/components/commons/IFrameModal';

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
  const [documents, setDocuments] = useState([emptyDocumentRow()]);
  const [feedback, setFeedback] = useState({ open: false, messages: [], severity: 'success' });

  // Viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerBase64, setViewerBase64] = useState('');
  const [viewerMime, setViewerMime] = useState('application/pdf');
  const [viewerTitle, setViewerTitle] = useState('');

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
      setDocuments([emptyDocumentRow()]);
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

      // Validation des pièces jointes
      const validDocuments = documents.filter(d => d.file);
      
      const invalidDocs = validDocuments.filter(d => !d.docTypeCode);
      if (invalidDocs.length > 0) {
        setFeedback({
          open: true,
          messages: ["Veuillez sélectionner un type pour chaque fichier."],
          severity: 'error'
        });
        return;
      }

      if (config?.requiredDocTypeCodes?.length > 0) {
        const providedTypes = validDocuments.map(d => d.docTypeCode);
        const missingTypes = config.requiredDocTypeCodes.filter(code => !providedTypes.includes(code));
        if (missingTypes.length > 0) {
          setFeedback({
            open: true,
            messages: ["Certains types de documents obligatoires sont manquants."],
            severity: 'error'
          });
          return;
        }
      }

      const files = validDocuments.map(d => d.file);
      const fileTypes = validDocuments.map(d => d.docTypeCode);
      const fileDescriptions = validDocuments.map(d => d.docDescription || '');

      const request = {
        transitionId,
        comment: comment || undefined,
        workflowCode,
        context: {
          assoId,
          sectionId
        },
        fileDescriptions
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

  const blobToBase64 = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result || '';
      const base64 = typeof result === 'string' ? result.split(',')[1] : '';
      resolve(base64 || '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  const handlePreview = async (row) => {
    if (!row.file) return;
    try {
      const base64 = await blobToBase64(row.file);
      setViewerBase64(base64);
      setViewerMime(row.file.type);
      setViewerTitle(row.file.name || 'Aperçu du document');
      setViewerOpen(true);
    } catch (error) {
      setFeedback({
        open: true,
        messages: ["Impossible de prévisualiser ce fichier"],
        severity: 'error'
      });
    }
  };

  return (
    <>
      <Modal
        open={open}
        handleClose={handleClose}
        title={`${formatLabel(transition?.libelle) || ''}`}
        handleConfirmation={handleExecute}
        actionLabel="Exécuter"
        triggerIcon={null}
        startIcon={<FlashOnIcon />}
        actionDisabled={isExecuting || loadingConfig}

        width="md"
      >
        <Box sx={{ minHeight: 100, py: 1 }}>
          {loadingConfig ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : configError ? (
            <Alert severity="error">Erreur lors du chargement de la configuration de la transition.</Alert>
          ) : (
            <Stack spacing={3}>
              <TextField
                label="Commentaire"
                fullWidth
                multiline
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required={config?.commentRequired}
                error={config?.commentRequired && !comment.trim()}
                helperText={config?.commentRequired && !comment.trim() ? "Ce champ est obligatoire" : ""}
                placeholder="Saisissez un commentaire..."
                disabled={isExecuting}
              />

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Pièces jointes {config?.requiredDocTypeCodes && config.requiredDocTypeCodes.length > 0 && <span style={{ color: 'red' }}>*</span>}
                </Typography>
                <TransitionDocumentUpload 
                  documents={documents}
                  setDocuments={setDocuments}
                  onPreview={handlePreview}
                />
              </Box>
            </Stack>
          )}
        </Box>
      </Modal>

      <IFrameModal
        opened={viewerOpen}
        handleClose={() => setViewerOpen(false)}
        title={viewerTitle}
        base64String={viewerBase64}
        mimeType={viewerMime}
      />

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
