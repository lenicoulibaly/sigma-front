import React from 'react';
import { Box, Typography, TextField, Button, Stack } from '@mui/material';
import Modal from 'src/sigma/components/commons/Modal';
import PaymentIcon from '@mui/icons-material/Payment';

/**
 * PaymentFormTest - Un composant de test pour démontrer l'exécution dynamique d'une transition.
 */
const PaymentFormTest = ({ 
  open, 
  handleClose, 
  workflowCode, 
  objectId, 
  transition, 
  onSuccess 
}) => {
  const handlePay = () => {
    alert(`Paiement simulé pour l'objet ${objectId} (Workflow: ${workflowCode}, Transition: ${transition?.libelle})`);
    if (onSuccess) onSuccess();
    handleClose();
  };

  return (
    <Modal
      open={open}
      handleClose={handleClose}
      title={`Paiement : ${transition?.libelle || 'Transition'}`}
      handleConfirmation={handlePay}
      actionLabel="Payer maintenant"
      startIcon={<PaymentIcon />}
      width="sm"
    >
      <Box sx={{ p: 2 }}>
        <Stack spacing={3}>
          <Typography variant="body1">
            Ceci est un composant d'exécution de transition spécifique (Test de Paiement).
          </Typography>
          <TextField
            fullWidth
            label="Numéro de carte (Simulation)"
            placeholder="0000 0000 0000 0000"
          />
          <Stack direction="row" spacing={2}>
            <TextField label="MM/YY" sx={{ width: 100 }} />
            <TextField label="CVV" sx={{ width: 100 }} />
          </Stack>
          <Typography variant="caption" color="text.secondary">
            ID de l'objet : {objectId}
          </Typography>
        </Stack>
      </Box>
    </Modal>
  );
};

export default PaymentFormTest;
