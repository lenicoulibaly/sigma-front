// third-party
import { FormattedMessage } from 'react-intl';

// assets
import { IconUsers, IconBuildingCommunity, IconUserPlus, IconReceipt } from '@tabler/icons-react';

// constant
const icons = {
    IconUsers,
    IconBuildingCommunity,
    IconUserPlus,
    IconReceipt
};

// ==============================|| ASSOCIATIONS MENU ITEMS ||============================== //

const associations = {
    id: 'associations',
    title: 'Associations',
    type: 'collapse',
    icon: icons.IconUsers,
    children: [
        {
            id: 'associations-list',
            title: 'Associations',
            type: 'item',
            icon: icons.IconBuildingCommunity,
            url: '/business/associations/list',
            tooltip: 'Gestion des associations'
        },
        {
            id: 'sections',
            title: 'Sections',
            type: 'item',
            icon: icons.IconUsers,
            url: '/associations/sections',
            tooltip: 'Gestion des sections'
        },
        {
            id: 'membres',
            title: 'Membres',
            type: 'item',
            icon: icons.IconUserPlus,
            url: '/associations/membres',
            tooltip: 'Gestion des membres'
        },
        {
            id: 'cotisations',
            title: 'Cotisations',
            type: 'item',
            icon: icons.IconReceipt,
            url: '/associations/cotisations',
            tooltip: 'Gestion des cotisations'
        }
    ]
};

export default associations;