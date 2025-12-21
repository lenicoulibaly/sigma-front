import React, { useMemo, useState } from 'react';
import { Stack, Avatar, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import GenericSearchablePaginatedList from 'src/sigma/components/commons/GenericSearchablePaginatedList';
import { useSearchUsers, useVisibleStructures, useBlockUser, useUnblockUser, useSendActivationEmail } from 'src/sigma/hooks/query';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import EmailIcon from '@mui/icons-material/Email';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ListIcon from '@mui/icons-material/List';
import ViewUserModal from 'src/sigma/views/administration/users/ViewUserModal';
import EditUserModal from 'src/sigma/views/administration/users/EditUserModal';
import AddUserProfileModal from 'src/sigma/views/administration/users/AddUserProfileModal';

const GenericListDemo = () => {
    const navigate = useNavigate();

    // Local UI state for modals
    const [selectedUser, setSelectedUser] = useState(null);
    const [openView, setOpenView] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [openAddProfile, setOpenAddProfile] = useState(false);

    // Structures filter options
    const { data: visibleStructures } = useVisibleStructures();
    const structureOptions = useMemo(() => {
        const list = visibleStructures ?? [];
        return list.map((s) => ({ value: s.strId, label: s.strName}));
    }, [visibleStructures]);

    const blockMutation = useBlockUser();
    const unblockMutation = useUnblockUser();
    const sendActivationMutation = useSendActivationEmail();

    const openViewModal = (user) => { setSelectedUser(user); setOpenView(true); };
    const openEditModal = (user) => { setSelectedUser(user); setOpenEdit(true); };
    const openAddProfileModal = (user) => { setSelectedUser(user); setOpenAddProfile(true); };

    return (
        <>
            <GenericSearchablePaginatedList
                title="Exemple - Liste générique des utilisateurs"
                queryHook={useSearchUsers}
                searchLabel="Recherche multi-critères"
                dropdownFilters={[
                    {
                        name: 'strId',
                        label: 'Structure',
                        options: structureOptions,
                        multi: false
                    }
                ]}
                columns={[
                    { header: 'Utilisateur', render: (row) => (
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Avatar sx={{ width: 24, height: 24 }}>{(row.firstName?.[0] || '?')}{(row.lastName?.[0] || '')}</Avatar>
                            <span>{row.firstName} {row.lastName}</span>
                        </Stack>
                    ) },
                    { header: 'Email', field: 'email' },
                    { header: 'Statut', render: (row) => (
                        row.enabled ? <Chip size="small" color="success" label="Actif"/> : <Chip size="small" color="default" label="Inactif"/>
                    ) }
                ]}
                addButton={{ tooltip: 'Ajouter un utilisateur', onClick: () => { console.log('Add user clicked'); } }}
                paramMapper={({ page, size, search, filters }) => ({
                    page,
                    size,
                    key: search,
                    strId: filters?.strId || undefined
                })}
                getRowId={(row) => row.userId}
                rowActions={[
                    {
                        label: 'Voir le détail',
                        icon: <VisibilityIcon fontSize="small" />,
                        onClick: (row) => openViewModal(row)
                    },
                    {
                        label: 'Modifier l\'utilisateur',
                        icon: <EditIcon fontSize="small" />,
                        onClick: (row) => openEditModal(row)
                    },
                    {
                        label: 'Bloquer l\'utilisateur',
                        icon: <BlockIcon fontSize="small" />,
                        color: 'error',
                        visible: (row) => row.notBlocked === true,
                        confirm: {
                            title: 'Bloquer l\'utilisateur',
                            content: 'Voulez-vous vraiment bloquer cet utilisateur ?'
                        },
                        mutation: {
                            mutate: blockMutation.mutate,
                            variablesMapper: (row) => row.userId
                        }
                    },
                    {
                        label: 'Débloquer l\'utilisateur',
                        icon: <LockOpenIcon fontSize="small" />,
                        color: 'primary',
                        visible: (row) => row.notBlocked === false,
                        confirm: {
                            title: 'Débloquer l\'utilisateur',
                            content: 'Voulez-vous vraiment débloquer cet utilisateur ?'
                        },
                        mutation: {
                            mutate: unblockMutation.mutate,
                            variablesMapper: (row) => row.userId
                        }
                    },
                    {
                        label: 'Envoyer un lien d\'activation',
                        icon: <EmailIcon fontSize="small" />,
                        confirm: {
                            title: 'Envoyer un lien d\'activation',
                            content: 'Confirmez-vous l\'envoi du lien d\'activation à cet utilisateur ?'
                        },
                        mutation: {
                            mutate: sendActivationMutation.mutate,
                            variablesMapper: (row) => row.userId
                        }
                    },
                    {
                        label: 'Ajouter un profil',
                        icon: <PersonAddIcon fontSize="small" />,
                        onClick: (row) => openAddProfileModal(row)
                    },
                    {
                        label: 'Afficher la liste des profils',
                        icon: <ListIcon fontSize="small" />,
                        onClick: (row) => navigate(`/administration/users/${row.userId}/profiles`)
                    }
                ]}
            />

            {/* View User Modal */}
            {selectedUser && (
                <ViewUserModal
                    open={openView}
                    handleClose={() => setOpenView(false)}
                    user={selectedUser}
                />
            )}

            {/* Edit User Modal */}
            {selectedUser && (
                <EditUserModal
                    open={openEdit}
                    handleClose={() => setOpenEdit(false)}
                    user={selectedUser}
                />
            )}

            {/* Add User Profile Modal */}
            {selectedUser && (
                <AddUserProfileModal
                    open={openAddProfile}
                    handleClose={() => setOpenAddProfile(false)}
                    userId={selectedUser.userId}
                    user={selectedUser}
                />
            )}
        </>
    );
};

export default GenericListDemo;
