import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';

// mui
import { Stack, Box, TextField, Button, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, CircularProgress, Tooltip, Autocomplete, IconButton, Menu, MenuItem } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';

// local
import Pagination from './Pagination';
import CustomAlertDialog from './CustomAlertDialog';
import FloatingAlert from './FloatingAlert';

// ==============================|| GENERIC SEARCHABLE PAGINATED LIST ||============================== //

const GenericSearchablePaginatedList = ({
    title,
    queryHook,
    columns,
    getRowId = (row) => row.id ?? row.uuid ?? row.key,
    searchLabel = 'Rechercher',
    searchPlaceholder = 'Saisir un ou plusieurs critères',
    searchParamName = 'key',
    dropdownFilters = [], // [{ name, label, options, multi }]
    addButton, // { onClick, tooltip? , label? (ignored for UI) }
    rowActions = [], // [{ label, icon, onClick(row)?, mutation?: { mutate, variablesMapper? }, confirm?: { title, content, confirmBtnText, cancelBtnText }, visible?(row):bool, disabled?(row):bool }]
    paramMapper, // (state) => params
    initialPage = 0,
    initialPageSize = 10,
    tableProps = {},
    headerActions // optional render on top right
}) => {
    const [page, setPage] = useState(initialPage);
    const [size, setSize] = useState(initialPageSize);
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState(() => {
        const init = {};
        dropdownFilters.forEach((f) => (init[f.name] = f.multi ? [] : ''));
        return init;
    });

    const params = useMemo(() => {
        const base = { page, size };
        if (search && searchParamName) base[searchParamName] = search;
        dropdownFilters.forEach((f) => {
            const v = filters[f.name];
            if (v !== undefined && v !== null && (Array.isArray(v) ? v.length > 0 : v !== '')) {
                base[f.name] = v;
            }
        });
        return paramMapper ? paramMapper({ page, size, search, filters }) : base;
    }, [page, size, search, filters, dropdownFilters, searchParamName, paramMapper]);

    const { data, isLoading, isError, error } = queryHook(params);

    const rows = data?.content ?? data?.items ?? [];
    const totalPages = data?.totalPages ?? data?.totalPage ?? 0;
    const totalElements = data?.totalElements ?? data?.total ?? rows.length;
    const currentPage = data?.number ?? data?.page ?? page;

    // Feedback alert state for row action mutations
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertSeverity, setAlertSeverity] = useState('info');

    const handleFilterChange = (name) => (event) => {
        const value = event.target.value;
        setFilters((prev) => ({ ...prev, [name]: value }));
        setPage(0);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPage(0);
    };

    // Row actions & confirmation dialog state
    const [confirmState, setConfirmState] = useState({ open: false, action: null, row: null });
    // Row actions menu state
    const [menuState, setMenuState] = useState({ anchorEl: null, row: null, rowKey: null });

    const openActionsMenu = (event, row) => {
        setMenuState({ anchorEl: event.currentTarget, row, rowKey: getRowId(row) });
    };
    const closeActionsMenu = () => setMenuState({ anchorEl: null, row: null, rowKey: null });

    const runActionNow = (action, row) => {
        if (!action) return;
        if (typeof action.onClick === 'function') {
            action.onClick(row);
            return;
        }
        if (action.mutation && typeof action.mutation.mutate === 'function') {
            const vars = action.mutation.variablesMapper ? action.mutation.variablesMapper(row) : row;
            // Wrap mutation to provide success/error feedback
            action.mutation.mutate(vars, {
                onSuccess: () => {
                    const msg = action.successMessage || `${action.label || 'Action'} effectuée avec succès`;
                    setAlertMessage(msg);
                    setAlertSeverity('success');
                    setAlertOpen(true);
                },
                onError: (err) => {
                    const apiMsg = err?.response?.data || err?.message || 'Erreur inconnue';
                    const msg = action.errorMessage || `Erreur lors de l'exécution de l'action${action.label ? ` « ${action.label} »` : ''} : ${apiMsg}`;
                    setAlertMessage(msg);
                    setAlertSeverity('error');
                    setAlertOpen(true);
                }
            });
        }
    };

    const onTriggerAction = (action, row) => {
        if (action?.confirm) {
            setConfirmState({ open: true, action, row });
        } else {
            runActionNow(action, row);
        }
    };

    const closeConfirm = () => setConfirmState({ open: false, action: null, row: null });

    const confirmAndRun = () => {
        if (confirmState.action && confirmState.row) {
            runActionNow(confirmState.action, confirmState.row);
        }
        closeConfirm();
    };

    const AddActionButton = () => (
        <Tooltip title={addButton?.tooltip || addButton?.label || 'Ajouter'} arrow>
            <Button
                variant="contained"
                color="primary"
                size="small"
                onClick={addButton.onClick}
                sx={{ minWidth: 0, p: 1.0 }}
                aria-label={addButton?.tooltip || addButton?.label || 'Ajouter'}
            >
                <AddIcon fontSize="small" />
            </Button>
        </Tooltip>
    );

    return (
        <Paper elevation={1}>
            {/* Header */}
            {(title || headerActions) && (
                <Box sx={{ px: 2, py: 2, borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography variant="h4">{title}</Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                            {headerActions && headerActions()}
                        </Stack>
                    </Stack>
                </Box>
            )}

            {/* Content */}
            <Box sx={{ p: 2 }}>
                {/* Search + Filters */}
                <Box>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexGrow: 1, flexWrap: 'wrap' }}>
                            <TextField
                                size="small"
                                label={searchLabel}
                                placeholder={searchPlaceholder}
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                                sx={{ width: { xs: '100%', sm: 320, md: 380 } }}
                            />
                            {dropdownFilters.map((f) => {
                                const options = f.options || [];
                                const stored = filters[f.name];
                                const value = f.multi
                                    ? options.filter((opt) => Array.isArray(stored) && stored.includes(opt.value ?? opt.id))
                                    : options.find((opt) => (opt.value ?? opt.id) === stored) || null;
                                return (
                                    <Autocomplete
                                        key={f.name}
                                        options={options}
                                        multiple={!!f.multi}
                                        size="small"
                                        value={value}
                                        onChange={(event, newValue) => {
                                            const mapped = f.multi
                                                ? (newValue || []).map((o) => o.value ?? o.id)
                                                : (newValue ? (newValue.value ?? newValue.id) : '');
                                            setFilters((prev) => ({ ...prev, [f.name]: mapped }));
                                            setPage(0);
                                        }}
                                        getOptionLabel={(option) => option.label ?? option.name ?? String(option.value ?? option.id ?? '')}
                                        isOptionEqualToValue={(opt, val) => (opt.value ?? opt.id) === (val.value ?? val.id)}
                                        renderTags={(tagValue, getTagProps) =>
                                            tagValue.map((option, index) => (
                                                <Chip {...getTagProps({ index })} size="small" key={(option.value ?? option.id) + '-' + index} label={option.label ?? option.name ?? String(option.value ?? option.id)} />
                                            ))
                                        }
                                        renderInput={(params) => (
                                            <TextField {...params} label={f.label} placeholder={f.placeholder} />
                                        )}
                                        sx={{ minWidth: 220, flexShrink: 0 }}
                                    />
                                );
                            })}
                        </Stack>
                        {addButton && <AddActionButton />}
                    </Stack>
                </Box>

                {/* Data table */}
                <Box sx={{ mt: 2 }}>
                    {isLoading ? (
                        <Stack alignItems="center" justifyContent="center" sx={{ p: 4 }}>
                            <CircularProgress />
                        </Stack>
                    ) : isError ? (
                        <Box sx={{ p: 2 }}>
                            <Typography color="error">Erreur lors du chargement: {error?.message || 'inconnue'}</Typography>
                        </Box>
                    ) : rows?.length === 0 ? (
                        <Box sx={{ p: 2 }}>
                            <Typography>Aucun élément trouvé.</Typography>
                        </Box>
                    ) : (
                        <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
                            <Table size={tableProps.size || 'small'}>
                                <TableHead>
                                    <TableRow>
                                        {columns.map((col, idx) => (
                                            <TableCell key={idx} sx={col.sx}>{col.header}</TableCell>
                                        ))}
                                        {rowActions && rowActions.length > 0 && (
                                            <TableCell align="right" sx={{ width: 1, whiteSpace: 'nowrap' }}>Actions</TableCell>
                                        )}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {rows.map((row, rIdx) => (
                                        <TableRow key={getRowId(row) ?? rIdx} hover>
                                            {columns.map((col, cIdx) => (
                                                <TableCell key={cIdx} sx={col.sx}>
                                                    {col.render ? col.render(row) : row[col.field]}
                                                </TableCell>
                                            ))}
                                            {rowActions && rowActions.length > 0 && (
                                                <TableCell align="right">
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => openActionsMenu(e, row)}
                                                        aria-label="actions"
                                                    >
                                                        <MoreVertIcon fontSize="small" />
                                                    </IconButton>
                                                    <Menu
                                                        anchorEl={menuState.anchorEl}
                                                        open={Boolean(menuState.anchorEl) && menuState.rowKey === getRowId(row)}
                                                        onClose={closeActionsMenu}
                                                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                                                    >
                                                        {rowActions
                                                            .filter((a) => (typeof a.visible === 'function' ? a.visible(row) : a.visible !== false))
                                                            .map((action, i) => {
                                                                const disabled = typeof action.disabled === 'function' ? action.disabled(row) : !!action.disabled;
                                                                const handle = () => {
                                                                    closeActionsMenu();
                                                                    onTriggerAction(action, row);
                                                                };
                                                                return (
                                                                    <MenuItem key={i} onClick={handle} disabled={disabled}>
                                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                                            <span style={{ display: 'inline-flex', color: 'inherit' }}>{action.icon}</span>
                                                                            <span>{action.label}</span>
                                                                        </Stack>
                                                                    </MenuItem>
                                                                );
                                                            })}
                                                    </Menu>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Box>

                {/* Pagination */}
                <Box sx={{ mt: 1 }}>
                    <Pagination
                        totalPages={totalPages}
                        currentPage={currentPage}
                        onPageChange={setPage}
                        currentSize={size}
                        onSizeChange={(newSize) => {
                            setSize(newSize);
                            setPage(0);
                        }}
                        totalCount={totalElements}
                    />
                </Box>
            </Box>

            {/* Confirm dialog for row actions */}
            <CustomAlertDialog
                open={confirmState.open}
                handleClose={closeConfirm}
                handleConfirm={confirmAndRun}
                title={confirmState.action?.confirm?.title || 'Confirmation'}
                content={confirmState.action?.confirm?.content || 'Confirmez-vous cette action ?'}
                confirmBtnText={confirmState.action?.confirm?.confirmBtnText || 'Confirmer'}
                cancelBtnText={confirmState.action?.confirm?.cancelBtnText || 'Annuler'}
            />
            {/* Floating feedback alert */}
            <FloatingAlert
                open={alertOpen}
                feedBackMessages={alertMessage}
                severity={alertSeverity}
                onClose={() => setAlertOpen(false)}
            />
        </Paper>
    );
};

GenericSearchablePaginatedList.propTypes = {
    title: PropTypes.string,
    queryHook: PropTypes.func.isRequired,
    columns: PropTypes.arrayOf(
        PropTypes.shape({
            header: PropTypes.node,
            field: PropTypes.string,
            render: PropTypes.func,
            sx: PropTypes.object
        })
    ).isRequired,
    getRowId: PropTypes.func,
    searchLabel: PropTypes.string,
    searchPlaceholder: PropTypes.string,
    searchParamName: PropTypes.string,
    dropdownFilters: PropTypes.arrayOf(
        PropTypes.shape({ name: PropTypes.string.isRequired, label: PropTypes.string.isRequired, options: PropTypes.array, multi: PropTypes.bool })
    ),
    addButton: PropTypes.shape({ label: PropTypes.string, tooltip: PropTypes.string, onClick: PropTypes.func }),
    paramMapper: PropTypes.func,
    initialPage: PropTypes.number,
    initialPageSize: PropTypes.number,
    tableProps: PropTypes.object,
    headerActions: PropTypes.func,
    rowActions: PropTypes.arrayOf(
        PropTypes.shape({
            label: PropTypes.string.isRequired,
            icon: PropTypes.node.isRequired,
            color: PropTypes.string,
            onClick: PropTypes.func, // (row) => void
            mutation: PropTypes.shape({
                mutate: PropTypes.func.isRequired,
                variablesMapper: PropTypes.func // (row) => any
            }),
            confirm: PropTypes.shape({
                title: PropTypes.string,
                content: PropTypes.string,
                confirmBtnText: PropTypes.string,
                cancelBtnText: PropTypes.string
            }),
            visible: PropTypes.func, // (row) => bool
            disabled: PropTypes.oneOfType([PropTypes.bool, PropTypes.func]),
            successMessage: PropTypes.string,
            errorMessage: PropTypes.string
        })
    )
};

export default GenericSearchablePaginatedList;
