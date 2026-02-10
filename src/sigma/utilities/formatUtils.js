/**
 * Formate un label pour l'affichage.
 * - Ajoute des espaces avant les majuscules (si camelCase)
 * - Met la première lettre en majuscule, le reste en minuscule (Sentence case)
 * - Remplace les underscores par des espaces
 * 
 * @param {string} str La chaîne à formater
 * @returns {string} La chaîne formatée
 */
export const formatLabel = (str) => {
    if (!str) return '';
    if (typeof str !== 'string') {
        try {
            str = String(str);
        } catch (e) {
            return '';
        }
    }
    
    // Remplacement des underscores par des espaces
    let result = str.replace(/_/g, ' ');
    
    // Ajout d'espaces avant les majuscules (pour le camelCase/PascalCase)
    // On ignore si le mot est déjà tout en majuscules
    if (result !== result.toUpperCase()) {
        result = result.replace(/([A-Z])/g, ' $1').trim();
    }
    
    // Suppression des doubles espaces éventuels
    result = result.replace(/\s+/g, ' ');
    
    // Capitalisation de la première lettre, le reste en minuscule
    return result.charAt(0).toUpperCase() + result.slice(1).toLowerCase();
};
