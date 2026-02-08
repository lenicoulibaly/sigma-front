import { Link } from 'react-router-dom';

// material-ui
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';

// project imports
import AuthWrapper1 from '../AuthWrapper1';
import AuthCardWrapper from '../AuthCardWrapper';
import Logo from 'ui-component/Logo';
import AuthForgotPassword from '../auth-forms/AuthForgotPassword';
import AuthFooter from 'ui-component/cards/AuthFooter';
import useAuth from 'hooks/useAuth';

// ============================|| AUTH3 - FORGOT PASSWORD ||============================ //

const ForgotPassword = () => {
    const downMD = useMediaQuery((theme) => theme.breakpoints.down('md'));
    const { isLoggedIn } = useAuth();

    return (
        <Grid container spacing={2} alignItems="center" justifyContent="center">
            <Grid item xs={12}>
                <Grid container alignItems="center" justifyContent="center" textAlign="center" spacing={2}>
                    <Grid item xs={12}>
                        <Typography color="secondary.main" gutterBottom variant={downMD ? 'h3' : 'h2'}>
                            Mot de passe oublié?
                        </Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="caption" fontSize="16px" textAlign="center">
                            Entrez votre adresse e-mail ci-dessous et nous vous enverrons un lien de réinitialisation de mot de passe.
                        </Typography>
                    </Grid>
                </Grid>
            </Grid>
            <Grid item xs={12}>
                <AuthForgotPassword />
            </Grid>
        </Grid>
    );
};

export default ForgotPassword;
