import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Tabs, Tab, Box, CircularProgress, Paper } from '@mui/material';
import { useAccessibleWorkflowStatusGroups } from 'src/sigma/hooks/query/useWorkflow';
import { formatLabel } from 'src/sigma/utilities/formatUtils';

/**
 * WorkflowStatusTabsList - Génère dynamiquement des onglets basés sur les WorkflowStatusGroups.
 * Permet de filtrer une liste d'objets selon le groupe sélectionné.
 */
const WorkflowStatusTabsList = ({ workflowCode, onGroupChange, defaultGroupId, checkGroupEmpty }) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [isFiltering, setIsFiltering] = useState(false);
  
  const { data: groups = [], isLoading } = useAccessibleWorkflowStatusGroups(
    workflowCode,
    { enabled: !!workflowCode }
  );

  useEffect(() => {
    const filterGroups = async () => {
      if (groups.length > 0) {
        if (typeof checkGroupEmpty === 'function') {
          setIsFiltering(true);
          try {
            const results = await Promise.all(
              groups.map(async (group) => {
                if (group.code === 'BROUIL') {
                  const isEmpty = await checkGroupEmpty(group);
                  return isEmpty ? null : group;
                }
                return group;
              })
            );
            const filtered = results.filter((g) => g !== null);
            setFilteredGroups(filtered);
          } catch (error) {
            console.error('Error filtering groups:', error);
            setFilteredGroups(groups);
          } finally {
            setIsFiltering(false);
          }
        } else {
          setFilteredGroups(groups);
        }
      } else if (!isLoading) {
        setFilteredGroups([]);
      }
    };

    if (!isLoading) {
      filterGroups();
    }
  }, [groups, isLoading, checkGroupEmpty]);

  useEffect(() => {
    if (!isLoading && !isFiltering && isInitialLoad) {
      if (filteredGroups.length > 0) {
        let index = 0;
        if (defaultGroupId) {
          const foundIndex = filteredGroups.findIndex((g) => g.id === defaultGroupId);
          if (foundIndex !== -1) {
            index = foundIndex;
          }
        }

        setSelectedTab(index);
        if (typeof onGroupChange === 'function') {
          onGroupChange(filteredGroups[index]);
        }
        setIsInitialLoad(false);
      } else if (groups.length === 0 && !isLoading) {
        setIsInitialLoad(false);
      }
    }
  }, [filteredGroups, groups, defaultGroupId, onGroupChange, isInitialLoad, isLoading, isFiltering]);

  const handleChange = (event, newValue) => {
    setSelectedTab(newValue);
    if (typeof onGroupChange === 'function') {
      onGroupChange(filteredGroups[newValue]);
    }
  };

  if (isLoading || isFiltering) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 1 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (filteredGroups.length === 0) {
    return null;
  }

  return (
    <Paper sx={{ width: '100%', mb: 2 }}>
      <Tabs
        value={selectedTab}
        onChange={handleChange}
        indicatorColor="primary"
        textColor="primary"
        variant="scrollable"
        scrollButtons="auto"
      >
        {filteredGroups.map((group) => (
          <Tab 
            key={group.id} 
            label={formatLabel(group.name)}
          />
        ))}
      </Tabs>
    </Paper>
  );
};

WorkflowStatusTabsList.propTypes = {
  workflowCode: PropTypes.string.isRequired,
  onGroupChange: PropTypes.func.isRequired,
  defaultGroupId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  checkGroupEmpty: PropTypes.func,
};

export default WorkflowStatusTabsList;
