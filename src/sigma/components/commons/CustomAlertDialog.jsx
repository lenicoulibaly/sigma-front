import React from 'react';
import PropTypes from 'prop-types';

// material-ui
import { useTheme } from '@mui/material/styles';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton, 
    Tooltip,
    Typography,
    CircularProgress,
    Alert
} from '@mui/material';

// ===============================|| UI DIALOG - SWEET ALERT ||=============================== //

export default function CustomAlertDialog({
    open: externalOpen,
    handleClose: externalHandleClose,
    handleConfirm,
    title = 'Confirmation',
    content = 'Confirmez-vous l\'enregistrement ?',
    confirmBtnText = 'Confirmer',
    cancelBtnText = 'Annuler',
    loading = false,
    error = null,
    // Legacy props for backward compatibility
    openLabel = 'Enregistrer',
    variant = 'contained',
    message,
    actionDisabled = true,
    actionVisible = true,
    type = 'button',
    confirmLabel,
    cancelLabel,
    handleConfirmation,
    TriggerIcon,
    triggerStyle,
    triggerSize = 'large',
    startIcon
}) {
    const theme = useTheme();
    const [internalOpen, setInternalOpen] = React.useState(false);

    // Determine if we're using the new API or legacy API
    const isExternalControl = externalOpen !== undefined && externalHandleClose !== undefined;

    // Use either external or internal open state
    const dialogOpen = isExternalControl ? externalOpen : internalOpen;

    const handleClickOpen = () => {
        setInternalOpen(true);
    };

    const handleDialogClose = () => {
        if (isExternalControl) {
            externalHandleClose();
        } else {
            setInternalOpen(false);
        }
    };

    const onConfirm = () => {
        if (isExternalControl && handleConfirm) {
            handleConfirm();
        } else if (handleConfirmation) {
            handleConfirmation();
        }

        if (!isExternalControl) {
            setInternalOpen(false);
        }
    };
    return (
        <>
            {/* Only render trigger if using legacy API and actionVisible is true */}
            {!isExternalControl && actionVisible && (
                <Tooltip placement="top" title={openLabel}>
                    {TriggerIcon ? 
                        <IconButton 
                            color="secondary" 
                            sx={triggerStyle} 
                            size={triggerSize} 
                            disabled={actionDisabled} 
                            variant={variant} 
                            onClick={handleClickOpen}
                        >
                            {TriggerIcon}
                        </IconButton>
                    : 
                        <Button 
                            color="secondary" 
                            disabled={actionDisabled} 
                            variant={variant} 
                            onClick={handleClickOpen}
                            startIcon={startIcon}
                        >
                            {openLabel}
                        </Button>
                    }
                </Tooltip>
            )}

            <Dialog
                open={dialogOpen}
                onClose={handleDialogClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
                sx={{ p: 3 }}
            >
                        <DialogTitle id="alert-dialog-title">
                            {title}
                        </DialogTitle>
                        <DialogContent>
                            <DialogContentText id="alert-dialog-description">
                                <Typography variant="body2" component="span">
                                    {content || message}
                                </Typography>
                            </DialogContentText>
                            {error && (
                                <Alert severity="error" sx={{ mt: 2 }}>
                                    {error}
                                </Alert>
                            )}
                        </DialogContent>
                        <DialogActions sx={{ pr: 2.5 }}>
                            <Button
                                sx={{ color: theme.palette.error.dark, borderColor: theme.palette.error.dark }}
                                onClick={handleDialogClose}
                                color="secondary"
                            >
                                {cancelBtnText || cancelLabel}
                            </Button>
                            <Button 
                                variant="contained" 
                                size="small" 
                                type={type} 
                                onClick={onConfirm} 
                                disabled={loading}
                                autoFocus
                                sx={{ minWidth: '100px' }}
                            >
                                {loading ? (
                                    <CircularProgress size={24} color="inherit" />
                                ) : (
                                    confirmBtnText || confirmLabel
                                )}
                            </Button>
                        </DialogActions>
            </Dialog>
        </>
    );
}

CustomAlertDialog.propTypes = {
    // New API props
    open: PropTypes.bool,
    handleClose: PropTypes.func,
    handleConfirm: PropTypes.func,
    title: PropTypes.string,
    content: PropTypes.string,
    confirmBtnText: PropTypes.string,
    cancelBtnText: PropTypes.string,
    loading: PropTypes.bool,
    error: PropTypes.string,

    // Legacy API props
    openLabel: PropTypes.string,
    variant: PropTypes.string,
    message: PropTypes.string,
    actionDisabled: PropTypes.bool,
    actionVisible: PropTypes.bool,
    type: PropTypes.string,
    confirmLabel: PropTypes.string,
    cancelLabel: PropTypes.string,
    handleConfirmation: PropTypes.func,
    TriggerIcon: PropTypes.node,
    startIcon: PropTypes.node,
    triggerStyle: PropTypes.object,
    triggerSize: PropTypes.string
};
