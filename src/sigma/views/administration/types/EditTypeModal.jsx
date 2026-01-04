import React from 'react';
import PropTypes from 'prop-types';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';

// material-ui
import {
    FormControl,
    FormHelperText,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    TextField,
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';

// project imports
import { gridSpacing } from 'store/constant';
import { useUpdateType, useGetAllTypeGroups, usePossibleParents } from '../../../hooks/query/useTypes';
import Modal from '../../../components/commons/Modal';
import FloatingAlert from '../../../components/commons/FloatingAlert';
import SimpleBackdrop from '../../../components/commons/SimpleBackdrop';

// validation schema
const TypeSchema = Yup.object().shape({
    code: Yup.string()
        .required('Le code est obligatoire')
        .max(50, 'La taille du code ne peut excéder 50 caractères'),
    name: Yup.string()
        .required('Le nom est obligatoire')
        .max(100, 'La taille du nom ne peut excéder 100 caractères'),
    description: Yup.string()
        .max(255, 'La description ne peut excéder 255 caractères'),
    groupCode: Yup.string()
        .required('Le groupe est obligatoire')
});

// ==============================|| EDIT TYPE MODAL ||============================== //

const EditTypeModal = ({ open, handleClose, type }) => {
    // Fetch type groups for dropdown
    const { data: typeGroups = [], isLoading: isLoadingGroups } = useGetAllTypeGroups();

    // Mutation for updating a type
    const { mutate: updateType, isPending: isUpdating, isSuccess: isUpdateSuccess, isError: isUpdateError, error: updateError } = useUpdateType();

    // Load possible parent types for the current type
    const { data: possibleParents = [], isLoading: isLoadingPossibleParents } = usePossibleParents(type?.code);

    // Handle form submission
    const handleSubmit = (values, { setSubmitting }) =>
    {
        console.log(values);
        updateType(values, {
            onSuccess: () => {
                setSubmitting(false);
            },
            onError: (error) => {
                console.error('Error updating type:', error);
                setSubmitting(false);
            }
        });
    };

    // If no type is provided, don't render the modal
    if (!type) return null;

    return (
        <Modal
            open={open}
            handleClose={handleClose}
            title="Modification de type"
            width="sm"
            actionLabel="Enregistrer"
            actionDisabled={isUpdating}
            handleConfirmation={() => {
                document.getElementById('edit-type-form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
            }}
        >
            <Formik
                initialValues={{
                    code: type.code || '',
                    name: type.name || '',
                    description: type.description || '',
                    groupCode: type.groupCode || '',
                    parentTypeCodes: type.parentTypeCodes || []
                }}
                validationSchema={TypeSchema}
                onSubmit={handleSubmit}
                enableReinitialize
            >
                {({ errors, setFieldValue, touched, handleChange, handleBlur, values, isSubmitting }) => (
                    <Form id="edit-type-form">
                        <Grid container spacing={gridSpacing}>
                            <Grid item xs={12} md={6}>
                                <Field
                                    size={'small'}
                                    as={TextField}
                                    fullWidth
                                    id="code"
                                    name="code"
                                    label="Code"
                                    value={values.code}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    error={touched.code && Boolean(errors.code)}
                                    helperText={touched.code && errors.code}
                                    disabled // Code should not be editable
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Field
                                    size={'small'}
                                    as={TextField}
                                    fullWidth
                                    id="name"
                                    name="name"
                                    label="name"
                                    value={values.name}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    error={touched.name && Boolean(errors.name)}
                                    helperText={touched.name && errors.name}
                                />
                            </Grid>
                            <Grid item xs={12} md={12}>
                                <FormControl
                                    fullWidth
                                    error={touched.groupCode && Boolean(errors.groupCode)}
                                >
                                    <Autocomplete
                                        id="groupCode"
                                        size="small"
                                        options={isLoadingGroups ? [] : typeGroups}
                                        getOptionLabel={(option) => option.name || ''}
                                        value={typeGroups.find(group => group.groupCode === values.groupCode) || null}
                                        onChange={(event, newValue) => {
                                            setFieldValue('groupCode', newValue ? newValue.groupCode : '');
                                        }}
                                        onBlur={handleBlur}
                                        loading={isLoadingGroups}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Group"
                                                error={touched.groupCode && Boolean(errors.groupCode)}
                                                helperText={touched.groupCode && errors.groupCode}
                                            />
                                        )}
                                    />
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <FormControl fullWidth>
                                    <Autocomplete
                                        multiple
                                        id="parentTypeCodes"
                                        size="small"
                                        options={isLoadingPossibleParents ? [] : possibleParents}
                                        getOptionLabel={(option) => option.name || ''}
                                        value={(values.parentTypeCodes || [])
                                            .map(code => (possibleParents || []).find(t => t.code === code))
                                            .filter(Boolean)}
                                        onChange={(event, newValue) => {
                                            const codes = (newValue || []).map(opt => opt.code);
                                            setFieldValue('parentTypeCodes', codes);
                                        }}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Types parents"
                                                placeholder="Sélectionner un ou plusieurs parents"
                                            />
                                        )}
                                        loading={isLoadingPossibleParents}
                                    />
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <Field
                                    size={'small'}
                                    as={TextField}
                                    fullWidth
                                    id="description"
                                    name="description"
                                    label="Description"
                                    multiline
                                    rows={3}
                                    value={values.description}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    error={touched.description && Boolean(errors.description)}
                                    helperText={touched.description && errors.description}
                                />
                            </Grid>

                        </Grid>
                    </Form>
                )}
            </Formik>
            <FloatingAlert open={isUpdateError || isUpdateSuccess} feedBackMessages={isUpdateError ? updateError?.response.data : isUpdateSuccess ? 'Type modifié avec succès' : ''} severity={isUpdateError ? 'error' : isUpdateSuccess ? 'success' : 'info'}/>
            <SimpleBackdrop open={isUpdating}/>
        </Modal>
    );
};

EditTypeModal.propTypes = {
    open: PropTypes.bool.isRequired,
    handleClose: PropTypes.func.isRequired,
    type: PropTypes.object
};

export default EditTypeModal;
