// Fonction pour formater le nom en initiales
function formatNameToInitials(name) {
    return name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .join('');
}

function getAdvantageText(value) {
    switch (value) {
        case -1: return '-1D';
        case 1: return '+1D';
        case 2: return 'Distance';
        default: return '0';
    }
}
