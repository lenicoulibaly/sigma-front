import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Grid,
  Button,
  Stack,
  TextField,
  Autocomplete,
  IconButton,
  InputAdornment,
  Tooltip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { typeApi } from 'src/sigma/api/administrationApi';

const RoundIconButton = styled(IconButton)(({ theme }) => ({
  width: 36,
  height: 36,
  borderRadius: '50%'
}));

export const emptyDocumentRow = () => ({
  id: Math.random().toString(36).slice(2),
  docTypeCode: '',
  docName: '',
  docDescription: '',
  file: null
});

const TransitionDocumentUpload = ({ documents, setDocuments, onPreview }) => {
  const [docTypes, setDocTypes] = useState([]);
  const [loadingDocTypes, setLoadingDocTypes] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoadingDocTypes(true);
    typeApi
      .getTypesByGroup('DOC')
      .then((data) => {
        if (mounted) setDocTypes(data || []);
      })
      .catch(() => {
        if (mounted) setDocTypes([]);
      })
      .finally(() => {
        if (mounted) setLoadingDocTypes(false);
      });
    return () => { mounted = false; };
  }, []);

  const docTypeOptions = docTypes.map((t) => ({
    code: t.code,
    label: t.name || t.code
  }));

  const updateDocField = (id, field, value) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    );
  };

  const addDocRow = () => {
    setDocuments((prev) => [...prev, emptyDocumentRow()]);
  };

  const removeDocRow = (id) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <Stack spacing={2}>
      <Grid container spacing={2}>
        {documents.map((row) => (
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
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          {row.file && onPreview && (
                            <Tooltip title="Prévisualiser">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => onPreview(row)}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Button component="label" variant="contained" size="small">
                            Choisir
                            <input
                              hidden
                              type="file"
                              onChange={(e) => updateDocField(row.id, 'file', e.target.files?.[0] || null)}
                            />
                          </Button>
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
                  value={docTypeOptions.find((opt) => opt.code === row.docTypeCode) || null}
                  onChange={(_e, v) => updateDocField(row.id, 'docTypeCode', v?.code || '')}
                  loading={loadingDocTypes}
                  renderInput={(params) => <TextField {...params} size="small" label="Type de fichier" />}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Description"
                  value={row.docDescription || ''}
                  onChange={(e) => updateDocField(row.id, 'docDescription', e.target.value)}
                  placeholder="Description du document..."
                />
              </Grid>
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
            </Grid>
          </Grid>
        ))}
        <Grid item xs={12}>
          <Button startIcon={<AddCircleOutlineIcon />} onClick={addDocRow} size="small">
            Ajouter une pièce
          </Button>
        </Grid>
      </Grid>
    </Stack>
  );
};

TransitionDocumentUpload.propTypes = {
  documents: PropTypes.array.isRequired,
  setDocuments: PropTypes.func.isRequired,
  onPreview: PropTypes.func
};

export default TransitionDocumentUpload;
