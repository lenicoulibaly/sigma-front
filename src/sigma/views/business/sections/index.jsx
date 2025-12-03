import React from 'react';

// material-ui
import { Grid } from '@mui/material';

// project imports
import MainCard from 'ui-component/cards/MainCard';
import { gridSpacing } from 'store/constant';
import SectionsList from './SectionsList';

// ==============================|| SECTIONS PAGE ||============================== //

const SectionsPage = () => {
    return (
        <MainCard title="Liste des sections">
            <Grid container spacing={gridSpacing}>
                <Grid item xs={12}>
                    <SectionsList />
                </Grid>
            </Grid>
        </MainCard>
    );
};

export default SectionsPage;
