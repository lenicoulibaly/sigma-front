import React from 'react';
import { Box, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import BoltIcon from '@mui/icons-material/Bolt';
import { GenericListFilters, GenericDataTable, GenericListPagination } from 'src/sigma/components/commons/GenericSearchablePaginatedList';
import TransitionFormDialog from '../TransitionFormDialog';
import IconByName from 'src/sigma/components/commons/IconByName';

export default function TransitionsTab({
  controller,
  addTransition,
  onEditTransition,
  onShowRules,
  onShowSideEffects,
  onDeleteTransition,
  openTransitionDialog,
  closeTransitionDialog,
  editingTransition,
  transitionDefaultStep,
  submitTransition,
}) {
  return (
    <Box>
      <GenericListFilters
        search={controller.search}
        onSearchChange={controller.setSearch}
        searchLabel="Rechercher une transition (libellé, privilège)"
        dropdownFilters={[]}
        filters={{}}
        onFiltersChange={() => {}}
        addButton={{ tooltip: 'Ajouter une transition', onClick: addTransition }}
      />

      <GenericDataTable
        columns={[
          { header: 'Ordre', field: 'ordre', width: 60 },
          { header: 'Libellé', field: 'libelle', width: 250 },
          { header: 'Statut origine', field: 'statutOrigineName', width: 200 },
          { header: 'Statut destination (défaut)', field: 'defaultStatutDestinationName', width: 200 },
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
          }
        ]}
        rows={controller.rows}
        getRowId={(row) => row.transitionId ?? row.privilegeCode}
        rowActions={[
          { label: 'Modifier', icon: <EditIcon fontSize="small" />, onClick: (row) => onEditTransition(row) },
          { label: 'Voir les règles', icon: <FactCheckIcon fontSize="small" />, onClick: (row) => onShowRules(row) },
          { label: 'Voir les effets de bord', icon: <BoltIcon fontSize="small" />, onClick: (row) => onShowSideEffects(row) },
          {
            label: 'Supprimer',
            icon: <DeleteIcon fontSize="small" />,
            onClick: (row) => onDeleteTransition(row),
            confirm: {
              title: 'Supprimer la transition',
              content: 'Voulez-vous vraiment supprimer cette transition ? Cette action est irréversible.',
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

      <TransitionFormDialog
        open={openTransitionDialog}
        onClose={closeTransitionDialog}
        initialValues={editingTransition}
        defaultStep={transitionDefaultStep}
        onSubmit={submitTransition}
      />
    </Box>
  );
}
