import { useEffect, useState } from 'react';
import { Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Button, FormControlLabel, Switch } from '@mui/material';

export default function TransitionFormDialog({ open, onClose, initialValues, onSubmit }) {
  const [values, setValues] = useState({ privilegeCode: '', code: '', libelle: '', ordre: 0, workflowId: undefined, active: true });

  useEffect(() => {
    setValues({
      privilegeCode: initialValues?.privilegeCode || '',
      code: initialValues?.code || '',
      libelle: initialValues?.libelle || '',
      ordre: initialValues?.ordre || 0,
      statutOrigineCode: initialValues?.statutOrigineCode || '',
      defaultStatutDestinationCode: initialValues?.defaultStatutDestinationCode || '',
      workflowId: initialValues?.workflowId,
      active: initialValues?.active ?? true
    });
  }, [initialValues]);

  const handleChange = (field) => (e) => setValues((v) => ({ ...v, [field]: e.target.value }));
  const handleToggle = (e) => setValues((v) => ({ ...v, active: e.target.checked }));

  const handleSubmit = () => {
    if (!values.privilegeCode || !values.code) return;
    onSubmit && onSubmit(values);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{initialValues?.privilegeCode ? 'Modifier la transition' : 'Nouvelle transition'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Privilege Code" value={values.privilegeCode} onChange={handleChange('privilegeCode')} required />
          <TextField label="Code" value={values.code} onChange={handleChange('code')} required />
          <TextField label="Libellé" value={values.libelle} onChange={handleChange('libelle')} />
          <TextField label="Ordre" type="number" value={values.ordre} onChange={handleChange('ordre')} />
          <TextField label="Statut origine (code)" value={values.statutOrigineCode || ''} onChange={handleChange('statutOrigineCode')} />
          <TextField label="Statut destination par défaut (code)" value={values.defaultStatutDestinationCode || ''} onChange={handleChange('defaultStatutDestinationCode')} />
          <FormControlLabel control={<Switch checked={!!values.active} onChange={handleToggle} />} label="Actif" />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!values.privilegeCode || !values.code}>
          Enregistrer
        </Button>
      </DialogActions>
    </Dialog>
  );
}
