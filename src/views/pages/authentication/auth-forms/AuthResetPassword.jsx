import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Typography from '@mui/material/Typography';

// third party
import * as Yup from 'yup';
import { Formik } from 'formik';

// project imports
import useAuth from 'hooks/useAuth';
import useScriptRef from 'hooks/useScriptRef';
import AnimateButton from 'ui-component/extended/AnimateButton';
import { strengthColor, strengthIndicator } from 'utils/password-strength';

import { dispatch } from 'store';
import { openSnackbar } from 'store/slices/snackbar';
import { useActivateUser, useResetPassword } from 'src/sigma/hooks/query/useUsers';
import CustomAlertDialog from 'src/sigma/components/commons/CustomAlertDialog';
import FloatingAlert from 'src/sigma/components/commons/FloatingAlert';

// assets
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

// ========================|| FIREBASE - RESET PASSWORD ||======================== //

const AuthResetPassword = ({ token, userId, isActivation, ...others }) => {
    const theme = useTheme();
    const navigate = useNavigate();
    const scriptedRef = useScriptRef();

    const [showPassword, setShowPassword] = useState(false);
    const [strength, setStrength] = useState(0);
    const [level, setLevel] = useState();

    const [openAlert, setOpenAlert] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ open: false, message: '', severity: 'success' });
    const [pendingValues, setPendingValues] = useState(null);

    const activateUser = useActivateUser();
    const resetPassword = useResetPassword();

    const { isLoggedIn } = useAuth();

    const handleClickShowPassword = () => {
        setShowPassword(!showPassword);
    };

    const handleMouseDownPassword = (event) => {
        event.preventDefault();
    };

    const changePassword = (value) => {
        const temp = strengthIndicator(value);
        setStrength(temp);
        setLevel(strengthColor(temp));
    };

    useEffect(() => {
        changePassword('');
    }, []);

    const handleFormSubmit = (values) => {
        setPendingValues(values);
        setOpenAlert(true);
    };

    const confirmSubmit = async (setErrors, setStatus, setSubmitting) => {
        setOpenAlert(false);
        try {
            const dto = {
                password: pendingValues.password,
                rePassword: pendingValues.confirmPassword,
                userId: userId,
                authToken: token
            };

            if (isActivation) {
                await activateUser.mutateAsync(dto);
            } else {
                await resetPassword.mutateAsync(dto);
            }

            setStatus({ success: true });
            setSubmitting(false);
            setAlertConfig({
                open: true,
                message: isActivation ? 'Compte activé avec succès !' : 'Mot de passe réinitialisé avec succès !',
                severity: 'success'
            });

            setTimeout(() => {
                navigate(isLoggedIn ? '/auth/login' : '/login', { replace: true });
            }, 2000);
        } catch (err) {
            console.error(err);
            setStatus({ success: false });
            setErrors({ submit: err.message || 'Une erreur est survenue' });
            setSubmitting(false);
            setAlertConfig({
                open: true,
                message: err.message || 'Une erreur est survenue',
                severity: 'error'
            });
        }
    };

    return (
        <>
            <FloatingAlert
                open={alertConfig.open}
                feedBackMessages={alertConfig.message}
                severity={alertConfig.severity}
                onClose={() => setAlertConfig({ ...alertConfig, open: false })}
            />
            <Formik
                initialValues={{
                    password: '',
                    confirmPassword: '',
                    submit: null
                }}
                validationSchema={Yup.object().shape({
                    password: Yup.string().max(255).required('Le mot de passe est requis'),
                    confirmPassword: Yup.string()
                        .required('La confirmation du mot de passe est requise')
                        .test(
                            'confirmPassword',
                            'Les mots de passe doivent correspondre !',
                            (confirmPassword, yup) => yup.parent.password === confirmPassword
                        )
                })}
                onSubmit={handleFormSubmit}
            >
                {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values, setErrors, setStatus, setSubmitting }) => (
                    <form noValidate onSubmit={handleSubmit} {...others}>
                        <CustomAlertDialog
                            open={openAlert}
                            handleClose={() => setOpenAlert(false)}
                            handleConfirm={() => confirmSubmit(setErrors, setStatus, setSubmitting)}
                            title="Confirmer la soumission"
                            content={isActivation ? "Voulez-vous activer votre compte avec ce mot de passe ?" : "Voulez-vous réinitialiser votre mot de passe ?"}
                            loading={activateUser.isLoading || resetPassword.isLoading}
                        />
                        <FormControl fullWidth error={Boolean(touched.password && errors.password)} sx={{ ...theme.typography.customInput }}>
                            <InputLabel htmlFor="outlined-adornment-password-reset">Mot de passe</InputLabel>
                            <OutlinedInput
                                id="outlined-adornment-password-reset"
                                type={showPassword ? 'text' : 'password'}
                                value={values.password}
                                name="password"
                                onBlur={handleBlur}
                                onChange={(e) => {
                                    handleChange(e);
                                    changePassword(e.target.value);
                                }}
                                endAdornment={
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={handleClickShowPassword}
                                            onMouseDown={handleMouseDownPassword}
                                            edge="end"
                                            size="large"
                                        >
                                            {showPassword ? <Visibility /> : <VisibilityOff />}
                                        </IconButton>
                                    </InputAdornment>
                                }
                                inputProps={{}}
                            />
                        </FormControl>
                        {touched.password && errors.password && (
                            <FormControl fullWidth>
                                <FormHelperText error id="standard-weight-helper-text-reset">
                                    {errors.password}
                                </FormHelperText>
                            </FormControl>
                        )}
                        {strength !== 0 && (
                            <FormControl fullWidth>
                                <Box sx={{ mb: 2 }}>
                                    <Grid container spacing={2} alignItems="center">
                                        <Grid item>
                                            <Box sx={{ width: 85, height: 8, borderRadius: '7px', bgcolor: level?.color }} />
                                        </Grid>
                                        <Grid item>
                                            <Typography variant="subtitle1" fontSize="0.75rem">
                                                {level?.label}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </Box>
                            </FormControl>
                        )}

                        <FormControl
                            fullWidth
                            error={Boolean(touched.confirmPassword && errors.confirmPassword)}
                            sx={{ ...theme.typography.customInput }}
                        >
                            <InputLabel htmlFor="outlined-adornment-confirm-password">Confirmer le mot de passe</InputLabel>
                            <OutlinedInput
                                id="outlined-adornment-confirm-password"
                                type="password"
                                value={values.confirmPassword}
                                name="confirmPassword"
                                label="Confirmer le mot de passe"
                                onBlur={handleBlur}
                                onChange={handleChange}
                                inputProps={{}}
                            />
                        </FormControl>

                        {touched.confirmPassword && errors.confirmPassword && (
                            <FormControl fullWidth>
                                <FormHelperText error id="standard-weight-helper-text-confirm-password">
                                    {' '}
                                    {errors.confirmPassword}{' '}
                                </FormHelperText>
                            </FormControl>
                        )}

                        {errors.submit && (
                            <Box sx={{ mt: 3 }}>
                                <FormHelperText error>{errors.submit}</FormHelperText>
                            </Box>
                        )}
                        <Box sx={{ mt: 1 }}>
                            <AnimateButton>
                                <Button
                                    disableElevation
                                    disabled={isSubmitting}
                                    fullWidth
                                    size="large"
                                    type="submit"
                                    variant="contained"
                                    color="secondary"
                                >
                                    {isActivation ? 'Activer le compte' : 'Réinitialiser le mot de passe'}
                                </Button>
                            </AnimateButton>
                        </Box>
                    </form>
                )}
            </Formik>
        </>
    );
};

export default AuthResetPassword;
