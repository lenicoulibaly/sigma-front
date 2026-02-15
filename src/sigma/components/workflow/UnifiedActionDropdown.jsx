import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { 
  IconButton, 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  ListItemText, 
  Tooltip, 
  Divider,
  CircularProgress
} from '@mui/material';
import { 
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import IconByName from 'src/sigma/components/commons/IconByName';
import { useAvailableTransitions } from 'src/sigma/hooks/query/useWorkflow';
import { formatLabel } from 'src/sigma/utilities/formatUtils';
import TransitionExecutionModal from './TransitionExecutionModal';
import useAuth from 'src/sigma/hooks/useAuth';

/**
 * UnifiedActionDropdown - Menu contextuel combinant actions statiques et transitions de workflow.
 */
const UnifiedActionDropdown = ({ 
  workflowCode, 
  objectType, 
  objectId, 
  onEdit, 
  onView, 
  extraActions = [],
  onTransitionApplied,
  availableTransitions: propTransitions,
  assoId: propAssoId,
  sectionId: propSectionId
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTransition, setSelectedTransition] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { user } = useAuth();

  const assoId = propAssoId || user?.assoId;
  const sectionId = propSectionId || user?.sectionId;

  const open = Boolean(anchorEl);

  const { data: queryTransitions = [], isLoading: loadingTransitions } = useAvailableTransitions(
    workflowCode, 
    objectType, 
    objectId,
    { enabled: open && !propTransitions }
  );
  const transitions = propTransitions || queryTransitions;

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleTransitionClick = (transition) => {
    setSelectedTransition(transition);
    setModalOpen(true);
    handleClose();
  };

  return (
    <>
      <Tooltip title="Actions">
        <IconButton onClick={handleClick} size="small">
          <MoreVertIcon />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {onView && (
          <MenuItem onClick={() => { onView(); handleClose(); }}>
            <ListItemIcon><VisibilityIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Consulter</ListItemText>
          </MenuItem>
        )}
        {onEdit && (
          <MenuItem onClick={() => { onEdit(); handleClose(); }}>
            <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Modifier</ListItemText>
          </MenuItem>
        )}

        {extraActions.map((action, index) => (
          <MenuItem key={index} onClick={() => { action.onClick(); handleClose(); }}>
            <ListItemIcon>{action.icon}</ListItemIcon>
            <ListItemText>{action.label}</ListItemText>
          </MenuItem>
        ))}

        {(onView || onEdit || extraActions.length > 0) && transitions.length > 0 && <Divider />}

        {loadingTransitions ? (
          <MenuItem disabled>
            <ListItemIcon><CircularProgress size={20} /></ListItemIcon>
            <ListItemText>Chargement des transitions...</ListItemText>
          </MenuItem>
        ) : (
          transitions
            .filter((t) => t.visible !== false)
            .map((t, index) => {
              const tId = t.transitionId || t.id || index;
              const label = t.libelle || t.label || 'Action';
              return (
                <MenuItem key={tId} onClick={() => handleTransitionClick(t)}>
                  <ListItemIcon>
                    <IconByName 
                      name={t.icon} 
                      fontSize="small" 
                      sx={{ color: t.color || 'primary.main' }} 
                    />
                  </ListItemIcon>
                  <ListItemText sx={{ color: t.color || 'primary.main' }}>
                    {formatLabel(label)}
                  </ListItemText>
                </MenuItem>
              );
            })
        )}
      </Menu>

      {selectedTransition && (
        <TransitionExecutionModal
          open={modalOpen}
          handleClose={() => setModalOpen(false)}
          workflowCode={workflowCode}
          objectType={objectType}
          objectId={objectId}
          transition={selectedTransition}
          onSuccess={onTransitionApplied}
          assoId={assoId}
          sectionId={sectionId}
        />
      )}
    </>
  );
};

UnifiedActionDropdown.propTypes = {
  workflowCode: PropTypes.string.isRequired,
  objectType: PropTypes.string.isRequired,
  objectId: PropTypes.string.isRequired,
  onEdit: PropTypes.func,
  onView: PropTypes.func,
  extraActions: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    icon: PropTypes.node,
    onClick: PropTypes.func.isRequired,
  })),
  availableTransitions: PropTypes.array,
  assoId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  sectionId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default UnifiedActionDropdown;
