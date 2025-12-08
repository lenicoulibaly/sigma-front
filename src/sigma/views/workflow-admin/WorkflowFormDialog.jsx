import { useEffect, useState } from 'react';
import { Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Button, FormControlLabel, Switch } from '@mui/material';

export default function WorkflowFormDialog({ open, onClose, initialValues, onSubmit }) {
  const [values, setValues] = useState({ code: '', libelle: '', targetTableNameCode: '', active: true });

  useEffect(() => {
    setValues({
      code: initialValues?.code || '',
      libelle: initialValues?.libelle || '',
      targetTableNameCode: initialValues?.targetTableNameCode || '',
      active: initialValues?.active ?? true
    });
  }, [initialValues]);

  const handleChange = (field) => (e) => setValues((v) => ({ ...v, [field]: e.target.value }));

  const handleToggle = (e) => setValues((v) => ({ ...v, active: e.target.checked }));

  const handleSubmit = () => {
    if (!values.code || !values.targetTableNameCode) return;
    onSubmit && onSubmit(values);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{initialValues?.id ? 'Modifier le workflow' : 'Nouveau workflow'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Code" value={values.code} onChange={handleChange('code')} required />
          <TextField label="Libellé" value={values.libelle} onChange={handleChange('libelle')} />
          <TextField label="Table cible (code)" value={values.targetTableNameCode} onChange={handleChange('targetTableNameCode')} required />
          <FormControlLabel control={<Switch checked={!!values.active} onChange={handleToggle} />} label="Actif" />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!values.code || !values.targetTableNameCode}>
          Enregistrer
        </Button>
      </DialogActions>
    </Dialog>
  );
}
