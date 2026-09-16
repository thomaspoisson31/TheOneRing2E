// Fonction pour formater le nom en initiales
function formatNameToInitials(name) {
    return name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .join('');
}

function getAdvantageText(value) {
    switch (value) {
        case -2: return '-2D';
        case -1: return '-1D';
        case 1: return '+1D';
        case 2: return '+2D';
        default: return '0';
    }
}

function getNextCombatAdvantageValue(currentValue) {
    switch (currentValue) {
        case 0: return 1;
        case 1: return -1;
        case -1: return 2;
        case 2: return -2;
        case -2: return 0;
        default: return 0;
    }
}

function updateAdvantageElementStyle(element, value) {
    if (!element) return;
    element.textContent = getAdvantageText(value);
    element.classList.remove('positive', 'negative', 'distance');
    if (value === 1 || value === 2) {
        element.classList.add('positive');
    } else if (value === -1 || value === -2) {
        element.classList.add('negative');
    }
}

window.getAdvantageText = getAdvantageText;
window.getNextCombatAdvantageValue = getNextCombatAdvantageValue;
window.updateAdvantageElementStyle = updateAdvantageElementStyle;
