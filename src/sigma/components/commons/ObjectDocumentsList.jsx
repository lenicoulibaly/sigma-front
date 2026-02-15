import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Stack, CircularProgress, IconButton, Tooltip } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useSearchDocumentsByObject, useDownloadDocument } from 'src/sigma/hooks/query/useDocuments';
import { GenericDataTable, GenericListFilters, GenericListPagination } from 'src/sigma/components/commons/GenericSearchablePaginatedList';
import FloatingAlert from 'src/sigma/components/commons/FloatingAlert';
import { IFrameModal } from 'src/sigma/components/commons/IFrameModal';

/**
 * ObjectDocumentsList - A component to display documents associated with a specific object.
 */
const ObjectDocumentsList = ({ tableName, objectId }) => {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = useSearchDocumentsByObject({
    tableName,
    objectId,
    key: search || '',
    page,
    size
  });

  const downloadMutation = useDownloadDocument();

  // Feedback alert state
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('info');

  // Preview modal state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState({ base64: '', title: '', mimeType: '' });

  const triggerBrowserDownload = (blob, filename = 'document') => {
    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (_) {
      // ignore
    }
  };

  const handleDownload = async (doc) => {
    try {
      const { blob, filename } = await downloadMutation.mutateAsync(doc.docId);
      triggerBrowserDownload(blob, filename || doc.docName || doc.docNum || 'document');
    } catch (err) {
      setAlertMessage('Erreur lors du téléchargement');
      setAlertSeverity('error');
      setAlertOpen(true);
    }
  };

  const blobToBase64 = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result || '';
      const base64 = typeof result === 'string' ? result.split(',')[1] : '';
      resolve(base64 || '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  const handlePreview = async (doc) => {
    try {
      const { blob, filename, mimeType } = await downloadMutation.mutateAsync(doc.docId);
      const base64 = await blobToBase64(blob);
      setPreviewData({
        base64,
        title: filename || doc.docName || doc.docNum || 'Document',
        mimeType: mimeType || 'application/pdf'
      });
      setPreviewOpen(true);
    } catch (err) {
      setAlertMessage("Impossible d'ouvrir le document");
      setAlertSeverity('error');
      setAlertOpen(true);
    }
  };

  const columns = [
      {
          header: 'Aperçu',
          width: 64,
          render: (row) => {
              const isImage = (mime = '') => /^image\//i.test(mime);
              if (isImage(row.docMimeType) && row.file) {
                  return (
                      <img
                          src={`data:${row.docMimeType};base64,${row.file}`}
                          alt={row.docName || row.docNum || 'aperçu'}
                          style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4, border: '1px solid #ddd' }}
                      />
                  );
              }
              return <DescriptionIcon color="action" />;
          }
      },
      {
          header: 'Numéro',
          field: 'docNum',
          render: (row) => (
              <Stack direction="row" spacing={1} alignItems="center">
                  <DescriptionIcon fontSize="small" color="action" />
                  <Typography variant="body2">{row.docNum || '-'}</Typography>
              </Stack>
          )
      },

      { header: 'Type', render: (row) => row.docTypeName || '-' },
      { header: 'Description', field: 'docDescription' },
      {
          header: 'Actions',
          render: (row) => {
              const isDownloading = downloadMutation.isPending && downloadMutation.variables === row.docId;
              return (
                  <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                      <Tooltip title="Prévisualiser">
                          <IconButton size="small" onClick={() => handlePreview(row)} disabled={isDownloading}>
                              {isDownloading ? <CircularProgress size={20} /> : <VisibilityIcon fontSize="small" />}
                          </IconButton>
                      </Tooltip>
                      <Tooltip title="Télécharger">
                          <IconButton size="small" onClick={() => handleDownload(row)} disabled={isDownloading}>
                              {isDownloading ? <CircularProgress size={20} /> : <DownloadIcon fontSize="small" />}
                          </IconButton>
                      </Tooltip>
                  </Stack>
              );
          }
      }
  ];

  const totalElements = data?.totalElements || 0;
  const totalPages = data?.totalPages || 0;

  if (error) {
    return <Typography color="error">Erreur lors du chargement des documents</Typography>;
  }

  return (
    <Box sx={{ width: '100%' }}>
      <GenericListFilters
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher par nom ou numéro..."
        dropdownFilters={[]}
        filters={{}}
        onFiltersChange={() => {}}
      />

      <GenericDataTable
        columns={columns}
        rows={data?.content || []}
        isLoading={isLoading}
        getRowId={(row) => row.docId}
      />

      <GenericListPagination
        totalPages={totalPages}
        currentPage={page}
        onPageChange={setPage}
        currentSize={size}
        onSizeChange={setSize}
        totalCount={totalElements}
      />

      <FloatingAlert
        open={alertOpen}
        feedBackMessages={alertMessage}
        severity={alertSeverity}
        onClose={() => setAlertOpen(false)}
      />

      <IFrameModal
        opened={previewOpen}
        handleClose={() => setPreviewOpen(false)}
        base64String={previewData.base64}
        title={previewData.title}
        mimeType={previewData.mimeType}
      />
    </Box>
  );
};

ObjectDocumentsList.propTypes = {
  tableName: PropTypes.string.isRequired,
  objectId: PropTypes.string.isRequired,
};

export default ObjectDocumentsList;
