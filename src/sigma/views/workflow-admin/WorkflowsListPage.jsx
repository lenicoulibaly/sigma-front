import React, { useState, useRef } from 'react';
import { Chip, Paper, Box, Typography, Stack } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ListIcon from '@mui/icons-material/List';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useGenericListController, GenericListFilters, GenericDataTable, GenericListPagination } from 'src/sigma/components/commons/GenericSearchablePaginatedList';
import FloatingAlert from 'src/sigma/components/commons/FloatingAlert';
import { useSearchWorkflows, useUpdateWorkflow, useDeleteWorkflow } from 'sigma/hooks/query/useWorkflow';
import { useNavigate, useLocation } from 'react-router-dom';
import WorkflowFormDialog from './WorkflowFormDialog';

export default function WorkflowsListPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Create/Edit dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  // Feedback alert state
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('info');

  // Mutations
  const updateWorkflow = useUpdateWorkflow();
  const deleteWorkflow = useDeleteWorkflow();

  // Restore state from location
  const restoreState = location.state?.restore;

  // Controller for list management with initial restoration
  const controller = useGenericListController({
    queryHook: useSearchWorkflows,
    dropdownFilters: [
      {
        name: 'activeFilter',
        label: 'Statut',
        options: [
          { value: null, label: 'Tous' },
          { value: true, label: 'Actifs' },
          { value: false, label: 'Inactifs' }
        ],
        multi: false
      }
    ],
    paramMapper: ({ page, size, search, filters }) => ({
      page,
      size,
      key: search || undefined,
      active: filters?.activeFilter
    }),
    initialPage: restoreState?.page ?? 0,
    initialPageSize: restoreState?.size ?? 10
  });

  // Ref to track if restoration has been done
  const restoredRef = useRef(false);

  // Restore search and filters on mount if coming back from details
  React.useEffect(() => {
    if (!restoredRef.current && restoreState) {
      if (restoreState.search !== undefined) {
        controller.setSearch(restoreState.search);
      }
      if (restoreState.filters) {
        Object.entries(restoreState.filters).forEach(([name, value]) => {
          controller.setFilterValue(name, value);
        });
      }
      restoredRef.current = true;
    }
  }, [restoreState]);

  const handleCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const handleEdit = (item) => {
    setEditing(item);
    setDialogOpen(true);
  };

  const handleNavigateToDetails = (row, tabIndex) => {
    const listParams = {
      page: controller.page,
      size: controller.size,
      search: controller.search,
      filters: controller.filters
    };
    navigate(`/admin/workflows/${row.id}`, { state: { tabIndex, listParams } });
  };

  const dropdownFilters = [
    {
      name: 'activeFilter',
      label: 'Statut',
      options: [
        { value: null, label: 'Tous' },
        { value: true, label: 'Actifs' },
        { value: false, label: 'Inactifs' }
      ],
      multi: false
    }
  ];

  const columns = [
    { header: 'Code', field: 'code' },
    { header: 'Libellé', field: 'libelle', width: '40%' },
    { header: 'Table Cible', field: 'targetTableNameCode' },
    { header: 'Actif', render: (row) => (row.active ? <Chip size="small" color="success" label="Actif" /> : <Chip size="small" color="default" label="Inactif" />) }
  ];

  const rowActions = [
    {
      label: 'Éditer',
      icon: <EditIcon fontSize="small" />,
      onClick: (row) => handleEdit(row)
    },
    {
      label: 'Ouvrir (Détails)',
      icon: <ListIcon fontSize="small" />,
      onClick: (row) => handleNavigateToDetails(row, 0)
    },
    {
      label: 'Statuts',
      icon: <ListIcon fontSize="small" />,
      onClick: (row) => handleNavigateToDetails(row, 1)
    },
    {
      label: 'Groupes de statuts',
      icon: <ListIcon fontSize="small" />,
      onClick: (row) => handleNavigateToDetails(row, 2)
    },
    {
      label: 'Transitions',
      icon: <ListIcon fontSize="small" />,
      onClick: (row) => handleNavigateToDetails(row, 3)
    },
    {
      label: 'Supprimer',
      icon: <DeleteOutlineIcon fontSize="small" />,
      confirm: {
        title: 'Confirmation',
        content: 'Supprimer ce workflow ? ',
        confirmBtnText: 'Supprimer',
        cancelBtnText: 'Annuler'
      },
      mutation: {
        mutate: deleteWorkflow.mutate,
        variablesMapper: (row) => row.id
      },
      successMessage: 'Workflow supprimé avec succès'
    }
  ];

  return (
    <>
      <Paper elevation={1}>
        <Box sx={{ px: 2, py: 2, borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>
          <Typography variant="h4">Gestion des workflows</Typography>
        </Box>

        <Box sx={{ p: 2 }}>
          <GenericListFilters
            search={controller.search}
            onSearchChange={controller.setSearch}
            searchLabel="Recherche (code, libellé)"
            searchPlaceholder="Saisir un ou plusieurs critères"
            dropdownFilters={dropdownFilters}
            filters={controller.filters}
            onFiltersChange={controller.setFilterValue}
            addButton={{ tooltip: 'Ajouter un workflow', onClick: handleCreate }}
          />

          <GenericDataTable
            columns={columns}
            rows={controller.rows}
            getRowId={(row) => row.id}
            rowActions={rowActions}
            isLoading={controller.isLoading}
            isError={controller.isError}
            error={controller.error}
          />

          <GenericListPagination
            totalPages={controller.totalPages}
            currentPage={controller.currentPage}
            onPageChange={controller.setPage}
            currentSize={controller.size}
            onSizeChange={controller.setSize}
            totalCount={controller.totalElements}
          />
        </Box>
      </Paper>

      {/* Create/Edit dialog */}
      <WorkflowFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        initialValues={editing}
        onSubmit={async (values) => {
          try {
            if (editing?.id) {
              await updateWorkflow.mutateAsync({ id: editing.id, payload: values });
              setAlertMessage('Workflow mis à jour avec succès');
            }
            setAlertSeverity('success');
            setAlertOpen(true);
            setDialogOpen(false);
          } catch (e) {
            const msg = e?.response?.data || e?.message || "Erreur lors de l\'enregistrement du workflow";
            setAlertMessage(msg);
            setAlertSeverity('error');
            setAlertOpen(true);
          }
        }}
      />

      {/* Floating feedback alert for mutations on this page */}
      <FloatingAlert
        open={alertOpen}
        feedBackMessages={alertMessage}
        severity={alertSeverity}
        onClose={() => setAlertOpen(false)}
      />
    </>
  );
}
