import { useEffect, useRef, useState } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import PerfectScrollbar from 'react-perfect-scrollbar';

// project imports
import MainCard from 'ui-component/cards/MainCard';
import Transitions from 'ui-component/extended/Transitions';
import UserProfilesModal from './UserProfilesModal';
import ChangePasswordModal from './ChangePasswordModal';
import useAuth from 'hooks/useAuth';
import { useActiveUserProfiles } from 'src/sigma/hooks/query/useAuthorities';
import User1 from 'assets/images/users/user-round.svg';
import { ThemeMode } from 'config';

// assets
import { IconLogout, IconSettings, IconLock } from '@tabler/icons-react';
import StarIcon from '@mui/icons-material/Star';
import useConfig from 'hooks/useConfig';

// ==============================|| PROFILE MENU ||============================== //

const ProfileSection = () => {
    const theme = useTheme();
    const { mode, borderRadius } = useConfig();

    const { logout, user } = useAuth();
    const [open, setOpen] = useState(false);
    const [openProfilesModal, setOpenProfilesModal] = useState(false);
    const [openChangePasswordModal, setOpenChangePasswordModal] = useState(false);

    // Fetch active profiles for the current user
    const { data: activeProfiles } = useActiveUserProfiles(user?.userId);

    // Find default profile
    const defaultProfile = activeProfiles?.find(profile => profile.assStatusCode === 'STA_ASS_CUR');

    /**
     * anchorRef is used on different components and specifying one type leads to other components throwing an error
     * */
    const anchorRef = useRef(null);
    const handleLogout = async () => {
        try {
            await logout();
        } catch (err) {
            console.error(err);
        }
    };


    const handleToggle = () => {
        setOpen((prevOpen) => !prevOpen);
    };

    const handleClose = (event) => {
        if (anchorRef.current && anchorRef.current.contains(event.target)) {
            return;
        }

        setOpen(false);
    };

    const handleOpenProfilesModal = () => {
        setOpenProfilesModal(true);
        setOpen(false);
    };

    const handleCloseProfilesModal = () => {
        setOpenProfilesModal(false);
    };

    const handleOpenChangePasswordModal = () => {
        setOpenChangePasswordModal(true);
        setOpen(false);
    };

    const handleCloseChangePasswordModal = () => {
        setOpenChangePasswordModal(false);
    };

    const prevOpen = useRef(open);
    useEffect(() => {
        if (prevOpen.current === true && open === false) {
            anchorRef.current.focus();
        }

        prevOpen.current = open;
    }, [open]);

    return (
        <>
            <Chip
                sx={{
                    ml: 2,
                    height: '48px',
                    alignItems: 'center',
                    borderRadius: '27px',
                    transition: 'all .2s ease-in-out',
                    borderColor: mode === ThemeMode.DARK ? 'dark.main' : 'primary.light',
                    bgcolor: mode === ThemeMode.DARK ? 'dark.main' : 'primary.light',
                    '&[aria-controls="menu-list-grow"], &:hover': {
                        borderColor: 'primary.main',
                        bgcolor: `${theme.palette.primary.main} !important`,
                        color: 'primary.light',
                        '& svg': {
                            stroke: theme.palette.primary.light
                        }
                    },
                    '& .MuiChip-label': {
                        lineHeight: 0
                    }
                }}
                icon={
                    <Avatar
                        src={User1}
                        alt="user-images"
                        sx={{
                            ...theme.typography.mediumAvatar,
                            margin: '8px 0 8px 8px !important',
                            cursor: 'pointer'
                        }}
                        ref={anchorRef}
                        aria-controls={open ? 'menu-list-grow' : undefined}
                        aria-haspopup="true"
                        color="inherit"
                    />
                }
                label={<IconSettings stroke={1.5} size="24px" />}
                variant="outlined"
                ref={anchorRef}
                aria-controls={open ? 'menu-list-grow' : undefined}
                aria-haspopup="true"
                onClick={handleToggle}
                color="primary"
                aria-label="user-account"
            />

            <Popper
                placement="bottom"
                open={open}
                anchorEl={anchorRef.current}
                role={undefined}
                transition
                disablePortal
                modifiers={[
                    {
                        name: 'offset',
                        options: {
                            offset: [0, 14]
                        }
                    }
                ]}
            >
                {({ TransitionProps }) => (
                    <ClickAwayListener onClickAway={handleClose}>
                        <Transitions in={open} {...TransitionProps}>
                            <Paper>
                                {open && (
                                    <MainCard border={false} elevation={16} content={false} boxShadow shadow={theme.shadows[16]}>
                                        <Box sx={{ p: 2, pb: 0 }}>
                                            <Stack>
                                                <Stack direction="row" spacing={0.5} alignItems="center">
                                                    <Typography component="span" variant="h4" sx={{ fontWeight: 700 }}>
                                                        {user?.firstName} {user?.lastName}
                                                    </Typography>
                                                </Stack>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Typography variant="subtitle2">
                                                        {defaultProfile ? defaultProfile.profileName : 'Aucun profil par défaut'}
                                                    </Typography>
                                                    {defaultProfile && <StarIcon fontSize="small" color="warning" />}
                                                </Stack>
                                                {defaultProfile?.assoName && (
                                                    <Typography variant="caption" color="textSecondary">
                                                        {defaultProfile?.assoName}
                                                    </Typography>
                                                )}

                                                {defaultProfile && (
                                                    <Typography variant="caption" color="textSecondary">
                                                        ({defaultProfile.strName})
                                                    </Typography>
                                                )}
                                            </Stack>
                                            <Divider />
                                        </Box>
                                        <PerfectScrollbar style={{ height: '100%', maxHeight: 'calc(100vh - 250px)', overflowX: 'hidden' }}>
                                            <Box sx={{ p: 2, pt: 0 }}>
                                                <Divider />
                                                <List
                                                    component="nav"
                                                    sx={{
                                                        width: '100%',
                                                        maxWidth: 350,
                                                        minWidth: 300,
                                                        borderRadius: `${borderRadius}px`,
                                                        '& .MuiListItemButton-root': { mt: 0.5 }
                                                    }}
                                                >
                                                    <ListItemButton
                                                        sx={{ borderRadius: `${borderRadius}px` }}
                                                        onClick={handleOpenProfilesModal}
                                                    >
                                                        <ListItemIcon>
                                                            <IconSettings stroke={1.5} size="20px" />
                                                        </ListItemIcon>
                                                        <ListItemText
                                                            primary={<Typography variant="body2">Voir mes profils actifs</Typography>}
                                                        />
                                                    </ListItemButton>
                                                    <ListItemButton
                                                        sx={{ borderRadius: `${borderRadius}px` }}
                                                        onClick={handleOpenChangePasswordModal}
                                                    >
                                                        <ListItemIcon>
                                                            <IconLock stroke={1.5} size="20px" />
                                                        </ListItemIcon>
                                                        <ListItemText
                                                            primary={<Typography variant="body2">Changer mot de passe</Typography>}
                                                        />
                                                    </ListItemButton>
                                                    <ListItemButton sx={{ borderRadius: `${borderRadius}px` }} onClick={handleLogout}>
                                                        <ListItemIcon>
                                                            <IconLogout stroke={1.5} size="20px" />
                                                        </ListItemIcon>
                                                        <ListItemText primary={<Typography variant="body2">Déconnexion</Typography>} />
                                                    </ListItemButton>
                                                </List>
                                            </Box>
                                        </PerfectScrollbar>
                                    </MainCard>
                                )}
                            </Paper>
                        </Transitions>
                    </ClickAwayListener>
                )}
            </Popper>

            {/* User Profiles Modal */}
            <UserProfilesModal open={openProfilesModal} handleClose={handleCloseProfilesModal} userId={user?.userId} />

            {/* Change Password Modal */}
            <ChangePasswordModal open={openChangePasswordModal} handleClose={handleCloseChangePasswordModal} />
        </>
    );
};

export default ProfileSection;
