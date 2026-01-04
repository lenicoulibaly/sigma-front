import React from 'react';
import { Box, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { GenericListFilters, GenericDataTable, GenericListPagination } from 'src/sigma/components/commons/GenericSearchablePaginatedList';
import WorkflowStatusFormDialog from '../components/WorkflowStatusFormDialog';
import IconByName from 'src/sigma/components/commons/IconByName';

export default function StatusesTab({
  controller,
  addStep,
  onEditStep,
  onDeleteStep,
  stepDialogOpen,
  closeStepDialog,
  editingStep,
  submitStep,
}) {
  return (
    <Box>
      <GenericListFilters
        search={controller.search}
        onSearchChange={controller.setSearch}
        searchLabel="Rechercher un statut"
        dropdownFilters={[]}
        filters={{}}
        onFiltersChange={() => {}}
        addButton={{ tooltip: 'Ajouter un statut', onClick: addStep }}
      />

      <GenericDataTable
        columns={[
          { header: 'Ordre', field: 'ordre', width: 80 },
          { header: 'Statut', field: 'statusName', width: 250 },
          {
            header: 'Couleur',
            width: 100,
            render: (row) => (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 18, height: 18, borderRadius: '3px', bgcolor: row?.color || 'transparent', border: '1px solid', borderColor: (theme) => theme.palette.divider }} />
                <Typography variant="caption">{row?.color || ''}</Typography>
              </Box>
            )
          },
          {
            header: 'Icône',
            width: 80,
            render: (row) => (row?.icon ? <IconByName name={row.icon} fontSize="small" htmlColor={row?.color} sx={{ color: row?.color }} /> : null)
          },
          { header: 'Début', render: (row) => (row.start ? 'Oui' : 'Non'), width: 100 },
          { header: 'Fin', render: (row) => (row.end ? 'Oui' : 'Non'), width: 100 }
        ]}
        rows={controller.rows}
        getRowId={(row) => row.id ?? row.statusCode}
        rowActions={[
          { label: 'Modifier', icon: <EditIcon fontSize="small" />, onClick: (row) => onEditStep(row) },
          {
            label: 'Supprimer',
            icon: <DeleteIcon fontSize="small" />,
            onClick: (row) => onDeleteStep(row),
            confirm: {
              title: "Supprimer l'étape",
              content: 'Voulez-vous vraiment supprimer cette étape du workflow ? Cette action est irréversible.',
              confirmBtnText: 'Supprimer',
              cancelBtnText: 'Annuler'
            }
          }
        ]}
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

      {stepDialogOpen && (
        <WorkflowStatusFormDialog
          open={stepDialogOpen}
          onClose={closeStepDialog}
          initialValues={editingStep || {}}
          onSubmit={(vals) => submitStep(vals)}
        />
      )}
    </Box>
  );
}
