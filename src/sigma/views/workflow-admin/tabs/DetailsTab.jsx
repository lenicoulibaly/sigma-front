import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function DetailsTab({ loading, workflow }) {
  if (loading) {
    return (
      <Box p={2} textAlign="center">
        <CircularProgress size={24} />
      </Box>
    );
  }
  if (!workflow) return null;
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="subtitle1">Code: {workflow.code}</Typography>
      <Typography variant="subtitle1">Libellé: {workflow.libelle}</Typography>
      <Typography variant="subtitle1">Table cible: {workflow.targetTableNameCode}</Typography>
      <Typography variant="subtitle1">Actif: {workflow.active ? 'Oui' : 'Non'}</Typography>
    </Box>
  );
}
