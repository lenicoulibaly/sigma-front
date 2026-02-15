import React, { useState, useEffect } from 'react';
import { Grid, TextField, Autocomplete, CircularProgress } from '@mui/material';
import Modal from 'src/sigma/components/commons/Modal';
import { useCreateDemandeAdhesion, useUpdateDemandeAdhesion } from 'src/sigma/hooks/query/useDemandeAdhesion';
import { useOpenAssociationsList } from 'src/sigma/hooks/query/useAssociations';
import FloatingAlert from 'src/sigma/components/commons/FloatingAlert';

const DemandeAdhesionModal = ({ open, handleClose, mode = 'create', row = null }) => {
    const isEdit = mode === 'edit';
    const [formData, setFormData] = useState({
        demandeurNom: '',
        demandeurPrenom: '',
        demandeurEmail: '',
        demandeurTel: '',
        assoId: null,
        associationNom: ''
    });

    useEffect(() => {
        if (open) {
            if (isEdit && row) {
                setFormData({
                    demandeurNom: row.demandeurNom || '',
                    demandeurPrenom: row.demandeurPrenom || '',
                    demandeurEmail: row.demandeurEmail || '',
                    demandeurTel: row.demandeurTel || '',
                    assoId: row.assoId || null,
                    associationNom: row.assoName || ''
                });
            } else {
                setFormData({
                    demandeurNom: '',
                    demandeurPrenom: '',
                    demandeurEmail: '',
                    demandeurTel: '',
                    assoId: null,
                    associationNom: ''
                });
            }
        }
    }, [open, isEdit, row]);

    const [assoQuery, setAssoQuery] = useState('');
    const { data: associations = [], isLoading: loadingAssociations } = useOpenAssociationsList(assoQuery);
    const createMutation = useCreateDemandeAdhesion();
    const updateMutation = useUpdateDemandeAdhesion();

    const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleAssoChange = (event, newValue) => {
        setFormData((prev) => ({
            ...prev,
            assoId: newValue ? newValue.assoId : null,
            associationNom: newValue ? newValue.assoName : ''
        }));
    };

    const handleSubmit = async () => {
        try {
            if (!formData.demandeurNom || !formData.demandeurEmail || !formData.assoId) {
                setAlert({ open: true, message: 'Veuillez remplir les champs obligatoires.', severity: 'error' });
                return;
            }

            if (isEdit) {
                const id = row.demandeId || row.id;
                await updateMutation.mutateAsync({ id, dto: formData });
                setAlert({ open: true, message: 'Demande mise à jour avec succès.', severity: 'success' });
            } else {
                await createMutation.mutateAsync(formData);
                setAlert({ open: true, message: 'Demande créée avec succès.', severity: 'success' });
            }

            setTimeout(() => {
                handleClose();
            }, 1000);
        } catch (error) {
            setAlert({ open: true, message: `Erreur lors de la ${isEdit ? 'mise à jour' : 'création'} de la demande.`, severity: 'error' });
        }
    };

    return (
        <>
            <Modal
                open={open}
                title={isEdit ? "Modifier la Demande d'Adhésion" : "Nouvelle Demande d'Adhésion"}
                handleClose={handleClose}
                handleConfirmation={handleSubmit}
                actionLabel={isEdit ? "Enregistrer" : "Créer"}
                width="md"
            >
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Nom du demandeur"
                            name="demandeurNom"
                            value={formData.demandeurNom}
                            onChange={handleChange}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Prénom du demandeur"
                            name="demandeurPrenom"
                            value={formData.demandeurPrenom}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Email"
                            name="demandeurEmail"
                            type="email"
                            value={formData.demandeurEmail}
                            onChange={handleChange}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Téléphone"
                            name="demandeurTel"
                            value={formData.demandeurTel}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Autocomplete
                            options={associations}
                            getOptionLabel={(option) => option.assoName || ''}
                            value={associations.find(a => a.assoId === formData.assoId) || null}
                            onChange={handleAssoChange}
                            onInputChange={(event, newInputValue) => setAssoQuery(newInputValue)}
                            loading={loadingAssociations}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Association"
                                    required
                                    InputProps={{
                                        ...params.InputProps,
                                        endAdornment: (
                                            <>
                                                {loadingAssociations ? <CircularProgress color="inherit" size={20} /> : null}
                                                {params.InputProps.endAdornment}
                                            </>
                                        ),
                                    }}
                                />
                            )}
                        />
                    </Grid>
                </Grid>
            </Modal>
            <FloatingAlert
                open={alert.open}
                feedBackMessages={alert.message}
                severity={alert.severity}
                onClose={() => setAlert({ ...alert, open: false })}
            />
        </>
    );
};

export default DemandeAdhesionModal;
