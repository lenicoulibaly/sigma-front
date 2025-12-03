import Modal from "./Modal";
import React from "react";
import PropTypes from "prop-types";

export const IFrameModal = ({ base64String = '', title = '', opened = false, handleClose, mimeType = 'application/pdf', height = '500px' }) => {
    return (
        <Modal actionVisible={false} open={opened} handleClose={handleClose} title={title} width={'md'}>
            {base64String ? (
                <iframe
                    src={`data:${mimeType};base64,${base64String}`}
                    style={{ width: '100%', height, border: 'none' }}
                    title={title}
                />
            ) : (
                <p>Chargement du document...</p>
            )}
        </Modal>
    );
};
IFrameModal.propTypes = {
    opened: PropTypes.bool,
    title: PropTypes.string,
    handleClose: PropTypes.func.isRequired,
    base64String: PropTypes.string,
    mimeType: PropTypes.string,
    height: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};