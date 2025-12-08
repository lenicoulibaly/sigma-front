import { useEffect, useState } from 'react';
import { Box, Button, IconButton, Paper, Snackbar, Stack, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ListIcon from '@mui/icons-material/List';
import { listWorkflows, createWorkflow, updateWorkflow, deleteWorkflow } from 'src/sigma/api/workflowAdminApi';
import WorkflowFormDialog from './WorkflowFormDialog';
import { useNavigate } from 'react-router-dom';

export default function WorkflowsListPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const data = await listWorkflows();
      setItems(data || []);
    } catch (e) {
      setError(e?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const handleEdit = (item) => {
    setEditing(item);
    setDialogOpen(true);
  };

  const handleSubmit = async (values) => {
    try {
      if (editing?.id) {
        await updateWorkflow(editing.id, values);
        setSuccess('Workflow mis à jour');
      } else {
        await createWorkflow(values);
        setSuccess('Workflow créé');
      }
      setDialogOpen(false);
      await load();
    } catch (e) {
      setError(e?.message || 'Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce workflow ?')) return;
    try {
      await deleteWorkflow(id);
      setSuccess('Workflow supprimé');
      await load();
    } catch (e) {
      setError(e?.message || 'Erreur lors de la suppression');
    }
  };

  return (
    <Box p={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Workflows</Typography>
        <Button variant="contained" onClick={handleCreate} disabled={loading}>
          Nouveau
        </Button>
      </Stack>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Libellé</TableCell>
              <TableCell>Table Cible</TableCell>
              <TableCell>Actif</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>{row.code}</TableCell>
                <TableCell>{row.libelle}</TableCell>
                <TableCell>{row.targetTableNameCode}</TableCell>
                <TableCell>
                  <Switch checked={!!row.active} disabled />
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" color="primary" onClick={() => navigate(`/admin/workflows/${row.id}/transitions`)} title="Transitions">
                    <ListIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleEdit(row)} title="Éditer">
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(row.id)} title="Supprimer">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <WorkflowFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} initialValues={editing} onSubmit={handleSubmit} />

      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError('')} message={error} />
      <Snackbar open={!!success} autoHideDuration={2000} onClose={() => setSuccess('')} message={success} />
    </Box>
  );
}
