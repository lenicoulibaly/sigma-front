import React from 'react';
import PropTypes from 'prop-types';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';

// material-ui
import {
    Button,
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
import { useCreateType, useGetAllTypeGroups, useTypesByGroupCode } from '../../../hooks/query/useTypes';
import Modal from '../../../components/commons/Modal';
import FloatingAlert from '../../../components/commons/FloatingAlert';
import SimpleBackdrop from '../../../components/commons/SimpleBackdrop';

// validation schema
const TypeSchema = Yup.object().shape({
    code: Yup.string()
        .required('Le code est requis')
        .max(50, 'La taille du code ne peut excéder 50 caractères'),
    name: Yup.string()
        .required('Le nom est obligatoire')
        .max(100, 'La taille du nom ne peut excéder 100 caractères'),
    description: Yup.string()
        .max(255, 'La description ne peut excéder 255 caractères'),
    groupCode: Yup.string()
        .required('Le groupe est obligatoire')
});

// ==============================|| ADD TYPE MODAL ||============================== //

const AddTypeModal = ({ open, handleClose }) => {
    // Fetch type groups for dropdown
    const { data: typeGroups = [], isLoading: isLoadingGroups } = useGetAllTypeGroups();

    // Parent types options depend on selected group
    const [currentGroup, setCurrentGroup] = React.useState('');
    const { data: typesByGroup = [], isLoading: isLoadingTypesByGroup } = useTypesByGroupCode(currentGroup);

    // Mutation for creating a new type
    const { mutate: createType, isPending: isCreating, isSuccess: isCreateSuccess, isError: isCreateError, error : createError } = useCreateType();


    // Initial form values
    const initialValues = {
        code: '',
        name: '',
        description: '',
        groupCode: '',
        parentTypeCodes: []
    };

    // Handle form submission
    const handleSubmit = (values, { setSubmitting, resetForm }) =>
    {
        createType(values, {
            onSuccess: () => {
                setSubmitting(false);
                resetForm();
            },
            onError: (error) => {
                console.error('Error creating type:', error.response.data);
                setSubmitting(false);
            }
        });
    };
    return (
        <Modal
            open={open}
            handleClose={handleClose}
            title="Création d'un nouveau type"
            width="sm"
            actionLabel="Enregistrer"
            actionDisabled={isCreating}
            handleConfirmation={() => {
                document.getElementById('add-type-form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
            }}
        >
            <Formik initialValues={initialValues} validationSchema={TypeSchema} onSubmit={handleSubmit}>
                {({ errors, setFieldValue, touched, handleChange, handleBlur, values, isSubmitting }) => (
                    <Form id="add-type-form">
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
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Field
                                    size={'small'}
                                    as={TextField}
                                    fullWidth
                                    id="name"
                                    name="name"
                                    label="Nom du type"
                                    value={values.name}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    error={touched.name && Boolean(errors.name)}
                                    helperText={touched.name && errors.name}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <FormControl fullWidth error={touched.groupCode && Boolean(errors.groupCode)}>
                                    <Autocomplete
                                        id="groupCode"
                                        size="small"
                                        options={isLoadingGroups ? [] : typeGroups}
                                        getOptionLabel={(option) => option.name || ''}
                                        value={
                                            typeGroups.find((group) => group.groupCode === values.groupCode) || null
                                        }
                                        onChange={(event, newValue) => {
                                            const gc = newValue ? newValue.groupCode : '';
                                            setFieldValue('groupCode', gc);
                                            setCurrentGroup(gc);
                                            // Reset parents if group changed
                                            setFieldValue('parentTypeCodes', []);
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
                                        options={isLoadingTypesByGroup ? [] : typesByGroup}
                                        getOptionLabel={(option) => option.name || ''}
                                        value={(values.parentTypeCodes || [])
                                            .map(code => (typesByGroup || []).find(t => t.code === code))
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
                                        disabled={!values.groupCode}
                                        loading={isLoadingTypesByGroup}
                                    />
                                    <FormHelperText>
                                        {(!values.groupCode) ? 'Veuillez choisir un groupe pour charger les parents' : ''}
                                    </FormHelperText>
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
            <FloatingAlert open={isCreateError || isCreateSuccess} feedBackMessages={isCreateError ? createError?.response.data : isCreateSuccess ? 'Type créé avec succès' : ''} severity={isCreateError ? 'error' : isCreateSuccess ? 'success' : 'info'}/>
            <SimpleBackdrop open={isCreating}/>
        </Modal>
    );
};

AddTypeModal.propTypes = {
    open: PropTypes.bool.isRequired,
    handleClose: PropTypes.func.isRequired
};

export default AddTypeModal;
