// Stockage des instances de personnages
let playerInstances = window.playerInstances || new Map();
window.playerInstances = playerInstances;
let playerAdvantages = new Map(); // Pour stocker l'état de la posture de combat (zone du milieu)
window.playerAdvantages = playerAdvantages;
let heroTopAdvantages = new Map(); // Pour stocker les avantages de combat héros (zone du haut)
window.heroTopAdvantages = heroTopAdvantages;
let heroBottomAdvantages = new Map(); // Pour stocker les avantages de combat adversaires (zone du bas)
window.heroBottomAdvantages = heroBottomAdvantages;
let heroRepousseStates = window.heroRepousseStates || new Map();
window.heroRepousseStates = heroRepousseStates;

function displayPlayerProfile(player) {
    const name = player.getElementsByTagName('Name')[0].textContent;
    const endurance = player.getElementsByTagName('Endurance')[0].textContent;
    const hope = player.getElementsByTagName('Hope')[0].textContent;
    const wits = player.getElementsByTagName('WITS')[0].textContent;
    const parry = player.getElementsByTagName('Parry')[0].textContent;
    const armourValue = player.getElementsByTagName('Leather_shirt')[0]?.getElementsByTagName('Value')[0]?.textContent || '0';
    
    // Trouver l'index du joueur existant ou en créer un nouveau
    let playerIndex = Array.from(playerInstances.entries())
        .find(([_, p]) => p.getElementsByTagName('Name')[0].textContent === name)?.[0];
    
    if (playerIndex === undefined) {
        playerIndex = playerInstances.size;
        playerInstances.set(playerIndex, player);
    }

    // Initialiser l'avantage si nécessaire
    if (!playerAdvantages.has(playerIndex)) {
        playerAdvantages.set(playerIndex, 0);
    }

    // Désélectionner tous les onglets de créatures
    document.querySelectorAll('.creature-tab').forEach(tab => 
        tab.classList.remove('active')
    );

    // Feature b & c: Update icons visibility for PJ (Show Eye, Hide Rune)
    const eyeButton = document.getElementById('eyeButton');
    const runeButton = document.getElementById('runeButton');
    if (eyeButton) eyeButton.style.display = 'flex'; // or 'block'
    if (runeButton) runeButton.style.display = 'none';

    // Récupérer les créatures associées
    const associatedCreatures = getAssociatedCreatures(name);

    const currentAdvantage = heroTopAdvantages.get(playerIndex) || 0;
    const advantageText = typeof getAdvantageText === 'function' ? getAdvantageText(currentAdvantage) : '0';
    let advantageClass = 'neutral';
    if (currentAdvantage === 1 || currentAdvantage === 2) advantageClass = 'positive';
    else if (currentAdvantage === -1 || currentAdvantage === -2) advantageClass = 'negative';

    const isRepousse = heroRepousseStates.get(playerIndex) || false;

    let html = `
        <button class="card-delete-btn" onclick="deletePlayer(${playerIndex})" title="Supprimer">×</button>
        <div class="creature-header">
            <div class="creature-title">
                <div class="creature-title-left">
                    <span class="creature-name">${name}</span>
                </div>
                <div class="creature-title-right">
                    <div class="opponent-cartouche-container">
                        ${associatedCreatures.map(creature => {
                            const advVal = window.creatureInstanceAdvantages ? (window.creatureInstanceAdvantages.get(creature.id) || 0) : 0;
                            const advText = typeof getAdvantageText === 'function' ? getAdvantageText(advVal) : '0';
                            let advClass = '';
                            if (advVal === 1 || advVal === 2) advClass = 'positive';
                            else if (advVal === -1 || advVal === -2) advClass = 'negative';

                            return `
                                <div class="opponent-cartouche" onclick="displayCreatureFromId(${creature.id})">
                                    <div class="opponent-content">
                                        <div class="opponent-info">
                                            <span class="opponent-name">${creature.name}</span>
                                            <span class="opponent-stats">Parade: ${creature.parade}</span>
                                        </div>
                                        <div class="opponent-badge-row">
                                            <span class="advantage-badge ${advClass}">${advText}</span>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    <div class="combat-modifier-badge ${advantageClass}" onclick="cycleHeroCombatAdvantageInCard(${playerIndex})" title="Modificateur de combat">${advantageText}</div>
                    <button class="card-repousse-btn ${isRepousse ? 'active' : ''}" onclick="toggleHeroRepousseInCard(${playerIndex})">Repoussé</button>
                </div>
            </div>
        </div>`;

    // Grille de statistiques
    html += '<div class="stats-grid">';
    
    // Ligne 1: Esprit, Parade, Armure
    html += '<div class="stats-row stats-row-top">';
    html += `
        <div class="stat-diamond">
            <img src="images/diamond.png" alt="diamond">
            <div class="stat-label">Esprit</div>
            <div class="stat-value">${wits}</div>
        </div>`;
    
    html += `
        <div class="stat-diamond">
            <img src="images/diamond.png" alt="diamond">
            <div class="stat-label">Parade</div>
            <div class="stat-value">${parry}</div>
        </div>`;
    
    html += `
        <div class="stat-diamond">
            <img src="images/diamond.png" alt="diamond">
            <div class="stat-label">Armure</div>
            <div class="stat-value">${armourValue}</div>
        </div>`;
    html += '</div>';

    // Ligne 2: Endurance, Espoir
    html += '<div class="stats-row stats-row-bottom">';
    html += `
        <div class="stat-wrapper">
            <button class="stat-btn" onclick="adjustPlayerStat(${playerIndex}, 'Endurance', -1)">-</button>
            <div class="stat-diamond">
                <img src="images/diamond.png" alt="diamond">
                <div class="stat-label">Endurance</div>
                <input type="number" 
                    value="${endurance}" 
                    class="stat-input"
                    id="player-Endurance-${playerIndex}"
                    onchange="updatePlayerValue(${playerIndex}, 'Endurance', this.value)">
            </div>
            <button class="stat-btn" onclick="adjustPlayerStat(${playerIndex}, 'Endurance', 1)">+</button>
        </div>`;
    
    html += `
        <div class="stat-wrapper">
            <button class="stat-btn" onclick="adjustPlayerStat(${playerIndex}, 'Hope', -1)">-</button>
            <div class="stat-diamond">
                <img src="images/diamond.png" alt="diamond">
                <div class="stat-label">Espoir</div>
                <input type="number" 
                    value="${hope}" 
                    class="stat-input"
                    id="player-Hope-${playerIndex}"
                    onchange="updatePlayerValue(${playerIndex}, 'Hope', this.value)">
            </div>
            <button class="stat-btn" onclick="adjustPlayerStat(${playerIndex}, 'Hope', 1)">+</button>
        </div>`;
    html += '</div>';
    
    html += '</div>';

        
    creatureCard.innerHTML = html;
    creatureCard.style.display = 'block';

    // Mettre à jour la carte créature ouverte si nécessaire
    const activeTab = document.querySelector('.creature-tab.active');
    if (activeTab && typeof updateAssociatedPlayersList === 'function') {
        updateAssociatedPlayersList(parseInt(activeTab.dataset.instanceId));
    }
}

function cycleAdvantage(playerIndex) {
    const currentValue = playerAdvantages.get(playerIndex) || 0;
    const newValue = currentValue === 1 ? -1 : currentValue + 1;
    playerAdvantages.set(playerIndex, newValue);
    
    // Mettre à jour le texte du bouton
    const button = document.querySelector('.advantage-button');
    if (button) {
        button.textContent = getAdvantageText(newValue);
    }

    // Mettre à jour la carte créature ouverte si nécessaire
    const activeTab = document.querySelector('.creature-tab.active');
    if (activeTab && typeof updateAssociatedPlayersList === 'function') {
        updateAssociatedPlayersList(parseInt(activeTab.dataset.instanceId));
    }
}

function displayCreatureFromId(instanceId) {
    const tab = document.querySelector(`.creature-tab[data-instance-id="${instanceId}"]`);
    if (tab) {
        tab.click();
    }
}

function getAssociatedCreatures(playerName) {
    const associatedCreatures = [];
    creaturePlayerAssociations.forEach((playerSet, instanceId) => {
        if (playerSet && playerSet.has(playerName)) {
            const tab = document.querySelector(`.creature-tab[data-instance-id="${instanceId}"]`);
            const instance = creatureInstances.get(instanceId);
            if (tab && instance) {
                const parade = instance.getElementsByTagName('parade')[0]?.textContent || '-';
                associatedCreatures.push({
                    id: instanceId,
                    name: instance.getElementsByTagName('nom')[0].textContent,
                    familyName: tab.dataset.familyName,
                    parade: parade
                });
            }
        }
    });
    return associatedCreatures;
}

function updatePlayerValue(instanceId, field, value) {
    const instance = playerInstances.get(instanceId);
    if (instance) {
        const element = instance.getElementsByTagName(field)[0];
        if (element) {
            element.textContent = value;
        }
    }
    if (field === 'Endurance' && typeof updateRandomAssociationButtonVisibility === 'function') {
        updateRandomAssociationButtonVisibility();
    }
}

function adjustPlayerStat(playerIndex, field, delta) {
    const inputId = `player-${field}-${playerIndex}`;
    const input = document.getElementById(inputId);
    if (input) {
        const currentValue = parseInt(input.value) || 0;
        const newValue = currentValue + delta;
        input.value = newValue;
        updatePlayerValue(playerIndex, field, newValue);
    }
}

function deletePlayer(playerIndex) {
    const wrapper = document.querySelector(`.player-wrapper[data-player-index="${playerIndex}"]`);
    if (wrapper) {
        wrapper.remove();
    }
    playerInstances.delete(playerIndex);
    // Masquer la carte si nécessaire
    creatureCard.style.display = 'none';
}

function cyclePlayerAdvantage(playerIndex, indicatorElement) {
    const currentValue = playerAdvantages.get(playerIndex) || 0;
    const newValue = typeof getNextPostureState === 'function' ? getNextPostureState(currentValue) : 0;
    playerAdvantages.set(playerIndex, newValue);

    if (indicatorElement && typeof updatePostureElementStyle === 'function') {
        updatePostureElementStyle(indicatorElement, newValue);
    }

    // Mettre à jour la carte créature ouverte si nécessaire
    const activeTab = document.querySelector('.creature-tab.active');
    if (activeTab && typeof updateAssociatedPlayersList === 'function') {
        updateAssociatedPlayersList(parseInt(activeTab.dataset.instanceId));
    }
}

function cycleHeroTopAdvantage(playerIndex, indicatorElement) {
    const currentValue = heroTopAdvantages.get(playerIndex) || 0;
    const newValue = typeof getNextCombatAdvantageValue === 'function' ? getNextCombatAdvantageValue(currentValue) : 0;
    heroTopAdvantages.set(playerIndex, newValue);

    if (indicatorElement && typeof updateAdvantageElementStyle === 'function') {
        updateAdvantageElementStyle(indicatorElement, newValue);
    }
}

function cycleHeroBottomAdvantage(playerIndex, indicatorElement) {
    const currentValue = heroBottomAdvantages.get(playerIndex) || 0;
    const newValue = typeof getNextCombatAdvantageValue === 'function' ? getNextCombatAdvantageValue(currentValue) : 0;
    heroBottomAdvantages.set(playerIndex, newValue);

    if (indicatorElement && typeof updateAdvantageElementStyle === 'function') {
        updateAdvantageElementStyle(indicatorElement, newValue);
    }
}

function cycleHeroCombatAdvantageInCard(playerIndex) {
    const currentValue = heroTopAdvantages.get(playerIndex) || 0;
    const newValue = typeof getNextCombatAdvantageValue === 'function' ? getNextCombatAdvantageValue(currentValue) : 0;
    heroTopAdvantages.set(playerIndex, newValue);

    const badge = document.querySelector('.creature-title-right .combat-modifier-badge');
    if (badge) {
        badge.textContent = typeof getAdvantageText === 'function' ? getAdvantageText(newValue) : '0';
        badge.classList.remove('positive', 'negative', 'neutral');
        if (newValue === 1 || newValue === 2) badge.classList.add('positive');
        else if (newValue === -1 || newValue === -2) badge.classList.add('negative');
        else badge.classList.add('neutral');
    }
}

function toggleHeroRepousseInCard(playerIndex) {
    const currentState = !(heroRepousseStates.get(playerIndex) || false);
    heroRepousseStates.set(playerIndex, currentState);

    const btn = document.querySelector('.creature-title-right .card-repousse-btn');
    if (btn) {
        if (currentState) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    }
}

window.cyclePlayerAdvantage = cyclePlayerAdvantage;
window.cycleHeroTopAdvantage = cycleHeroTopAdvantage;
window.cycleHeroBottomAdvantage = cycleHeroBottomAdvantage;
window.cycleHeroCombatAdvantageInCard = cycleHeroCombatAdvantageInCard;
window.toggleHeroRepousseInCard = toggleHeroRepousseInCard;
