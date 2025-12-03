import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import {
    IconButton,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
    CircularProgress,
    Menu,
    MenuItem,
    Button,
    Grid,
    InputAdornment,
    OutlinedInput
} from '@mui/material';

// project imports
import Pagination from '../../../components/commons/Pagination';
import FloatingAlert from '../../../components/commons/FloatingAlert';
import { useSearchSections } from '../../../hooks/query/useSections';

// assets
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';
import { IconSearch } from '@tabler/icons-react';

// ==============================|| SECTIONS LIST ||============================== //

const SectionsList = ({ assoId }) => {
    const theme = useTheme();
    const navigate = useNavigate();
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');

    // State for alerts
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertSeverity, setAlertSeverity] = useState('info');

    // Handle search
    const handleSearch = (event) => {
        setSearchTerm(event.target.value);
    };

    // State for action menu
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedSection, setSelectedSection] = useState(null);

    // Handle add new section
    const handleAddSection = () => {
        setAlertMessage('Ajout d\'une nouvelle section');
        setAlertSeverity('info');
        setAlertOpen(true);
        // Navigate to add section page or open modal (to be implemented)
    };

    // No longer need to listen for the addSection event as we handle it directly

    // Use the association ID from props or default to 1 (as mentioned in requirements)
    const associationId = assoId || 1;

    // Fetch sections data using the hook
    const { data: sectionsData, isLoading, error } = useSearchSections({
        assoId: associationId,
        key: searchTerm || '',
        page,
        size: pageSize
    });

    // Handle page change
    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    // Handle page size change
    const handlePageSizeChange = (newSize) => {
        setPageSize(newSize);
        setPage(0); // Reset to first page when changing page size
    };

    // Handle action menu open
    const handleActionMenuOpen = (event, section) => {
        setAnchorEl(event.currentTarget);
        setSelectedSection(section);
    };

    // Handle action menu close
    const handleActionMenuClose = () => {
        setAnchorEl(null);
        setSelectedSection(null);
    };

    // Handle action menu item click
    const handleActionClick = (action) => {
        if (selectedSection) {
            if (action === 'details') {
                // Navigate to section details page (to be implemented)
                setAlertMessage(`Affichage des détails de la section ${selectedSection.sectionName}`);
                setAlertSeverity('info');
                setAlertOpen(true);
            } else if (action === 'edit') {
                // Navigate to section edit page (to be implemented)
                setAlertMessage(`Modification de la section ${selectedSection.sectionName}`);
                setAlertSeverity('info');
                setAlertOpen(true);
            } else if (action === 'members-list') {
                // Navigate to section members list page (to be implemented)
                setAlertMessage(`Liste des membres de la section ${selectedSection.sectionName}`);
                setAlertSeverity('info');
                setAlertOpen(true);
            } else {
                // Here you would implement other actions
                setAlertMessage(`Action "${action}" sur ${selectedSection.sectionName}`);
                setAlertSeverity('info');
                setAlertOpen(true);
            }
            handleActionMenuClose();
        }
    };

    // Handle alert close
    const handleAlertClose = () => {
        setAlertOpen(false);
    };

    return (
        <>
            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6} md={8}>
                    <OutlinedInput
                        id="input-search-section"
                        placeholder="Search"
                        fullWidth
                        size="small"
                        value={searchTerm}
                        onChange={handleSearch}
                        startAdornment={
                            <InputAdornment position="start">
                                <IconSearch stroke={1.5} size="1rem" />
                            </InputAdornment>
                        }
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={4} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Tooltip title="Ajouter une section">
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleAddSection}
                            sx={{ minWidth: '40px', p: '8px' }}
                        >
                            <AddIcon />
                        </Button>
                    </Tooltip>
                </Grid>
            </Grid>

            <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>N°</TableCell>
                            <TableCell>Nom</TableCell>
                            <TableCell>Structure</TableCell>
                            <TableCell>Situation géographique</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Téléphone</TableCell>
                            <TableCell align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    <CircularProgress color="primary" />
                                </TableCell>
                            </TableRow>
                        ) : error ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    <Typography color="error">Erreur lors du chargement des données</Typography>
                                </TableCell>
                            </TableRow>
                        ) : sectionsData?.content?.length > 0 ? (
                            sectionsData.content.map((section) => (
                                <TableRow key={section.sectionId}>
                                    <TableCell>{section.sectionId}</TableCell>
                                    <TableCell>
                                        <Typography variant="subtitle1">{section.sectionName}</Typography>
                                    </TableCell>
                                    <TableCell>{section.strName || section.strSigle}</TableCell>
                                    <TableCell>{section.situationGeo}</TableCell>
                                    <TableCell>{section.email}</TableCell>
                                    <TableCell>{section.tel}</TableCell>
                                    <TableCell align="center">
                                        <IconButton 
                                            color="primary" 
                                            size="small" 
                                            onClick={(e) => handleActionMenuOpen(e, section)}
                                        >
                                            <MoreVertIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    <Typography variant="subtitle1">Aucune section trouvée</Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {sectionsData && (
                <Pagination
                    totalPages={sectionsData.totalPages || 0}
                    currentPage={page}
                    onPageChange={handlePageChange}
                    currentSize={pageSize}
                    onSizeChange={handlePageSizeChange}
                    totalCount={sectionsData.totalElements || 0}
                    sx={{ mt: 3 }}
                />
            )}

            {/* Action Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleActionMenuClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
            >
                <MenuItem onClick={() => handleActionClick('details')}>Détails</MenuItem>
                <MenuItem onClick={() => handleActionClick('edit')}>Modifier</MenuItem>
                <MenuItem onClick={() => handleActionClick('members-list')}>Liste des membres</MenuItem>
            </Menu>

            {/* Alert for feedback */}
            <FloatingAlert
                open={alertOpen}
                feedBackMessages={alertMessage}
                severity={alertSeverity}
                timeout={alertSeverity === 'error' ? 7 : 3}
                onClose={handleAlertClose}
            />
        </>
    );
};

SectionsList.propTypes = {
    assoId: PropTypes.number
};

export default SectionsList;
