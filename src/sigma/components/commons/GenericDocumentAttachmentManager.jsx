import React, { useState } from 'react';
import PropTypes from 'prop-types';

// mui
import {
  Box,
  Grid,
  Button,
  Stack,
  TextField,
  Autocomplete,
  IconButton,
  Tooltip,
  InputAdornment,
  styled
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';

// project imports
import { useDownloadDocument } from 'src/sigma/hooks/query/useDocuments';
import { IFrameModal } from 'src/sigma/components/commons/IFrameModal';
import FloatingAlert from 'src/sigma/components/commons/FloatingAlert';

const RoundIconButton = styled(IconButton)(({ theme }) => ({
  width: 36,
  height: 36,
  borderRadius: '50%'
}));

/**
 * GenericDocumentAttachmentManager - Composant générique pour la gestion des pièces jointes (ajout, suppression, édition)
 */
const GenericDocumentAttachmentManager = ({
  documents = [],
  onChange,
  docTypeOptions = [],
  loadingDocTypes = false,
  isReadOnly = false,
  maxDocuments = null
}) => {
  const downloadMutation = useDownloadDocument();

  // Viewer state for documents
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerBase64, setViewerBase64] = useState('');
  const [viewerMime, setViewerMime] = useState('application/pdf');
  const [viewerTitle, setViewerTitle] = useState('');
  const [alert, setAlert] = useState({ open: false, severity: 'info', message: '' });

  const emptyDocumentRow = () => ({
    id: Math.random().toString(36).slice(2),
    docTypeCode: '',
    docNum: '',
    docName: '',
    docDescription: '',
    file: null
  });

  const isPreviewable = (mimeType) => {
    return ['application/pdf', 'image/jpeg', 'image/png', 'image/gif'].includes(mimeType);
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

  const handleDownload = async (docId, filename) => {
    try {
      const { blob, filename: serverFilename } = await downloadMutation.mutateAsync(docId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename || serverFilename || 'document');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setAlert({ open: true, message: "Erreur lors du téléchargement du document", severity: 'error' });
    }
  };

  const handlePreview = async (doc) => {
    try {
      const { blob, mimeType, filename } = await downloadMutation.mutateAsync(doc.docId);
      const base64 = await blobToBase64(blob);
      setViewerBase64(base64);
      setViewerMime(doc.docMimeType || mimeType || 'application/pdf');
      setViewerTitle(doc.docName || filename || 'Aperçu du document');
      setViewerOpen(true);
    } catch (error) {
      setAlert({ open: true, message: "Impossible de prévisualiser le document", severity: 'error' });
    }
  };

  const updateDocField = (id, field, value) => {
    const newDocs = documents.map((d) => (d.id === id ? { ...d, [field]: value } : d));
    onChange(newDocs);
  };

  const addDocRow = () => {
    if (maxDocuments && documents.length >= maxDocuments) return;
    onChange([...documents, emptyDocumentRow()]);
  };

  const removeDocRow = (id) => {
    if (documents.length <= 1) {
      onChange([emptyDocumentRow()]);
    } else {
      onChange(documents.filter((d) => d.id !== id));
    }
  };

  return (
    <Box>
      <Grid container spacing={2}>
        {(documents || []).map((row) => (
          <Grid key={row.id} item xs={12}>
            <Grid container spacing={1} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Fichier"
                  placeholder="Choisir un fichier"
                  value={row.file?.name || row.docName || ''}
                  disabled
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Stack direction="row" spacing={0.5}>
                          {row.docId && (
                            <>
                              {isPreviewable(row.docMimeType) && (
                                <Tooltip title="Prévisualiser">
                                  <IconButton size="small" color="primary" onClick={() => handlePreview(row)}>
                                    <VisibilityIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              <Tooltip title="Télécharger">
                                <IconButton size="small" color="secondary" onClick={() => handleDownload(row.docId, row.docName)}>
                                  <DownloadIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                          {row.file && isPreviewable(row.file.type) && (
                            <Tooltip title="Prévisualiser le nouveau fichier">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={async () => {
                                  try {
                                    const base64 = await blobToBase64(row.file);
                                    const typeLabel = docTypeOptions.find(opt => opt.code === row.docTypeCode)?.label || '';
                                    setViewerBase64(base64);
                                    setViewerMime(row.file.type);
                                    setViewerTitle(typeLabel);
                                    setViewerOpen(true);
                                  } catch (error) {
                                    setAlert({ open: true, message: "Impossible de prévisualiser ce fichier", severity: 'error' });
                                  }
                                }}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {!isReadOnly && (
                            <Button component="label" variant="contained" size="small">
                              Choisir
                              <input hidden type="file" onChange={(e) => updateDocField(row.id, 'file', e.target.files?.[0] || null)} />
                            </Button>
                          )}
                        </Stack>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <Autocomplete
                  options={docTypeOptions}
                  getOptionLabel={(o) => o?.label || ''}
                  value={(docTypeOptions || []).find((opt) => opt.code === row.docTypeCode) || null}
                  onChange={(_e, v) => updateDocField(row.id, 'docTypeCode', v?.code || '')}
                  loading={loadingDocTypes}
                  disabled={isReadOnly}
                  renderInput={(params) => <TextField {...params} size="small" label="Type de fichier" />}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Description"
                  value={row.docDescription || ''}
                  disabled={isReadOnly}
                  onChange={(e) => updateDocField(row.id, 'docDescription', e.target.value)}
                />
              </Grid>
              {!isReadOnly && (
                <Grid item xs={12} md={1}>
                  <RoundIconButton
                    color="error"
                    onClick={() => removeDocRow(row.id)}
                    aria-label="remove-row"
                    disabled={documents.length <= 1}
                  >
                    <RemoveCircleOutlineIcon />
                  </RoundIconButton>
                </Grid>
              )}
            </Grid>
          </Grid>
        ))}
        {!isReadOnly && (!maxDocuments || documents.length < maxDocuments) && (
          <Grid item xs={12}>
            <Button startIcon={<AddCircleOutlineIcon />} onClick={addDocRow} size="small">
              Ajouter une pièce
            </Button>
          </Grid>
        )}
      </Grid>

      <IFrameModal
        opened={viewerOpen}
        handleClose={() => setViewerOpen(false)}
        base64String={viewerBase64}
        title={viewerTitle}
        mimeType={viewerMime}
      />

      <FloatingAlert
        open={alert.open}
        feedBackMessages={alert.message}
        severity={alert.severity}
        onClose={() => setAlert({ ...alert, open: false })}
      />
    </Box>
  );
};

GenericDocumentAttachmentManager.propTypes = {
  documents: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
  docTypeOptions: PropTypes.array,
  loadingDocTypes: PropTypes.bool,
  isReadOnly: PropTypes.bool,
  maxDocuments: PropTypes.number
};

export default GenericDocumentAttachmentManager;
