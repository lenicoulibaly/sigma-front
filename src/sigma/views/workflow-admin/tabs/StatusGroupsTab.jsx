import React from 'react';
import { Box, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { GenericListFilters, GenericDataTable, GenericListPagination } from 'src/sigma/components/commons/GenericSearchablePaginatedList';
import WorkflowStatusGroupFormDialog from '../components/WorkflowStatusGroupFormDialog';

export default function StatusGroupsTab({
  controller,
  addGroup,
  onEditGroup,
  onDeleteGroup,
  groupDialogOpen,
  closeGroupDialog,
  editingGroup,
  submitGroup,
  workflowId,
}) {
  return (
    <Box>
      <GenericListFilters
        search={controller.search}
        onSearchChange={controller.setSearch}
        searchLabel="Rechercher un groupe"
        dropdownFilters={[]}
        filters={{}}
        onFiltersChange={() => {}}
        addButton={{ tooltip: 'Ajouter un groupe', onClick: addGroup }}
      />

      <GenericDataTable
        columns={[
          { header: 'Code', field: 'code', width: 150 },
          { header: 'Nom', field: 'name', width: '25%' },
          { header: 'Description', field: 'description', width: '35%' },
          {
            header: 'Couleur',
            width: 140,
            render: (row) => (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 18, height: 18, borderRadius: '3px', bgcolor: row?.color || 'transparent', border: '1px solid', borderColor: (theme) => theme.palette.divider }} />
                <Typography variant="caption">{row?.color || ''}</Typography>
              </Box>
            )
          },
          { header: 'Nb. statuts', render: (row) => Array.isArray(row.statusIds) ? row.statusIds.length : (row.statusCount ?? ''), width: 130 },
          { header: 'Nb. autorités', render: (row) => Array.isArray(row.authorityCodes) ? row.authorityCodes.length : (row.authoritiesCount ?? ''), width: 150 }
        ]}
        rows={controller.rows}
        getRowId={(row) => row.id}
        rowActions={[
          { label: 'Modifier', icon: <EditIcon fontSize="small" />, onClick: (row) => onEditGroup(row) },
          {
            label: 'Supprimer',
            icon: <DeleteIcon fontSize="small" />,
            onClick: (row) => onDeleteGroup(row),
            confirm: {
              title: 'Supprimer le groupe',
              content: 'Voulez-vous vraiment supprimer ce groupe de statuts ? Cette action est irréversible.',
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

      {groupDialogOpen && (
        <WorkflowStatusGroupFormDialog
          open={groupDialogOpen}
          onClose={closeGroupDialog}
          initialValues={editingGroup || {}}
          onSubmit={submitGroup}
          workflowId={workflowId}
        />
      )}
    </Box>
  );
}
