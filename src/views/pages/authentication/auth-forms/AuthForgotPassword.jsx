import { useNavigate } from 'react-router-dom';
import React, { useState } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';

// third party
import * as Yup from 'yup';
import { Formik } from 'formik';

// project imports
import AnimateButton from 'ui-component/extended/AnimateButton';
import useAuth from 'hooks/useAuth';
import useScriptRef from 'hooks/useScriptRef';

import { useDispatch } from 'store';
import { openSnackbar } from 'store/slices/snackbar';
import { useSendResetPasswordEmailByEmail } from 'src/sigma/hooks/query/useUsers';
import CustomAlertDialog from 'src/sigma/components/commons/CustomAlertDialog';
import FloatingAlert from 'src/sigma/components/commons/FloatingAlert';

// ========================|| FIREBASE - FORGOT PASSWORD ||======================== //

const AuthForgotPassword = ({ ...others }) => {
    const theme = useTheme();
    const scriptedRef = useScriptRef();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const sendPublicResetPasswordEmail = useSendResetPasswordEmailByEmail();

    const { isLoggedIn } = useAuth();

    const [openAlert, setOpenAlert] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ open: false, message: '', severity: 'success' });
    const [pendingValues, setPendingValues] = useState(null);

    const handleFormSubmit = (values) => {
        setPendingValues(values);
        setOpenAlert(true);
    };

    const confirmSubmit = async (setErrors, setStatus, setSubmitting) => {
        setOpenAlert(false);
        try {
            await sendPublicResetPasswordEmail.mutateAsync(pendingValues.email);
            setStatus({ success: true });
            setSubmitting(false);
            setAlertConfig({
                open: true,
                message: 'Vérifiez votre e-mail pour le lien de réinitialisation du mot de passe',
                severity: 'success'
            });
            // On ne redirige pas forcément si on est dans une modale, 
            // ou on peut laisser l'utilisateur fermer la modale lui-même.
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
                initialValues={{ email: '', submit: null }}
                validationSchema={Yup.object().shape({
                    email: Yup.string().email('Doit être une adresse e-mail valide').max(255).required('L\'adresse e-mail est requise')
                })}
                onSubmit={handleFormSubmit}
            >
                {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values, setErrors, setStatus, setSubmitting }) => (
                    <form noValidate onSubmit={handleSubmit} {...others}>
                        <CustomAlertDialog
                            open={openAlert}
                            handleClose={() => setOpenAlert(false)}
                            handleConfirm={() => confirmSubmit(setErrors, setStatus, setSubmitting)}
                            title="Confirmer l'envoi"
                            content={`Voulez-vous envoyer un e-mail de réinitialisation à ${values.email} ?`}
                            loading={sendPublicResetPasswordEmail.isLoading}
                        />
                        <FormControl fullWidth error={Boolean(touched.email && errors.email)} sx={{ ...theme.typography.customInput }}>
                            <InputLabel htmlFor="outlined-adornment-email-forgot">Adresse e-mail / Nom d'utilisateur</InputLabel>
                            <OutlinedInput
                                id="outlined-adornment-email-forgot"
                                type="email"
                                value={values.email}
                                name="email"
                                onBlur={handleBlur}
                                onChange={handleChange}
                                label="Adresse e-mail / Nom d'utilisateur"
                                inputProps={{}}
                            />
                            {touched.email && errors.email && (
                                <FormHelperText error id="standard-weight-helper-text-email-forgot">
                                    {errors.email}
                                </FormHelperText>
                            )}
                        </FormControl>

                        {errors.submit && (
                            <Box sx={{ mt: 3 }}>
                                <FormHelperText error>{errors.submit}</FormHelperText>
                            </Box>
                        )}

                        <Box sx={{ mt: 2 }}>
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
                                    Envoyer
                                </Button>
                            </AnimateButton>
                        </Box>
                    </form>
                )}
            </Formik>
        </>
    );
};

export default AuthForgotPassword;
