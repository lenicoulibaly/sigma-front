import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem as MuiMenuItem,
  OutlinedInput,
  InputAdornment,
  ListItemIcon
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ListIcon from '@mui/icons-material/List';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { IconSearch } from '@tabler/icons-react';
import { useSearchWorkflows, useUpdateWorkflow, useDeleteWorkflow } from 'src/sigma/hooks/query/useWorkflowAdmin';
import WorkflowFormDialog from './WorkflowFormDialog';
import { useNavigate, useLocation } from 'react-router-dom';
import Pagination from '../../components/commons/Pagination';
import CustomAlertDialog from '../../components/commons/CustomAlertDialog';
import FloatingAlert from '../../components/commons/FloatingAlert';

export default function WorkflowsListPage() {
  // Alert state
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('info');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  // Pagination and filters (server-side)
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  // activeFilter: 'all' | 'active' | 'inactive'
  const [activeFilter, setActiveFilter] = useState('all');

  // Row menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const [selected, setSelected] = useState(null);

  // Delete confirmation dialog
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const restoredRef = useRef(false);

  // Map activeFilter to API param
  const activeParam = activeFilter === 'all' ? undefined : activeFilter === 'active';

  // Server-side search + pagination
  const { data, isLoading, refetch } = useSearchWorkflows({
    key: searchTerm || undefined,
    active: activeParam,
    page,
    size: pageSize,
  });

  // Mutations
  const { mutateAsync: updateWorkflowMut } = useUpdateWorkflow();
  const { mutateAsync: deleteWorkflowMut } = useDeleteWorkflow();

  // Restore state after returning from details
  useEffect(() => {
    if (restoredRef.current) return;
    const restore = location.state?.restore;
    if (restore) {
      const { page: rPage, size: rSize, key, activeFilter: rActiveFilter } = restore;
      if (typeof rPage === 'number') setPage(rPage);
      if (typeof rSize === 'number') setPageSize(rSize);
      if (typeof key === 'string') setSearchTerm(key);
      if (typeof rActiveFilter === 'string') setActiveFilter(rActiveFilter);
      restoredRef.current = true;
      // Clear the navigation state to avoid reapplying on future updates
      navigate('/admin/workflows', { replace: true });
    }
  }, [location.state, navigate]);

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
        await updateWorkflowMut({ id: editing.id, payload: values });
        setAlertMessage('Workflow mis à jour');
        setAlertSeverity('success');
      } else {
        // La création est gérée dans le formulaire via le hook useCreateWorkflow
        setAlertMessage('Workflow créé');
        setAlertSeverity('success');
      }
      setAlertOpen(true);
      setDialogOpen(false);
      await refetch();
    } catch (e) {
      setAlertMessage(e?.message || "Erreur lors de l'enregistrement");
      setAlertSeverity('error');
      setAlertOpen(true);
    }
  };

  const requestDelete = (wf) => {
    setSelected(wf);
    setOpenDeleteDialog(true);
    closeMenu();
  };

  const confirmDelete = async () => {
    try {
      await deleteWorkflowMut(selected.id);
      setAlertMessage('Workflow supprimé');
      setAlertSeverity('success');
      setAlertOpen(true);
      setOpenDeleteDialog(false);
      setSelected(null);
      await refetch();
    } catch (e) {
      setAlertMessage(e?.message || 'Erreur lors de la suppression');
      setAlertSeverity('error');
      setAlertOpen(true);
    }
  };

  // Menu handlers
  const openMenu = (event, wf) => {
    setAnchorEl(event.currentTarget);
    setSelected(wf);
  };
  const closeMenu = () => setAnchorEl(null);

  // Server pagination info from backend
  const totalPages = data?.totalPages ?? 0;
  const currentPage = data?.number ?? page;
  const totalElements = data?.totalElements ?? 0;

  return (
  <Box p={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        {/* Search area replacing title */}
        <Stack direction="row" spacing={1} sx={{ flex: 1 }}>
          <OutlinedInput
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
            placeholder="Rechercher (code, libellé)"
            startAdornment={<InputAdornment position="start"><IconSearch size={18} /></InputAdornment>}
            size="small"
            sx={{ maxWidth: 360 }}
          />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Statut</InputLabel>
            <Select label="Statut" value={activeFilter} onChange={(e) => { setActiveFilter(e.target.value); setPage(0); }}>
              <MuiMenuItem value="all">Tous</MuiMenuItem>
              <MuiMenuItem value="active">Actifs</MuiMenuItem>
              <MuiMenuItem value="inactive">Inactifs</MuiMenuItem>
            </Select>
          </FormControl>
        </Stack>
        {/* Icon-only add button with tooltip, same style as Users list */}
        <Tooltip title="Ajouter un workflow" placement="top" arrow>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={isLoading}
            sx={{ minWidth: '40px', width: '40px', height: '40px', p: 0 }}
            color="secondary"
          >
            <AddIcon />
          </Button>
        </Tooltip>
      </Stack>

      <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
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
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : ( (data?.content || []).length > 0 ? (
              (data?.content || []).map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{row.code}</TableCell>
                  <TableCell>{row.libelle}</TableCell>
                  <TableCell>{row.targetTableNameCode}</TableCell>
                  <TableCell>
                    {row.active ? <Chip size="small" color="success" label="Actif" /> : <Chip size="small" color="default" label="Inactif" />}
                  </TableCell>
                  <TableCell align="right">
                    {/* Seul le menu déroulant doit rester */}
                    <IconButton size="small" onClick={(e) => openMenu(e, row)}>
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Aucun résultat
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination server-side */}
      <Pagination
        count={totalPages}
        page={currentPage}
        onPageChange={(newPage) => setPage(newPage)}
        rowsPerPage={pageSize}
        onRowsPerPageChange={(size) => { setPageSize(size); setPage(0); }}
        totalCount={totalElements}
      />

      {/* Row actions menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        {/* 1. Éditer */}
        <MenuItem onClick={() => { closeMenu(); selected && handleEdit(selected); }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          Éditer
        </MenuItem>
        {/* Détails (onglet 0) */}
        <MenuItem onClick={() => { closeMenu(); selected && navigate(`/admin/workflows/${selected.id}`, { state: { tabIndex: 0, listParams: { page, size: pageSize, key: searchTerm, activeFilter } } }); }}>
          <ListItemIcon>
            <ListIcon fontSize="small" />
          </ListItemIcon>
          Ouvrir (Détails)
        </MenuItem>
        {/* Étapes (onglet 1) */}
        <MenuItem onClick={() => { closeMenu(); selected && navigate(`/admin/workflows/${selected.id}`, { state: { tabIndex: 1, listParams: { page, size: pageSize, key: searchTerm, activeFilter } } }); }}>
          <ListItemIcon>
            <ListIcon fontSize="small" />
          </ListItemIcon>
          Étapes
        </MenuItem>
        {/* Transitions (onglet 2) */}
        <MenuItem onClick={() => { closeMenu(); selected && navigate(`/admin/workflows/${selected.id}`, { state: { tabIndex: 2, listParams: { page, size: pageSize, key: searchTerm, activeFilter } } }); }}>
          <ListItemIcon>
            <ListIcon fontSize="small" />
          </ListItemIcon>
          Transitions
        </MenuItem>
        {/* 6. Supprimer */}
        <MenuItem onClick={() => selected && requestDelete(selected)} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteOutlineIcon fontSize="small" />
          </ListItemIcon>
          Supprimer
        </MenuItem>
      </Menu>

      <WorkflowFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} initialValues={editing} onSubmit={handleSubmit} />

      {/* Delete confirmation */}
      <CustomAlertDialog
        open={openDeleteDialog}
        handleClose={() => setOpenDeleteDialog(false)}
        handleConfirm={confirmDelete}
        title="Confirmation"
        content={`Supprimer le workflow "${selected?.code || ''}" ?`}
        confirmBtnText="Supprimer"
        cancelBtnText="Annuler"
      />

      {/* Floating alerts like UsersList */}
      <FloatingAlert open={alertOpen} onClose={() => setAlertOpen(false)} feedBackMessages={alertMessage} severity={alertSeverity} />
    </Box>
  );
}
