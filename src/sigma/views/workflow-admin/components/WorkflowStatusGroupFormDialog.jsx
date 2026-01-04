import React, { useMemo, useState, useEffect } from 'react';
import { useFormik } from 'formik';
import { Box, Grid, Stack, TextField, Autocomplete, Chip, InputAdornment } from '@mui/material';
import Modal from '../../../components/commons/Modal';
import { useWorkflowStatuses } from '../../../hooks/query/useWorkflow';
import { useTypesByGroupCode } from '../../../hooks/query/useTypes';
import { useGetPrivilegesListByTypeCodes } from '../../../hooks/query/usePrivileges';

/*
DTO reference:
public class WorkflowStatusGroupDTO {
  private Long id;
  @NotBlank(message = "Le code est obligatoire")
  @UniqueWorkflowStatusGroupCode(allowNull = true)
  private String code;
  @NotBlank(message = "Le nom est obligatoire")
  private String name;
  private String description;
  private String color;
  private List<Long> statusIds;
  private List<String> authorityCodes;
}

Props:
- open
- onClose
- initialValues: WorkflowStatusGroupDTO (partial)
- onSubmit: (dto) => void
- workflowId: number (to load statuses)
*/

export default function WorkflowStatusGroupFormDialog({ open, onClose, initialValues, onSubmit, workflowId }) {
  const { data: statuses = [], isLoading: loadingStatuses } = useWorkflowStatuses(workflowId, { enabled: !!workflowId && open });
  const { data: privilegeTypes = [], isLoading: loadingTypes } = useTypesByGroupCode('PRV');

  // Local state for selected privilege type codes to filter authorities
  const [selectedTypeCodes, setSelectedTypeCodes] = useState(initialValues?.privilegeTypeCodes || []);

  useEffect(() => {
    if (open) {
      setSelectedTypeCodes(initialValues?.privilegeTypeCodes || []);
    }
  }, [open, initialValues]);

  const { data: privileges = [], isLoading: loadingPrivileges } = useGetPrivilegesListByTypeCodes({ privilegeTypeCodes: selectedTypeCodes });

  const statusOptions = useMemo(() => (Array.isArray(statuses) ? statuses : []), [statuses]);
  const privilegeTypeOptions = useMemo(() => (Array.isArray(privilegeTypes) ? privilegeTypes : []), [privilegeTypes]);
  const privilegeOptions = useMemo(() => (Array.isArray(privileges) ? privileges : []), [privileges]);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      id: initialValues?.id || undefined,
      code: initialValues?.code || '',
      name: initialValues?.name || '',
      description: initialValues?.description || '',
      color: initialValues?.color || '#2196f3',
      statusIds: initialValues?.statusIds || [],
      authorityCodes: initialValues?.authorityCodes || [],
      privilegeTypeCodes: initialValues?.privilegeTypeCodes || [],
    },
    onSubmit: (vals) => {
      if (!vals.code || !vals.name) return;
      const dto = {
        id: vals.id,
        code: vals.code,
        name: vals.name,
        description: vals.description || undefined,
        color: vals.color || undefined,
        statusIds: Array.isArray(vals.statusIds) ? vals.statusIds : [],
        authorityCodes: Array.isArray(vals.authorityCodes) ? vals.authorityCodes : [],
      };
      onSubmit && onSubmit(dto);
    }
  });

  const selectedStatuses = (formik.values.statusIds || []).map((sid) => statusOptions.find((s) => s.id === sid)).filter(Boolean);
  const selectedPrivilegeTypes = (formik.values.privilegeTypeCodes || []).map((c) => privilegeTypeOptions.find((t) => t.code === c)).filter(Boolean);
  const selectedAuthorities = (formik.values.authorityCodes || []).map((c) => privilegeOptions.find((p) => p.code === c)).filter(Boolean);

  const title = formik.values?.id ? 'Modifier un groupe de statuts' : 'Nouveau groupe de statuts';

  return (
    <Modal
      open={open}
      title={title}
      handleClose={onClose}
      handleConfirmation={() => formik.submitForm()}
      actionDisabled={!formik.values.code || !formik.values.name}
      width="md"
    >
      <Stack spacing={2}>
        <Grid container rowSpacing={2} columnSpacing={0}>
          {/* Row 1: Code + Name */}
          <Grid item xs={12} md={6}>
            <TextField label="Code" required value={formik.values.code} onChange={formik.handleChange('code')} size="small" fullWidth />
          </Grid>
          <Grid item xs={12} md={6} sx={{ pl: { xs: 0, md: 2 } }}>
            <TextField label="Nom" required value={formik.values.name} onChange={formik.handleChange('name')} size="small" fullWidth />
          </Grid>

          {/* Row 2: Description */}
          <Grid item xs={12}>
            <TextField label="Description" value={formik.values.description} onChange={formik.handleChange('description')} size="small" fullWidth multiline rows={2} />
          </Grid>

          {/* Row 3: Color */}
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

          {/* Row 4: Statuses multiselect */}
          <Grid item xs={12} md={6} sx={{ pl: { xs: 0, md: 2 } }}>
            <Autocomplete
              multiple
              disableCloseOnSelect
              options={statusOptions}
              loading={loadingStatuses}
              getOptionLabel={(opt) => opt?.statusName || ''}
              isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
              value={selectedStatuses}
              onChange={(event, newValue) => {
                const ids = (newValue || []).map((v) => v.id);
                formik.setFieldValue('statusIds', ids);
              }}
              size="small"
              fullWidth
              renderTags={(value, getTagProps) => value.map((option, index) => (
                <Chip {...getTagProps({ index })} key={option.id} label={option.statusName} />
              ))}
              renderInput={(params) => (
                <TextField {...params} label="États du workflow" placeholder="Sélectionner un ou plusieurs statuts" size="small" fullWidth />
              )}
            />
          </Grid>

          {/* Row 5: Privilege type filter (multiselect) */}
          <Grid item xs={12} md={6}>
            <Autocomplete
              multiple
              disableCloseOnSelect
              options={privilegeTypeOptions}
              loading={loadingTypes}
              getOptionLabel={(opt) => opt?.name || ''}
              isOptionEqualToValue={(opt, val) => opt?.code === val?.code}
              value={selectedPrivilegeTypes}
              onChange={(event, newValue) => {
                const codes = (newValue || []).map((v) => v.code);
                setSelectedTypeCodes(codes);
                formik.setFieldValue('privilegeTypeCodes', codes);
              }}
              size="small"
              fullWidth
              renderTags={(value, getTagProps) => value.map((option, index) => (
                <Chip {...getTagProps({ index })} key={option.code} label={option.name} />
              ))}
              renderInput={(params) => (
                <TextField {...params} label="Types de privilèges (filtre)" placeholder="Sélectionner un ou plusieurs types" size="small" fullWidth />
              )}
            />
          </Grid>

          {/* Row 6: Authority codes multiselect (filtered by types) */}
          <Grid item xs={12} md={6} sx={{ pl: { xs: 0, md: 2 } }}>
            <Autocomplete
              multiple
              disableCloseOnSelect
              options={privilegeOptions}
              loading={loadingPrivileges}
              getOptionLabel={(opt) => opt?.name || ''}
              isOptionEqualToValue={(opt, val) => opt?.code === val?.code}
              value={selectedAuthorities}
              onChange={(event, newValue) => {
                const codes = (newValue || []).map((v) => v.code);
                formik.setFieldValue('authorityCodes', codes);
              }}
              size="small"
              fullWidth
              renderTags={(value, getTagProps) => value.map((option, index) => (
                <Chip {...getTagProps({ index })} key={option.code} label={option.name} />
              ))}
              renderInput={(params) => (
                <TextField {...params} label="Codes d'autorité" placeholder="Sélectionner une ou plusieurs autorités" size="small" fullWidth />
              )}
            />
          </Grid>
        </Grid>
      </Stack>
    </Modal>
  );
}
