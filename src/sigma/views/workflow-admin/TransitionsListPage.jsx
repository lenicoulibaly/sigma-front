import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import RuleIcon from '@mui/icons-material/Rule';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import {
  useTransitionsByWorkflow,
  useCreateTransition,
  useUpdateTransition,
  useDeleteTransition,
  useReorderTransitions,
} from 'sigma/hooks/query/useWorkflow';
import TransitionFormDialog from './TransitionFormDialog';
import FloatingAlert from 'src/sigma/components/commons/FloatingAlert';

export default function TransitionsListPage() {
  const { id: workflowId } = useParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  const showAlert = (message, severity = 'success') => setAlert({ open: true, message, severity });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const navigate = useNavigate();

  const sortedItems = useMemo(() => [...items].sort((a, b) => (a.ordre || 0) - (b.ordre || 0)), [items]);

  const { data, isLoading, refetch } = useTransitionsByWorkflow(workflowId, { enabled: !!workflowId });

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading]);

  useEffect(() => {
    if (Array.isArray(data)) setItems(data || []);
  }, [data]);

  const handleCreate = () => {
    setEditing({ workflowId: Number(workflowId) });
    setDialogOpen(true);
  };

  const handleEdit = (item) => {
    setEditing(item);
    setDialogOpen(true);
  };

  const { mutateAsync: createTransitionMut } = useCreateTransition();
  const { mutateAsync: updateTransitionMut } = useUpdateTransition();
  const { mutateAsync: deleteTransitionMut } = useDeleteTransition();
  const { mutateAsync: reorderTransitionsMut } = useReorderTransitions();

  const handleSubmit = async (values) => {
    try {
      if (editing?.transitionId) {
        await updateTransitionMut({ id: editing.transitionId, payload: { ...values, transitionId: editing.transitionId } });
        showAlert('Transition mise à jour');
      } else {
        await createTransitionMut({ ...values, workflowId: Number(workflowId) });
        showAlert('Transition créée');
      }
      setDialogOpen(false);
      setEditing(null);
      await refetch();
    } catch (e) {
      showAlert(e?.message || "Erreur lors de l'enregistrement", 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette transition ?')) return;
    try {
      await deleteTransitionMut(id);
      showAlert('Transition supprimée');
      await refetch();
    } catch (e) {
      showAlert(e?.message || 'Erreur lors de la suppression', 'error');
    }
  };

  const move = (idx, dir) => {
    const arr = [...sortedItems];
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= arr.length) return;
    const tmp = arr[idx];
    arr[idx] = arr[newIdx];
    arr[newIdx] = tmp;
    // reassign ordre (1..N)
    const payload = arr.map((t, i) => ({ transitionId: t.transitionId, ordre: i + 1 }));
    reorderTransitionsMut(payload)
      .then(() => {
        showAlert('Ordre mis à jour');
        setItems(arr.map((t, i) => ({ ...t, ordre: i + 1 })));
      })
      .catch((e) => showAlert(e?.message || "Erreur lors du réordonnancement", 'error'));
  };

  return (
    <Box p={2}>
      <FloatingAlert
        open={alert.open}
        feedBackMessages={alert.message}
        severity={alert.severity}
        onClose={() => setAlert({ ...alert, open: false })}
      />
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Transitions du workflow #{workflowId}</Typography>
        <Stack direction="row" spacing={1}>
          <Button component={RouterLink} to="/admin/workflows" variant="outlined">
            ← Workflows
          </Button>
          <Button variant="contained" onClick={handleCreate} disabled={loading}>
            Nouvelle transition
          </Button>
        </Stack>
      </Stack>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Ordre</TableCell>
              <TableCell>Privilege</TableCell>
              <TableCell>Code</TableCell>
              <TableCell>Libellé</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedItems.map((row, idx) => (
              <TableRow key={row.privilegeCode} hover>
                <TableCell>{row.ordre}</TableCell>
                <TableCell>{row.privilegeCode}</TableCell>
                <TableCell>{row.code}</TableCell>
                <TableCell>{row.libelle}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => move(idx, -1)} title="Monter">
                    <ArrowUpwardIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => move(idx, +1)} title="Descendre">
                    <ArrowDownwardIcon />
                  </IconButton>
                  <IconButton size="small" color="primary" onClick={() => navigate(`/admin/transitions/${row.privilegeCode}/rules`)} title="Règles">
                    <RuleIcon />
                  </IconButton>
                  <IconButton size="small" color="secondary" onClick={() => navigate(`/admin/transitions/${row.privilegeCode}/validation`)} title="Validation">
                    <VerifiedUserIcon />
                  </IconButton>
                  <IconButton size="small" color="success" onClick={() => navigate('/admin/workflow-exec-test')} title="Tester exécution">
                    <PlayArrowIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleEdit(row)} title="Éditer">
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(row.transitionId)} title="Supprimer">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TransitionFormDialog
        key={editing?.transitionId ? `edit-${editing.transitionId}` : `new-${dialogOpen ? 'open' : 'closed'}`}
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditing(null);
        }}
        initialValues={editing}
        onSubmit={handleSubmit}
      />

      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError('')} message={error} />
      <Snackbar open={!!success} autoHideDuration={2000} onClose={() => setSuccess('')} message={success} />
    </Box>
  );
}
