import React, { useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';

// Import SectionsList component
import SectionsList from '../sections/SectionsList';
import DocumentsList from '../documents/DocumentsList';
import { useAssociationDetails } from '../../../hooks/query/useAssociations';

// material-ui
import { useTheme } from '@mui/material/styles';
import {
    Box,
    Grid,
    Tab,
    Tabs,
    Typography,
    Card,
    CardContent,
    Avatar,
    Stack,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Tooltip
} from '@mui/material';

// project imports
import MainCard from 'ui-component/cards/MainCard';
import { gridSpacing } from 'store/constant';
import { ThemeMode } from 'config';

// assets
import InfoIcon from '@mui/icons-material/Info';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PaidIcon from '@mui/icons-material/Paid';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DescriptionIcon from '@mui/icons-material/Description';
import { IconCoin } from '@tabler/icons-react';

// tabs panel
function TabPanel({ children, value, index, ...other }) {
    return (
        <div role="tabpanel" hidden={value !== index} id={`association-tabpanel-${index}`} aria-labelledby={`association-tab-${index}`} {...other}>
            {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
        </div>
    );
}

// tabs option
const tabsOption = [
    {
        label: 'Détails',
        icon: <InfoIcon sx={{ fontSize: '1.3rem' }} />
    },
    {
        label: 'Liste des Sections',
        icon: <AccountTreeIcon sx={{ fontSize: '1.3rem' }} />
    },
    {
        label: 'Documents',
        icon: <DescriptionIcon sx={{ fontSize: '1.3rem' }} />
    },
    {
        label: 'Liste des membres',
        icon: <GroupsIcon sx={{ fontSize: '1.3rem' }} />
    },
    {
        label: 'Liste des demandes d\'adhésion',
        icon: <PersonAddIcon sx={{ fontSize: '1.3rem' }} />
    },
    {
        label: 'Liste des cotisations',
        icon: <PaidIcon sx={{ fontSize: '1.3rem' }} />
    }
];

// ==============================|| ASSOCIATION DETAILS ||============================== //

const AssociationDetails = () => {
    const theme = useTheme();
    const { assoId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    // Get the tab index from the location state or default to 0 (Details tab)
    const initialTabIndex = location.state?.tabIndex || 0;
    const [value, setValue] = useState(initialTabIndex);
    const { data: association, isLoading } = useAssociationDetails(assoId);

    // Handle back button click
    const handleBack = () => {
        navigate('/business/associations/list');
    };


    // Handle tab change
    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    // Details Tab Content
    const DetailsTab = () => {
        if (!association) return null;

        return (
            <Grid container spacing={gridSpacing}>
                <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Grid item xs={12}>
                        <Typography variant="h4" gutterBottom>
                            Informations générales
                        </Typography>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <Stack direction="row" spacing={2} alignItems="center">
                                            {association.logo ? (
                                                <Avatar
                                                    src={`data:image/png;base64,${association.logo}`}
                                                    alt={association.assoName}
                                                    sx={{ width: 64, height: 64 }}
                                                />
                                            ) : (
                                                <Avatar
                                                    sx={{
                                                        width: 64,
                                                        height: 64,
                                                        bgcolor: theme.palette.primary.light,
                                                        color: theme.palette.primary.dark
                                                    }}
                                                >
                                                    {association.sigle.charAt(0)}
                                                </Avatar>
                                            )}
                                            <Box>
                                                <Typography variant="h5">{association.assoName}</Typography>
                                                <Typography variant="subtitle2" color="textSecondary">
                                                    {association.sigle}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Divider />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Grid container spacing={1}>
                                            <Grid item xs={6}>
                                                <Typography variant="subtitle2" color="textSecondary">
                                                    Situation géo
                                                </Typography>
                                                <Typography variant="body2">
                                                    {association.situationGeo}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="subtitle2" color="textSecondary">
                                                    Droit d'adhésion
                                                </Typography>
                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                    <IconCoin size="1rem" />
                                                    <Typography variant="body2">
                                                        {association.droitAdhesion} FCFA
                                                    </Typography>
                                                </Stack>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="subtitle2" color="textSecondary">
                                                    Structures
                                                </Typography>
                                                <Typography variant="body2">
                                                    {association.structures}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="subtitle2" color="textSecondary">
                                                    Nombre de membres
                                                </Typography>
                                                <Typography variant="body2">
                                                    {association.nbrMembres}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="subtitle2" color="textSecondary">
                                                    Téléphone
                                                </Typography>
                                                <Typography variant="body2">
                                                    {association.tel}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="subtitle2" color="textSecondary">
                                                    Email
                                                </Typography>
                                                <Typography variant="body2">
                                                    {association.email}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Grid item xs={12}>
                        <Typography variant="h4" gutterBottom>
                            Conditions d'adhésion
                        </Typography>
                    </Grid>
                    <Grid container spacing={gridSpacing}>
                        <Grid item xs={12}>
                            <Card>
                                <CardContent>
                                    <Box 
                                        dangerouslySetInnerHTML={{ __html: association.conditionsAdhesion || '' }} 
                                        sx={{ '& ul': { pl: 2 }, '& p': { mb: 1 } }}
                                    />
                                </CardContent>
                            </Card>
                        </Grid>


                        <Grid item xs={12}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h5" gutterBottom>
                                        Liste des pièces à fournir
                                    </Typography>
                                    <TableContainer component={Paper} variant="outlined">
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>N°</TableCell>
                                                    <TableCell>Type de pièce</TableCell>
                                                    <TableCell>Statut</TableCell>
                                                    <TableCell>Description</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {(association.piecesAFournir || []).map((piece, index) => (
                                                    <TableRow key={piece.pieceId ?? index}>
                                                        <TableCell>{index + 1}</TableCell>
                                                        <TableCell>{piece.typePieceName}</TableCell>
                                                        <TableCell>{piece.statutObligationName}</TableCell>
                                                        <TableCell>{piece.description}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        );
    };

    // Placeholder components for other tabs
    const SectionsTab = () => {
        // Use the association ID from the current association
        const assoId = association?.assoId;

        return (
            <Box>
                {/* Pass the association ID to the SectionsList component */}
                {assoId && <SectionsList assoId={assoId} />}
            </Box>
        );
    };

    const DocumentsTab = () => {
        const assoId = association?.assoId;
        return (
            <Box>
                {assoId && (
                    <DocumentsList
                        tableName="ASSOCIATION"
                        objectId={Number(assoId)}
                        parentDocTypeCode="DOC_ASSO"
                    />
                )}
            </Box>
        );
    };

    const MembersTab = () => (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4">Liste des membres</Typography>
            <Typography variant="body1">Ce contenu sera implémenté ultérieurement.</Typography>
        </Box>
    );

    const MembershipRequestsTab = () => (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4">Liste des demandes d'adhésion</Typography>
            <Typography variant="body1">Ce contenu sera implémenté ultérieurement.</Typography>
        </Box>
    );

    const ContributionsTab = () => (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4">Liste des cotisations</Typography>
            <Typography variant="body1">Ce contenu sera implémenté ultérieurement.</Typography>
        </Box>
    );

    return (
        <MainCard 
            title={
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Tooltip title="Retour à la liste des associations">
                        <IconButton onClick={handleBack} size="small">
                            <ArrowBackIcon />
                        </IconButton>
                    </Tooltip>
                    <Typography variant="h3">
                        {association ? `${association.assoName} (${association.sigle})` : "Détails de l'association"}
                    </Typography>
                </Stack>
            }
            loading={isLoading}
        >
            <Grid container spacing={gridSpacing}>
                <Grid item xs={12}>
                    <Tabs
                        value={value}
                        indicatorColor="primary"
                        textColor="primary"
                        onChange={handleChange}
                        aria-label="association tabs"
                        variant="scrollable"
                        sx={{
                            mb: 3,
                            '& a': {
                                minHeight: 'auto',
                                minWidth: 10,
                                py: 1.5,
                                px: 1,
                                mr: 2.25,
                                color: theme.palette.mode === ThemeMode.DARK ? 'grey.600' : 'grey.900',
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center'
                            },
                            '& a.Mui-selected': {
                                color: 'primary.main'
                            },
                            '& .MuiTabs-indicator': {
                                bottom: 2
                            },
                            '& a > svg': {
                                marginBottom: '0px !important',
                                mr: 1.25
                            }
                        }}
                    >
                        {tabsOption.map((tab, index) => (
                            <Tab key={index} icon={tab.icon} label={tab.label} id={`association-tab-${index}`} aria-controls={`association-tabpanel-${index}`} />
                        ))}
                    </Tabs>

                    <TabPanel value={value} index={0}>
                        <DetailsTab />
                    </TabPanel>
                    <TabPanel value={value} index={1}>
                        <SectionsTab />
                    </TabPanel>
                    <TabPanel value={value} index={2}>
                        <DocumentsTab />
                    </TabPanel>
                    <TabPanel value={value} index={3}>
                        <MembersTab />
                    </TabPanel>
                    <TabPanel value={value} index={4}>
                        <MembershipRequestsTab />
                    </TabPanel>
                    <TabPanel value={value} index={5}>
                        <ContributionsTab />
                    </TabPanel>
                </Grid>
            </Grid>
        </MainCard>
    );
};

export default AssociationDetails;
