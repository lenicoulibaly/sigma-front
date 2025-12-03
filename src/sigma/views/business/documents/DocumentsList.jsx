import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useQueryClient } from '@tanstack/react-query';

// material-ui
import { useTheme } from '@mui/material/styles';
import {
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  CircularProgress,
  Menu,
  MenuItem,
  Button,
  Grid,
  InputAdornment,
  OutlinedInput,
  ListItemIcon,
  ListItemText
} from '@mui/material';

// project imports
import Pagination from '../../../components/commons/Pagination';
import FloatingAlert from '../../../components/commons/FloatingAlert';
import { useSearchDocumentsByObject, useDownloadDocument, useDeleteDocument, DOCUMENT_KEYS } from '../../../hooks/query/useDocuments';
import UploadDocumentModal from './UploadDocumentModal';
import { IFrameModal } from '../../../components/commons/IFrameModal';
import UpdateDocumentModal from './UpdateDocumentModal';
import CustomAlertDialog from '../../../components/commons/CustomAlertDialog';

// assets
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';
import { IconSearch } from '@tabler/icons-react';
import DescriptionIcon from '@mui/icons-material/Description';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import ImageIcon from '@mui/icons-material/Image';

// ==============================|| DOCUMENTS LIST (GENERIC) ||============================== //

const DocumentsList = ({ tableName, objectId, parentDocTypeCode }) => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  // State for alerts
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('info');

  // Handle search
  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  // State for action menu
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);

  // Viewer modal state (IFrameModal)
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerBase64, setViewerBase64] = useState('');
  const [viewerMime, setViewerMime] = useState('application/pdf');
  const [viewerTitle, setViewerTitle] = useState('');

  // Download hook
  const deleteMutation = useDeleteDocument();
  const downloadMutation = useDownloadDocument();

  // Add document modal state
  const [uploadOpen, setUploadOpen] = useState(false);
  const handleAddDocument = () => setUploadOpen(true);
  const handleUploadClose = () => setUploadOpen(false);
  const handleUploaded = () => {
    // no-op here; react-query invalidation from useUploadDocument handles refresh
    setAlertMessage('Document ajouté avec succès');
    setAlertSeverity('success');
    setAlertOpen(true);
  };

  // Fetch documents using the hook
  const { data: docsData, isLoading, error } = useSearchDocumentsByObject({
    tableName,
    objectId,
    key: searchTerm || '',
    page,
    size: pageSize
  });

  // Handle page change
  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  // Handle page size change
  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setPage(0);
  };

  // Handle action menu open
  const handleActionMenuOpen = (event, doc) => {
    setAnchorEl(event.currentTarget);
    setSelectedDoc(doc);
  };

  // Handle action menu close
  const handleActionMenuClose = () => {
    setAnchorEl(null);
    setSelectedDoc(null);
  };

  // Helpers
  const isImage = (mime = '') => /^image\//i.test(mime);

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

  const openViewerWithBlob = async (blob, title, mimeType) => {
    try {
      const base64 = await blobToBase64(blob);
      setViewerBase64(base64);
      setViewerMime(mimeType || 'application/pdf');
      setViewerTitle(title || 'Document');
      setViewerOpen(true);
    } catch (_) {
      // ignore
    }
  };


  // Edit modal state
  const [editOpen, setEditOpen] = useState(false);

  // Delete confirm dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Handle action menu item click
  const handleActionClick = async (action) => {
    if (!selectedDoc) return;

    if (action === 'view') {
      try {
        const { blob, filename, mimeType } = await downloadMutation.mutateAsync(selectedDoc.docId);
        openViewerWithBlob(blob, filename || selectedDoc.docName || selectedDoc.docNum, mimeType);
      } catch (err) {
        setAlertMessage("Impossible d'ouvrir le document");
        setAlertSeverity('error');
        setAlertOpen(true);
      } finally {
        handleActionMenuClose();
      }
      return;
    }

    if (action === 'download') {
      try {
        const { blob, filename } = await downloadMutation.mutateAsync(selectedDoc.docId);
        triggerBrowserDownload(blob, filename || selectedDoc.docName || selectedDoc.docNum || 'document');
      } catch (err) {
        setAlertMessage('Erreur lors du téléchargement');
        setAlertSeverity('error');
        setAlertOpen(true);
      } finally {
        handleActionMenuClose();
      }
      return;
    }

    if (action === 'delete') {
      setDeleteError('');
      setDeleteOpen(true);
      setAnchorEl(null);
      return;
    } else if (action === 'edit') {
      setEditOpen(true);
      setAnchorEl(null);
      return;
    } else {
      setAlertMessage(`Action "${action}" sur ${selectedDoc.docName || selectedDoc.docNum}`);
      setAlertSeverity('info');
      setAlertOpen(true);
      handleActionMenuClose();
    }
  };

  // Handle alert close
  const handleAlertClose = () => {
    setAlertOpen(false);
  };

  return (
    <>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={8}>
          <OutlinedInput
            id="input-search-documents"
            placeholder="Rechercher un document"
            fullWidth
            size="small"
            value={searchTerm}
            onChange={handleSearch}
            startAdornment={
              <InputAdornment position="start">
                <IconSearch stroke={1.5} size="1rem" />
              </InputAdornment>
            }
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} sx={{ display: 'flex', justifyContent: 'flex-end' }}>

          <Tooltip title="Ajouter un document">
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAddDocument}
                    sx={{ minWidth: '40px', p: '8px' }}
                >
                    <AddIcon />
                </Button>
          </Tooltip>
        </Grid>
      </Grid>

      <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>N°</TableCell>
              <TableCell>Aperçu</TableCell>
              <TableCell>Numéro</TableCell>
              <TableCell>Nom</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Mime</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <CircularProgress color="primary" />
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography color="error">Erreur lors du chargement des données</Typography>
                </TableCell>
              </TableRow>
            ) : docsData?.content?.length > 0 ? (
              docsData.content.map((doc) => (
                <TableRow key={doc.docId}>
                  <TableCell>{doc.docId}</TableCell>
                  <TableCell width={64}>
                    {isImage(doc.docMimeType) && doc.file ? (
                      <img
                        src={`data:${doc.docMimeType};base64,${doc.file}`}
                        alt={doc.docName || doc.docNum || 'aperçu'}
                        style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4, border: `1px solid ${theme.palette.divider}` }}
                      />
                    ) : (
                      <DescriptionIcon fontSize="small" color="action" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <DescriptionIcon fontSize="small" color="action" />
                      <Typography variant="subtitle2">{doc.docNum || '-'}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{doc.docName || '-'}</TableCell>
                  <TableCell>{doc.docType?.name || '-'}</TableCell>
                  <TableCell>{doc.docMimeType || doc.docExtension || '-'}</TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap title={doc.docDescription || ''}>
                      {doc.docDescription || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      color="primary"
                      size="small"
                      onClick={(e) => handleActionMenuOpen(e, doc)}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="subtitle1">Aucun document trouvé</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {docsData && (
        <Pagination
          totalPages={docsData.totalPages || 0}
          currentPage={page}
          onPageChange={handlePageChange}
          currentSize={pageSize}
          onSizeChange={handlePageSizeChange}
          totalCount={docsData.totalElements || 0}
          sx={{ mt: 3 }}
        />
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleActionMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => handleActionClick('view')}>
          <ListItemIcon>
            <VisibilityOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Voir</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleActionClick('download')}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Télécharger</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleActionClick('edit')}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Modifier</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleActionClick('delete')}>
          <ListItemIcon>
            <DeleteForeverIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Supprimer</ListItemText>
        </MenuItem>
      </Menu>

      {/* Viewer Modal */}
      {/* Edit Modal */}
      <UpdateDocumentModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        doc={selectedDoc}
        parentDocTypeCode={parentDocTypeCode}
        onUpdated={() => {
          setAlertMessage('Document modifié avec succès');
          setAlertSeverity('success');
          setAlertOpen(true);
          queryClient.invalidateQueries({ queryKey: DOCUMENT_KEYS.listByObject({ tableName, objectId }) });
        }}
      />

      <IFrameModal
        opened={viewerOpen}
        title={viewerTitle}
        base64String={viewerBase64}
        mimeType={viewerMime}
        height={'80vh'}
        handleClose={() => { setViewerOpen(false); setViewerBase64(''); }}
      />

      {/* Upload Modal */}
      <UploadDocumentModal
        open={uploadOpen}
        onClose={handleUploadClose}
        objectId={objectId}
        objectTableName={tableName}
        parentDocTypeCode={parentDocTypeCode}
        onUploaded={handleUploaded}
      />

      {/* Delete Confirmation */}
      <CustomAlertDialog
        open={deleteOpen}
        handleClose={() => setDeleteOpen(false)}
        handleConfirm={async () => {
          if (!selectedDoc) return;
          try {
            setDeleteError('');
            await deleteMutation.mutateAsync(selectedDoc.docId);
            setAlertMessage('Document supprimé avec succès');
            setAlertSeverity('success');
            setAlertOpen(true);
            queryClient.invalidateQueries({ queryKey: DOCUMENT_KEYS.listByObject({ tableName, objectId }) });
          } catch (e) {
            setDeleteError(e?.message || 'Échec de la suppression');
          } finally {
            setDeleteOpen(false);
          }
        }}
        title={'Confirmation de suppression'}
        content={`Voulez-vous vraiment supprimer le document \"${selectedDoc?.docName || selectedDoc?.docNum || selectedDoc?.docId}\" ?`}
        confirmBtnText={'Supprimer'}
        cancelBtnText={'Annuler'}
        loading={deleteMutation.isLoading}
        error={deleteError}
      />

      {/* Alert for feedback */}
      <FloatingAlert
        open={alertOpen}
        feedBackMessages={alertMessage}
        severity={alertSeverity}
        timeout={alertSeverity === 'error' ? 7 : 3}
        onClose={handleAlertClose}
      />
    </>
  );
};

DocumentsList.propTypes = {
  tableName: PropTypes.string.isRequired,
  objectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  parentDocTypeCode: PropTypes.string
};

export default DocumentsList;
