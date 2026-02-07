import React from 'react';
import PropTypes from 'prop-types';
import { Chip } from '@mui/material';
import * as MuiIcons from '@mui/icons-material';
import { formatLabel } from 'src/sigma/utilities/formatUtils';

/**
 * StatusBadge - Un composant pour afficher un statut de workflow avec sa couleur et son icône.
 * Les métadonnées (libellé, couleur, icône) proviennent généralement du backend.
 */
const StatusBadge = ({ status, ...props }) => {
  if (!status) return null;

  // If status is a string, we treat it as the label with default styling
  const statusObj = typeof status === 'string' ? { libelle: status } : status;
  const { libelle, color, icon } = statusObj;

  // Récupération de l'icône MUI si elle existe
  const IconComponent = icon && MuiIcons[icon] ? MuiIcons[icon] : null;

  return (
    <Chip
      label={formatLabel(libelle)}
      size="small"
      icon={IconComponent ? <IconComponent fontSize="small" /> : undefined}
      style={{
        backgroundColor: color || undefined,
        color: color ? '#fff' : undefined // Fallback safe si contrastText échoue
      }}
      sx={{
        color: (theme) => (color ? theme.palette.getContrastText(color) : 'inherit'),
        fontWeight: 'bold',
        '& .MuiChip-icon': {
          color: 'inherit'
        },
        ...props.sx
      }}
      {...props}
    />
  );
};

StatusBadge.propTypes = {
  status: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({
      libelle: PropTypes.string,
      color: PropTypes.string,
      icon: PropTypes.string,
    })
  ]),
};

export default StatusBadge;
