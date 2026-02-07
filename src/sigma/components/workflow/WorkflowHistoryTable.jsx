import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Typography } from '@mui/material';
import { useWorkflowHistory } from 'src/sigma/hooks/query/useWorkflow';
import { GenericListFilters, GenericDataTable, GenericListPagination } from 'src/sigma/components/commons/GenericSearchablePaginatedList';
import StatusBadge from './StatusBadge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * WorkflowHistoryTable - Tableau paginé affichant l'historique des transitions d'un objet.
 */
const WorkflowHistoryTable = ({ objectType, objectId, data: propData }) => {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [search, setSearch] = useState('');

  const { data: queryData, isLoading } = useWorkflowHistory(objectType, objectId, {
    key: search,
    page,
    size
  }, {
    enabled: !!objectType && !!objectId && !propData
  });

  const data = propData || queryData;

  const columns = [
      {
          id: 'transitionDate',
          header: 'Date',
          render: (row) => (row.occurredAt ? format(new Date(row.occurredAt), 'dd/MM/yyyy HH:mm', { locale: fr }) : '-')
      },
      {
          id: 'fromStatus',
          header: 'Statut Initial',
          render: (row) => (row.fromStatus ? <StatusBadge status={row.fromStatus} /> : <i>Initial</i>)
      },
      {
          id: 'transition',
          header: 'Transition',
          render: (row) => (
              <Box>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {row.transitionLibelle || row.transitionCode}
                  </Typography>
              </Box>
          )
      },
      {
          id: 'toStatus',
          header: 'Statut Final',
          render: (row) => (row.toStatus ? <StatusBadge status={row.toStatus} /> : '-')
      },
      {
          id: 'executor',
          header: 'Exécuté par',
          render: (row) => row.actorUsername || '-'
      },
      {
          id: 'comment',
          header: 'Commentaire',
          render: (row) => row.comment || '-'
      }
  ];

  const totalElements = data?.totalElements || 0;
  const totalPages = Math.ceil(totalElements / size);

  return (
    <Box sx={{ width: '100%' }}>
      <GenericListFilters
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher dans les commentaires..."
        dropdownFilters={[]}
        filters={{}}
        onFiltersChange={() => {}}
      />
      <GenericDataTable
        columns={columns}
        rows={data?.content || []}
        isLoading={isLoading}
        getRowId={(row) => row.id}
      />
      <GenericListPagination
        totalPages={totalPages}
        currentPage={page}
        onPageChange={setPage}
        currentSize={size}
        onSizeChange={setSize}
        totalCount={totalElements}
      />
    </Box>
  );
};

WorkflowHistoryTable.propTypes = {
  objectType: PropTypes.string,
  objectId: PropTypes.string,
  data: PropTypes.object,
};

export default WorkflowHistoryTable;
