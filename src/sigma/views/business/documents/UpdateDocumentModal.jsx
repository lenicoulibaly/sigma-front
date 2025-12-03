import React, { useMemo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

// mui
import {
  Grid,
  TextField,
  Button,
  Autocomplete,
  CircularProgress,
  FormHelperText,
  InputAdornment
} from '@mui/material';

// shared Modal component
import Modal from '../../../components/commons/Modal';

// hooks
import { useUpdateDocument } from '../../../hooks/query/useDocuments';
import { useDirectSousTypes } from '../../../hooks/query/useTypes';

// Reusable modal form to update an existing document
// Fields (UpdateDocReq): docId (required), docTypeCode, docNum, docName, docDescription, file
const UpdateDocumentModal = ({ open, onClose, doc, parentDocTypeCode, onUpdated }) => {
  const [values, setValues] = useState({ docTypeCode: '', docNum: '', docName: '', docDescription: '' });
  const [file, setFile] = useState(null);
  const [touched, setTouched] = useState({});
  const [formError, setFormError] = useState('');

  const { data: typesData, isLoading: typesLoading } = useDirectSousTypes({ parentCode: parentDocTypeCode });
  const updateMutation = useUpdateDocument();

  const typeOptions = useMemo(() => {
    if (!typesData) return [];
    // unify to {code, label}
    return (typesData || []).map((t) => ({ code: t.code || t.value || t.key, label: t.libelle || t.label || t.name || t.code }));
  }, [typesData]);

  // Prefill when doc changes or modal opens
  useEffect(() => {
    if (doc) {
      setValues({
        docTypeCode: doc.docType?.code || doc.docTypeCode || '',
        docNum: doc.docNum || '',
        docName: doc.docName || '',
        docDescription: doc.docDescription || ''
      });
      setFile(null);
      setTouched({});
      setFormError('');
    }
  }, [doc, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectType = (_e, option) => {
    setValues((prev) => ({ ...prev, docTypeCode: option?.code || '' }));
    setTouched((t) => ({ ...t, docTypeCode: true }));
  };

  const docId = doc?.docId;
  const requiredMissing = useMemo(() => {
    return !docId; // Only docId is strictly required for update
  }, [docId]);

  const handleSubmit = async () => {
    setFormError('');
    if (requiredMissing) return;

    try {
      // Build plain payload; API will convert to FormData
      const payload = {
        docId,
        docTypeCode: values.docTypeCode || undefined,
        docNum: values.docNum || undefined,
        docName: values.docName || undefined,
        docDescription: values.docDescription || undefined,
        file: file || undefined
      };

      await updateMutation.mutateAsync(payload);

      if (typeof onUpdated === 'function') onUpdated();
      onClose?.();
    } catch (e) {
      const apiMsgs = e?.response?.data;
      let msg = '';
      if (Array.isArray(apiMsgs)) msg = apiMsgs.filter(Boolean).join('\n');
      else if (typeof apiMsgs === 'string') msg = apiMsgs;
      else msg = e?.message;
      setFormError(msg || 'Échec de la mise à jour');
    }
  };

  const handleClose = () => {
    if (!updateMutation.isLoading) {
      onClose?.();
    }
  };

  return (
    <Modal
      open={!!open}
      title={'Modifier un document'}
      handleClose={handleClose}
      handleConfirmation={handleSubmit}
      actionLabel={updateMutation.isLoading ? 'Envoi…' : 'Mettre à jour'}
      actionDisabled={updateMutation.isLoading || requiredMissing}
      width={'sm'}
    >
      <Grid container spacing={2} sx={{ mt: 0 }}>
        <Grid item xs={12}>
          <Autocomplete
            options={typeOptions}
            loading={typesLoading}
            getOptionLabel={(opt) => opt?.label || ''}
            value={typeOptions.find((o) => o.code === values.docTypeCode) || null}
            onChange={handleSelectType}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                label="Type de document"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {typesLoading ? <CircularProgress color="inherit" size={16} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  )
                }}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField name="docNum" value={values.docNum} onChange={handleChange} fullWidth size="small" label="Numéro" />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField name="docName" value={values.docName} onChange={handleChange} fullWidth size="small" label="Nom" />
        </Grid>
        <Grid item xs={12}>
          <TextField name="docDescription" value={values.docDescription} onChange={handleChange} fullWidth size="small" label="Description" multiline minRows={2} />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            size="small"
            label="Fichier (optionnel)"
            placeholder="Choisir un fichier"
            value={file?.name || ''}
            disabled
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Button component="label" variant="contained" size="small">
                    Choisir
                    <input
                      hidden
                      type="file"
                      onChange={(e) => {
                        const f = e.target.files?.[0] || null;
                        setFile(f);
                        setTouched((t) => ({ ...t, file: true }));
                      }}
                    />
                  </Button>
                </InputAdornment>
              )
            }}
          />
        </Grid>
        {formError && (
          <Grid item xs={12}>
            <FormHelperText error>{formError}</FormHelperText>
          </Grid>
        )}
      </Grid>
    </Modal>
  );
};

UpdateDocumentModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  doc: PropTypes.object,
  parentDocTypeCode: PropTypes.string.isRequired,
  onUpdated: PropTypes.func
};

export default UpdateDocumentModal;
