// Stockage des instances de personnages
let playerInstances = new Map();
let playerAdvantages = new Map(); // Pour stocker l'état des avantages

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

    let html = `
        <div class="creature-header">
            <div class="creature-title">
                <div class="creature-title-left">
                    <span class="creature-name">${name}</span>
                    <button class="icon-button delete-icon" onclick="deletePlayer(${playerIndex})" title="Supprimer" style="margin-left: 10px;">🗑️</button>
                </div>
            </div>
        </div>`;

    // Grille de statistiques
    html += '<div class="stats-grid">';
    
    // Esprit (non modifiable)
    html += `
        <div class="stat-diamond">
            <img src="images/diamond.png" alt="diamond">
            <div class="stat-label">Esprit</div>
            <div class="stat-value">${wits}</div>
        </div>`;
    
    // Parade (non modifiable)
    html += `
        <div class="stat-diamond">
            <img src="images/diamond.png" alt="diamond">
            <div class="stat-label">Parade</div>
            <div class="stat-value">${parry}</div>
        </div>`;
    
    // Armure (non modifiable)
    html += `
        <div class="stat-diamond">
            <img src="images/diamond.png" alt="diamond">
            <div class="stat-label">Armure</div>
            <div class="stat-value">${armourValue}</div>
        </div>`;
    
    // Endurance (modifiable)
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
    
    // Espoir (modifiable)
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

    // Zone des créatures associées
    if (associatedCreatures.length > 0) {
        html += '<div class="associated-creatures-area">';
        html += '<h3>Créatures associées</h3>';
        html += '<div class="creatures-grid">';
        
        associatedCreatures.forEach(creature => {
            html += `
                <div class="creature-item" onclick="displayCreatureFromId(${creature.id})">
                    <div class="creature-number">${creature.id}</div>
                    <div class="creature-details">
                        <div class="creature-name">${creature.name}</div>
                        <div class="creature-parade">Parade: ${creature.parade}</div>
                    </div>
                </div>`;
        });
        
        html += '</div></div>';
    }
        
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
