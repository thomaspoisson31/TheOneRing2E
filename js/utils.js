// Fonction pour formater le nom en initiales
function formatNameToInitials(name) {
    return name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .join('');
}