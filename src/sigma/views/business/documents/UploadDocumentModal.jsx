import React, { useMemo, useState } from 'react';
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
import { useUploadDocument } from '../../../hooks/query/useDocuments';
import { useDirectSousTypes } from '../../../hooks/query/useTypes';

// Reusable modal form to upload a document linked to any business object
// Fields (UploadDocReq): objectId, docTypeCode, docNum, docName, docDescription, file, objectTableName
const UploadDocumentModal = ({ open, onClose, objectId, objectTableName, parentDocTypeCode, onUploaded }) => {
  const [values, setValues] = useState({ docTypeCode: '', docNum: '', docName: '', docDescription: '' });
  const [file, setFile] = useState(null);
  const [touched, setTouched] = useState({});
  const [formError, setFormError] = useState('');

  const { data: typesData, isLoading: typesLoading } = useDirectSousTypes({ parentCode: parentDocTypeCode });
  const uploadMutation = useUploadDocument();

  const typeOptions = useMemo(() => {
    if (!typesData) return [];
    // unify to {code, label}
    return (typesData || []).map((t) => ({ code: t.code || t.value || t.key, label: t.libelle || t.label || t.name || t.code }));
  }, [typesData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectType = (_e, option) => {
    setValues((prev) => ({ ...prev, docTypeCode: option?.code || '' }));
    setTouched((t) => ({ ...t, docTypeCode: true }));
  };

  const resetForm = () => {
    setValues({ docTypeCode: '', docNum: '', docName: '', docDescription: '' });
    setFile(null);
    setTouched({});
    setFormError('');
  };

  const requiredMissing = useMemo(() => {
    return !values.docTypeCode || !file || objectId == null || !objectTableName;
  }, [values.docTypeCode, file, objectId, objectTableName]);

  const getError = (field) => {
    if (!touched[field]) return '';
    if (field === 'docTypeCode' && !values.docTypeCode) return 'Type de document requis';
    if (field === 'file' && !file) return 'Fichier requis';
    return '';
  };

  const handleSubmit = async () => {
    setTouched({ docTypeCode: true, file: true });
    setFormError('');
    if (requiredMissing) return;

    try {
      // Build plain payload; API will convert to FormData
      const payload = {
        objectId,
        docTypeCode: values.docTypeCode,
        docNum: values.docNum || undefined,
        docName: values.docName || undefined,
        docDescription: values.docDescription || undefined,
        file
        };

      await uploadMutation.mutateAsync({ objectTableName, ...payload });

      if (typeof onUploaded === 'function') onUploaded();
      resetForm();
      onClose?.();
    } catch (e) {
      const apiMsgs = e?.response?.data;
      let msg = '';
      if (Array.isArray(apiMsgs)) msg = apiMsgs.filter(Boolean).join('\n');
      else if (typeof apiMsgs === 'string') msg = apiMsgs;
      else msg = e?.message;
      setFormError(msg || "Échec de l'upload");
    }
  };

  const handleClose = () => {
    if (!uploadMutation.isLoading) {
      resetForm();
      onClose?.();
    }
  };

  return (
    <Modal
      open={!!open}
      title={'Ajouter un document'}
      handleClose={handleClose}
      handleConfirmation={handleSubmit}
      actionLabel={uploadMutation.isLoading ? 'Envoi…' : 'Uploader'}
      actionDisabled={uploadMutation.isLoading || requiredMissing}
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
                required
                error={!!getError('docTypeCode')}
                helperText={getError('docTypeCode')}
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
            label="Fichier"
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
          {!file && getError('file') && <FormHelperText error>{getError('file')}</FormHelperText>}
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

UploadDocumentModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  objectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  objectTableName: PropTypes.string.isRequired,
  parentDocTypeCode: PropTypes.string.isRequired,
  onUploaded: PropTypes.func
};

export default UploadDocumentModal;
