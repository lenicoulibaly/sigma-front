import React, {useState } from 'react';
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
    dropdownFilters = [],
    addButton,
    rowActions = [],
    paramMapper,
    initialPage = 0,
    initialPageSize = 10,
    tableProps = {},
    headerActions,
    enableFixedLayout = 'auto'
}) => {
    // Use the generic controller to manage state and query execution
    const controller = useGenericListController({
        queryHook,
        dropdownFilters,
        paramMapper,
        initialPage,
        initialPageSize,
        searchParamName
    });

    return (
        <Paper elevation={1}>
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

            <Box sx={{ p: 2 }}>
                {/* Filters row with optional Add button aligned at right */}
                <GenericListFilters
                    search={controller.search}
                    onSearchChange={controller.setSearch}
                    searchLabel={searchLabel}
                    searchPlaceholder={searchPlaceholder}
                    dropdownFilters={dropdownFilters}
                    filters={controller.filters}
                    onFiltersChange={controller.setFilterValue}
                    addButton={addButton}
                />

                {/* Data table with actions */}
                <GenericDataTable
                    columns={columns}
                    rows={controller.rows}
                    getRowId={getRowId}
                    rowActions={rowActions}
                    isLoading={controller.isLoading}
                    isError={controller.isError}
                    error={controller.error}
                    enableFixedLayout={enableFixedLayout}
                    tableProps={tableProps}
                />

                {/* Unified pagination */}
                <GenericListPagination
                    totalPages={controller.totalPages}
                    currentPage={controller.currentPage}
                    onPageChange={controller.setPage}
                    currentSize={controller.size}
                    onSizeChange={controller.setSize}
                    totalCount={controller.totalElements}
                />
            </Box>
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
                                sx: PropTypes.object,
                                width: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
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
    enableFixedLayout: PropTypes.oneOfType([
        PropTypes.oneOf(['auto']),
        PropTypes.bool
    ]),
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

// =============== Composable building blocks (filters, table, pagination) ===============
// Use these components independently when you already have a surrounding frame/container.

export function GenericListFilters({
    search,
    onSearchChange,
    searchLabel = 'Rechercher',
    searchPlaceholder = 'Saisir un ou plusieurs critères',
    dropdownFilters = [], // [{ name, label, options:[{value,label}], multi, placeholder }]
    filters = {},
    onFiltersChange, // (name, mappedValue) => void
    addButton // { onClick, tooltip?, label? }
}) {
    const handleAutocompleteChange = (f, newValue) => {
        const mapped = f.multi
            ? (newValue || []).map((o) => o.value ?? o.id)
            : (newValue ? (newValue.value ?? newValue.id) : '');
        onFiltersChange && onFiltersChange(f.name, mapped);
    };

    const AddActionBtn = addButton ? (
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
    ) : null;

    return (
        <Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexGrow: 1, flexWrap: 'wrap' }}>
                    <TextField
                        size="small"
                        label={searchLabel}
                        placeholder={searchPlaceholder}
                        value={search || ''}
                        onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                        sx={{ width: { xs: '100%', sm: 320, md: 380 } }}
                    />
                    {dropdownFilters.map((f) => {
                        const options = f.options || [];
                        const stored = filters?.[f.name];
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
                                onChange={(event, newValue) => handleAutocompleteChange(f, newValue)}
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
                                sx={{ minWidth: { xs: '100%', sm: 220 }, flexShrink: 0 }}
                            />
                        );
                    })}
                </Stack>
                <Box sx={{ alignSelf: { xs: 'flex-end', sm: 'center' } }}>
                    {AddActionBtn}
                </Box>
            </Stack>
        </Box>
    );
}

export function GenericDataTable({
    columns = [],
    rows = [],
    getRowId = (row) => row.id ?? row.uuid ?? row.key,
    rowActions = [],
    isLoading = false,
    isError = false,
    error = null,
    enableFixedLayout = 'auto',
    tableProps = {}
}) {
    const hasFixedWidths = Array.isArray(columns) && columns.some((c) => c && c.width !== undefined && c.width !== null && c.width !== '');
    const fixedLayoutEnabled = enableFixedLayout === 'auto' ? hasFixedWidths : !!enableFixedLayout;
    const cellSx = (col) => {
        if (!col) return undefined;
        const width = col.width;
        const baseSx = {
            ...(col.sx || {})
        };
        if (width !== undefined && width !== null && width !== '') {
            return {
                width,
                maxWidth: width,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                ...baseSx
            };
        }
        return {
            whiteSpace: 'nowrap',
            ...baseSx
        };
    };

    // Feedback & confirmation for row actions
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertSeverity, setAlertSeverity] = useState('info');
    const [confirmState, setConfirmState] = useState({ open: false, action: null, row: null });
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

    return (
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
                <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflowX: 'auto' }}>
                    <Table 
                        size={tableProps.size || 'small'}
                        sx={{ 
                            ...(tableProps.sx || {}), 
                            tableLayout: fixedLayoutEnabled ? 'fixed' : (tableProps?.sx?.tableLayout || undefined),
                            minWidth: fixedLayoutEnabled ? 'auto' : 650
                        }}
                    >
                        {fixedLayoutEnabled && (
                            <colgroup>
                                {columns.map((col, idx) => (
                                    <col key={idx} style={col?.width ? { width: col.width } : undefined} />
                                ))}
                                {rowActions && rowActions.length > 0 && (
                                    <col style={{ width: 72 }} />
                                )}
                            </colgroup>
                        )}
                        <TableHead>
                            <TableRow>
                                {columns.map((col, idx) => (
                                    <TableCell key={idx} sx={cellSx(col)}>{col.header}</TableCell>
                                ))}
                                {rowActions && rowActions.length > 0 && (
                                    <TableCell align="right" sx={{ width: 72, whiteSpace: 'nowrap' }}>Actions</TableCell>
                                )}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rows.map((row, rIdx) => (
                                <TableRow key={getRowId(row) ?? rIdx} hover>
                                    {columns.map((col, cIdx) => (
                                        <TableCell key={cIdx} sx={cellSx(col)}>
                                            {col.render ? col.render(row) : row[col.field]}
                                        </TableCell>
                                    ))}
                                    {rowActions && rowActions.length > 0 && (
                                        <TableCell align="right" sx={{ width: 72 }}>
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
        </Box>
    );
}

export function GenericListPagination(props) {
    // Thin wrapper to keep API consistent and allow future customization
    return <Pagination {...props} />;
}

export function useGenericListController({
    queryHook,
    dropdownFilters = [],
    paramMapper,
    initialPage = 0,
    initialPageSize = 10,
    searchParamName = 'key'
}) {
    const [page, setPage] = useState(initialPage);
    const [size, setSize] = useState(initialPageSize);
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState(() => {
        const init = {};
        dropdownFilters.forEach((f) => (init[f.name] = f.multi ? [] : ''));
        return init;
    });

    const params = React.useMemo(() => {
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

    const query = queryHook ? queryHook(params) : { data: null, isLoading: false, isError: false, error: null };

    const data = query?.data || {};
    const rows = data?.content ?? data?.items ?? [];
    const totalPages = data?.totalPages ?? data?.totalPage ?? 0;
    const totalElements = data?.totalElements ?? data?.total ?? rows.length;
    const currentPage = data?.number ?? data?.page ?? page;

    return {
        // state
        page,
        size,
        search,
        filters,
        // setters
        setPage,
        setSize: (newSize) => { setSize(newSize); setPage(0); },
        setSearch: (val) => { setSearch(val); setPage(0); },
        setFilterValue: (name, value) => { setFilters((prev) => ({ ...prev, [name]: value })); setPage(0); },
        // params and data
        params,
        rows,
        totalPages,
        totalElements,
        currentPage,
        // query status
        isLoading: query?.isLoading,
        isError: query?.isError,
        error: query?.error
    };
}
