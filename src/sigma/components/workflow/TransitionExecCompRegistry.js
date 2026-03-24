import TransitionExecutionModal from './TransitionExecutionModal';
import PaymentFormTest from './PaymentFormTest';

/**
 * Registre des composants d'exécution de transition.
 * Permet de mapper un code (provenant de la base de données) à un composant React.
 */
export const TRANSITION_COMPONENTS = {
    // Composant par défaut si aucun code n'est spécifié ou si le code est inconnu
    'DEFAULT': TransitionExecutionModal,

    // Ajoutez d'autres composants ici au fur et à mesure
    'PAYMENT_FORM_TRANS_EXEC_COMP': PaymentFormTest,
};

/**
 * Récupère le composant d'exécution pour une transition donnée.
 * @param {string} code - Le code du composant d'exécution.
 * @returns {React.Component} - Le composant React à utiliser.
 */
export const getTransitionComponent = (code) => {
  return (code && TRANSITION_COMPONENTS[code]) || TRANSITION_COMPONENTS['DEFAULT'];
};

export default TRANSITION_COMPONENTS;
