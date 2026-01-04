import React from 'react';
import MainCard from 'ui-component/cards/MainCard';
import WorkflowsListPage from './WorkflowsListPage';

// Wrapper page to integrate Workflows list similarly to Users management index.jsx
// Provides a MainCard container and delegates the list + actions to WorkflowsListPage
const WorkflowsManagement = () => {
  return (
      <WorkflowsListPage />
  );
};

export default WorkflowsManagement;
