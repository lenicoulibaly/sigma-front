import { Link } from 'react-router-dom';
import { useState } from 'react';

// material-ui
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';

// project imports
import AuthWrapper1 from '../AuthWrapper1';
import AuthCardWrapper from '../AuthCardWrapper';
import AuthLogin from '../auth-forms/AuthLogin';
import RegisterUserWizard from 'src/sigma/views/business/adhesions/RegisterUserWizard';
import Logo from 'ui-component/Logo';
import AuthFooter from 'ui-component/cards/AuthFooter';
import useAuth from 'src/sigma/hooks/useAuth';

// assets

// ================================|| AUTH3 - LOGIN ||================================ //

const Login = () => {
    const { isLoggedIn } = useAuth();
    const downMD = useMediaQuery((theme) => theme.breakpoints.down('md'));
    const [openRegisterModal, setOpenRegisterModal] = useState(false);

    const handleOpenRegisterModal = () => {
        setOpenRegisterModal(true);
    };

    const handleCloseRegisterModal = () => {
        setOpenRegisterModal(false);
    };

    return (
        <AuthWrapper1>
            {/* Register User Wizard */}
            <RegisterUserWizard open={openRegisterModal} handleClose={handleCloseRegisterModal} />
            <Grid container direction="column" justifyContent="flex-end" sx={{ minHeight: '100vh' }}>
                <Grid item xs={12}>
                    <Grid container justifyContent="center" alignItems="center" sx={{ minHeight: 'calc(100vh - 68px)' }}>
                        <Grid item sx={{ m: { xs: 1, sm: 3 }, mb: 0 }}>
                            <AuthCardWrapper>
                                <Grid container spacing={2} alignItems="center" justifyContent="center">
                                    <Grid item sx={{ mb: 3 }}>
                                        <Link to="#" aria-label="logo">
                                            <Logo />
                                        </Link>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Grid
                                            container
                                            direction={{ xs: 'column-reverse', md: 'row' }}
                                            alignItems="center"
                                            justifyContent="center"
                                        >
                                            <Grid item>
                                                <Stack alignItems="center" justifyContent="center" spacing={1}>
                                                    <Typography 
                                                        color="secondary.main" 
                                                        gutterBottom 
                                                        variant={downMD ? 'h4' : 'h3'} 
                                                        textAlign="center"
                                                        sx={{ maxWidth: '100%' }}
                                                    >
                                                        Bien venu sur la plateforme SIGMA
                                                    </Typography>
                                                    <Typography
                                                        variant="caption"
                                                        fontSize="16px"
                                                        textAlign={{ xs: 'center', md: 'inherit' }}
                                                    >
                                                        Veuillez saisir vos paramètres de connexion
                                                    </Typography>
                                                </Stack>
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <AuthLogin loginProp={{ onCreateAccount: handleOpenRegisterModal }} />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Divider />
                                    </Grid>
                                </Grid>
                            </AuthCardWrapper>
                        </Grid>
                    </Grid>
                </Grid>
                <Grid item xs={12} sx={{ m: 3, mt: 1 }}>
                    <AuthFooter />
                </Grid>
            </Grid>
        </AuthWrapper1>
    );
};

export default Login;
