import React from 'react';
import { useFormik } from 'formik';
import { Box, Grid, Stack, TextField, Autocomplete, FormControlLabel, Switch, InputAdornment } from '@mui/material';
import Modal from '../../../components/commons/Modal';
import { useDirectSousTypes, useTypesByGroupCode } from '../../../hooks/query/useTypes';
import { ICON_OPTIONS } from '../../../components/commons/IconByName';

export default function WorkflowStatusFormDialog({ open, onClose, initialValues, onSubmit }) {
  const { data: statusTypes = [], isLoading: loadingStatusTypes } = useDirectSousTypes({ parentCode: 'WKFL_STA' });
  const { data: timeUnitTypes = [], isLoading: loadingTimeUnits } = useTypesByGroupCode('TIME_UNIT');

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      statusCode: initialValues?.statusCode || '',
      ordre: initialValues?.ordre ?? '',
      start: !!initialValues?.start,
      end: !!initialValues?.end,
      regulatoryDurationValue: initialValues?.regulatoryDurationValue ?? '',
      regulatoryDurationUnitCode: initialValues?.regulatoryDurationUnitCode || '',
      color: initialValues?.color || '#2196f3',
      icon: initialValues?.icon || ''
    },
    onSubmit: (vals) => {
      if (!vals.statusCode) return;
      onSubmit && onSubmit(vals);
    }
  });

  const selectedStatus = (statusTypes || []).find((t) => t.code === formik.values.statusCode) || null;
  const selectedUnit = (timeUnitTypes || []).find((t) => t.code === formik.values.regulatoryDurationUnitCode) || null;

  return (
    <Modal
      open={open}
      title={(initialValues?.id || initialValues?.statusCode) ? 'Modifier une étape' : 'Nouvelle étape'}
      handleClose={onClose}
      handleConfirmation={() => formik.submitForm()}
      actionDisabled={!formik.values.statusCode}
      width="sm"
    >
      <Stack spacing={2}>
        <Grid container rowSpacing={2} columnSpacing={0}>
          {/* Row 1: Statut + Ordre */}
          <Grid item xs={12} md={6}>
            <Autocomplete
              options={statusTypes || []}
              loading={loadingStatusTypes}
              getOptionLabel={(opt) => opt?.name || ''}
              isOptionEqualToValue={(opt, val) => opt?.code === val?.code}
              value={selectedStatus}
              onChange={(event, newValue) => {
                formik.setFieldValue('statusCode', newValue?.code || '');
              }}
              size="small"
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { minHeight: 40, height: 40 } }}
              renderInput={(params) => (
                <TextField {...params} label="Statut" placeholder="Sélectionner un statut" required size="small" fullWidth />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6} sx={{ pl: { xs: 0, md: 2 } }}>
            <TextField label="Ordre" type="number" value={formik.values.ordre} onChange={(e) => formik.setFieldValue('ordre', e.target.value)} size="small" fullWidth />
          </Grid>

          {/* Row 2: Durée réglementaire + Unité de durée */}
          <Grid item xs={12} md={6}>
            <TextField
              label="Durée réglementaire"
              type="number"
              value={formik.values.regulatoryDurationValue}
              onChange={formik.handleChange('regulatoryDurationValue')}
              size="small"
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={6} sx={{ pl: { xs: 0, md: 2 } }}>
            <Autocomplete
              options={timeUnitTypes || []}
              loading={loadingTimeUnits}
              getOptionLabel={(opt) => opt?.name || ''}
              isOptionEqualToValue={(opt, val) => opt?.code === val?.code}
              value={selectedUnit}
              onChange={(event, newValue) => {
                formik.setFieldValue('regulatoryDurationUnitCode', newValue?.code || '');
              }}
              size="small"
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { minHeight: 40, height: 40 } }}
              renderInput={(params) => (
                <TextField {...params} label="Unité de durée" placeholder="Sélectionner l'unité" size="small" fullWidth />
              )}
            />
          </Grid>


          {/* Row 4: Couleur + Icône */}
          <Grid item xs={12} md={6}>
            <TextField
              label="Couleur"
              type="text"
              value={formik.values.color}
              onChange={(e) => formik.setFieldValue('color', e.target.value)}
              placeholder="#20a2f3"
              InputLabelProps={{ shrink: true }}
              size="small"
              fullWidth
              inputProps={{ pattern: '^#?[0-9A-Fa-f]{3}([0-9A-Fa-f]{3})?$' }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Box
                      component="input"
                      type="color"
                      value={formik.values.color || '#2196f3'}
                      onChange={(e) => formik.setFieldValue('color', e.target.value)}
                      sx={{ width: 28, height: 28, p: 0, border: 'none', bgcolor: 'transparent', cursor: 'pointer' }}
                    />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} md={6} sx={{ pl: { xs: 0, md: 2 } }}>
            <Autocomplete
              options={ICON_OPTIONS}
              getOptionLabel={(opt) => opt?.label || ''}
              isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
              value={ICON_OPTIONS.find((o) => o.id === formik.values.icon) || null}
              onChange={(event, newValue) => {
                formik.setFieldValue('icon', newValue?.id || '');
              }}
              size="small"
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { minHeight: 40, height: 40 } }}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {option.icon}
                    <span>{option.label}</span>
                  </Box>
                </li>
              )}
              renderInput={(params) => (
                <TextField {...params} label="Icône" placeholder="Sélectionner une icône" size="small" fullWidth />
              )}
            />
          </Grid>

          {/* Row 5: Début + Fin (at the end) */}
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <FormControlLabel control={<Switch checked={!!formik.values.start} onChange={(e) => formik.setFieldValue('start', e.target.checked)} size="small" />} label="Début" />
              <FormControlLabel control={<Switch checked={!!formik.values.end} onChange={(e) => formik.setFieldValue('end', e.target.checked)} size="small" />} label="Fin" />
            </Box>
          </Grid>
        </Grid>
      </Stack>
    </Modal>
  );
}
