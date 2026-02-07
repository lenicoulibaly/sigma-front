import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Grid, Paper } from '@mui/material';

/**
 * InfoField - Un petit composant pour afficher un couple libellé/valeur de manière attrayante.
 */
const InfoField = ({ label, value, color }) => (
  <Box sx={{ mb: 1.5 }}>
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 'bold', textTransform: 'uppercase', mb: 0.2 }}>
      {label}
    </Typography>
    <Typography variant="body1" sx={{ color: color || 'text.primary', fontWeight: 500 }}>
      {value || '-'}
    </Typography>
  </Box>
);

/**
 * GeneralInfoDisplay - Composant réutilisable pour la présentation des informations générales.
 */
const GeneralInfoDisplay = ({ fields, columns = 2 }) => {
  return (
    <Box sx={{ p: 1 }}>
      <Grid container spacing={2}>
        {fields.map((field, index) => (
          <Grid item xs={12} sm={12 / columns} key={index}>
            <InfoField 
              label={field.label} 
              value={field.value} 
              color={field.color} 
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

GeneralInfoDisplay.propTypes = {
  fields: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    value: PropTypes.node,
    color: PropTypes.string,
  })).isRequired,
  columns: PropTypes.number,
};

export default GeneralInfoDisplay;
