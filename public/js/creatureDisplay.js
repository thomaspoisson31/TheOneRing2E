let creatureCounter = 0;
let creatureInstances = window.creatureInstances || new Map();
window.creatureInstances = creatureInstances; // Stockage des instances d'adversaires
let creaturePlayerAssociations = window.creaturePlayerAssociations || new Map();
window.creaturePlayerAssociations = creaturePlayerAssociations; // Stockage des associations adversaire-PJ (Set)
window.dragPlaceholder = document.createElement('div');
window.dragPlaceholder.className = 'drop-placeholder';

function cycleInstanceAdvantage(instanceId) {
    const currentValue = creatureInstanceAdvantages.get(instanceId) || 0;
    // Cycle: 1 -> 0 -> -1 -> 2 -> 1 (+1D -> 0 -> -1D -> Distance -> +1D)
    let newValue;
    if (currentValue === 1) newValue = 0;
    else if (currentValue === 0) newValue = -1;
    else if (currentValue === -1) newValue = 2;
    else newValue = 1;

    creatureInstanceAdvantages.set(instanceId, newValue);

    const tabElement = document.querySelector(`.creature-tab[data-instance-id="${instanceId}"]`);
    if (tabElement) {
        const indicator = tabElement.querySelector('.advantage-indicator');
        if (indicator && typeof getAdvantageText === 'function') {
            indicator.textContent = getAdvantageText(newValue);
            // Classes pour le style
            indicator.className = 'advantage-indicator';
            if (newValue === 1) indicator.classList.add('positive');
            if (newValue === -1) indicator.classList.add('negative');
            if (newValue === 2) indicator.classList.add('distance');
        }
    }
}

function displayCreature(creature, familyName, resetSelect = true) {
    creatureCounter++;
    const instanceId = creatureCounter;
    
    const creatureInstance = creature.cloneNode(true);
    creatureInstances.set(instanceId, creatureInstance);

    const tabElement = document.createElement('div');
    tabElement.className = 'creature-tab';
    tabElement.dataset.instanceId = instanceId;
    tabElement.dataset.familyName = familyName;



    // --- ACTIVATION DRAG & DROP SUR L'ONGLET CRÉATURE ---
    tabElement.setAttribute('draggable', true);

    tabElement.addEventListener('dragstart', (e) => {
        tabElement.classList.add('dragging-creature');
        e.stopPropagation(); 
        e.dataTransfer.setData('text/plain', instanceId);
        e.dataTransfer.effectAllowed = 'move';
    });

    tabElement.addEventListener('dragend', (e) => {
        tabElement.classList.remove('dragging-creature');
        if (window.dragPlaceholder && window.dragPlaceholder.parentNode) {
            window.dragPlaceholder.parentNode.removeChild(window.dragPlaceholder);
        }
        e.stopPropagation();
    });

    // Support du drop de PJs sur la créature pour association
    tabElement.addEventListener('dragover', (e) => {
        const draggingPlayer = document.querySelector('.player-wrapper.dragging');
        if (draggingPlayer) {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'copy'; // Indique une association
        }
    });

    tabElement.addEventListener('drop', (e) => {
        const draggingPlayer = document.querySelector('.player-wrapper.dragging');
        if (draggingPlayer) {
            e.preventDefault();
            e.stopPropagation();
            const playerName = draggingPlayer.dataset.playerName;
            if (playerName) {
                // If dropping a PJ on a creature tab, we need to create a visual clone
                // in the dropped PJ's opponents list, unless it's already there
                // Since draggingPlayer is .player-wrapper.dragging, .pj-opponents is inside it.
                const pjOpponents = draggingPlayer.querySelector('.pj-opponents');

                if (!pjOpponents) return; // safety check

                // check if it's already associated visually
                const existingAssoc = pjOpponents.querySelector(`.creature-tab[data-instance-id="${instanceId}"]`);
                if (!existingAssoc) {
                    const clonedTab = tabElement.cloneNode(true);
                    clonedTab.classList.add('secondary');

                    // We need to reattach dragging logic to the clone
                    clonedTab.addEventListener('dragstart', (ev) => {
                        clonedTab.classList.add('dragging-creature');
                        ev.stopPropagation();
                        ev.dataTransfer.setData('text/plain', instanceId);
                        ev.dataTransfer.effectAllowed = 'move';
                    });
                    clonedTab.addEventListener('dragend', (ev) => {
                        clonedTab.classList.remove('dragging-creature');
                        if (window.dragPlaceholder && window.dragPlaceholder.parentNode) {
                            window.dragPlaceholder.parentNode.removeChild(window.dragPlaceholder);
                        }
                        ev.stopPropagation();
                    });

                    clonedTab.addEventListener('click', function(ev) {
                        ev.stopPropagation();
                        document.querySelectorAll('.player-tab, .creature-tab').forEach(tab =>
                            tab.classList.remove('active')
                        );
                        clonedTab.classList.add('active');
                        const creatureInstance = creatureInstances.get(instanceId);
                        if (creatureInstance) {
                            displayCreatureDetails(creatureInstance, familyName);
                        }
                    });

                    pjOpponents.appendChild(clonedTab);
                    associatePlayer(instanceId, playerName);
                }
            }
        }
    });
    // ----------------------------------------------------

    // Créer le conteneur pour le contenu de l'onglet
    const tabContent = document.createElement('div');
    tabContent.className = 'tab-content';
    
    // Afficher le nom en petits caractères
    const name = creature.getElementsByTagName('nom')[0]?.textContent || `${instanceId}`;
    tabContent.innerHTML = `<span class="creature-tab-name">${name}</span>`;

    tabElement.appendChild(tabContent);
    
    tabElement.addEventListener('click', function() {
        // creatureSelect est global (id="creatureSelect" dans HTML) mais ici on parle peut-être du dropdown header
        // qui est maintenant supprimé de displayCreatureDetails, mais l'élément global existe.
        const globalSelect = document.getElementById('creatureSelect');
        if (globalSelect) globalSelect.value = '';
        
        // Désélectionner tous les onglets
        document.querySelectorAll('.player-tab, .creature-tab').forEach(tab => 
            tab.classList.remove('active')
        );
        
        this.classList.add('active');
        
        const instance = creatureInstances.get(parseInt(this.dataset.instanceId));
        if (instance) {
            displayCreatureDetails(instance, this.dataset.familyName);
            updateSoundIconVisibility(this.dataset.familyName);
        }

        // Feature b & c: Update icons visibility for Adversaire (Show Rune, Hide Eye)
        const eyeButton = document.getElementById('eyeButton');
        const runeButton = document.getElementById('runeButton');
        if (eyeButton) eyeButton.style.display = 'none';
        if (runeButton) runeButton.style.display = 'flex'; // or 'block' depending on CSS, flex is safer for centering
    });
    
    // Déterminer où ajouter l'onglet de la créature
    let targetContainer = document.getElementById('creatureTabs'); // Par défaut dans le conteneur principal (à droite)
    const activePlayerTab = document.querySelector('.player-tab.active');
    
    if (activePlayerTab) {
        const wrapper = activePlayerTab.closest('.player-wrapper');
        const opponentsContainer = wrapper ? wrapper.querySelector('.pj-opponents') : null;
        
        if (opponentsContainer) {
            targetContainer = opponentsContainer;
            
            // Associer la créature au PJ actif
            const playerName = wrapper.dataset.playerName;
            if (playerName) {
                if (!creaturePlayerAssociations.has(instanceId)) {
                    creaturePlayerAssociations.set(instanceId, new Set());
                }
                creaturePlayerAssociations.get(instanceId).add(playerName);
            }
        }
    }

    targetContainer.appendChild(tabElement);
    tabElement.click();
}

function loadPlayerCharacters() {
    fetch('data/PJ.xml')
        .then(response => response.text())
        .then(str => {
            const parser = new DOMParser();
            const pjDoc = parser.parseFromString(str, "text/xml");
            window.playerCharacters = Array.from(pjDoc.getElementsByTagName('Player_Character'))
                .map(pc => {
                    const nameElement = pc.getElementsByTagName('Name')[0];
                    const parryElement = pc.getElementsByTagName('Parry')[0];
                    if (nameElement && parryElement) {
                        return {
                            name: nameElement.textContent,
                            parry: parryElement.textContent
                        };
                    }
                    return null;
                })
                .filter(pc => pc !== null);
        })
        .catch(error => console.error('Erreur lors du chargement des PJ:', error));
}

function updateAssociatedPlayersList(instanceId) {
    const listContainer = document.getElementById('associated-players-list');
    // Si la carte de cette créature n'est pas affichée, on ne fait rien
    const activeTab = document.querySelector('.creature-tab.active');
    if (!listContainer || !activeTab || parseInt(activeTab.dataset.instanceId) !== instanceId) return;

    const playersSet = creaturePlayerAssociations.get(instanceId);
    
    if (!playersSet || playersSet.size === 0) {
        listContainer.innerHTML = '<p class="no-association">Aucun PJ associé</p>';
        return;
    }

    let html = '';
    playersSet.forEach(playerName => {
        const staticPC = window.playerCharacters ? window.playerCharacters.find(pc => pc.name === playerName) : null;
        const parry = staticPC ? staticPC.parry : '?';

        html += `
            <div class="associated-player-item">
                <div class="player-info">
                    <span class="player-name">${playerName}</span>
                    <span class="player-stats">Parade: ${parry}</span>
                </div>
                <button class="icon-button delete-icon-small" onclick="dissociatePlayer(${instanceId}, '${playerName.replace(/'/g, "\\'")}')" title="Dissocier">×</button>
            </div>
        `;
    });
    listContainer.innerHTML = html;
}

function updateInstanceValue(instanceId, field, value) {
    const instance = creatureInstances.get(instanceId);
    if (instance) {
        const attributs = instance.getElementsByTagName('attributs')[0];
        const element = attributs.getElementsByTagName(field)[0];
        if (element) {
            element.textContent = value;
        }
    }
}

function adjustCreatureStat(instanceId, field, delta) {
    const inputId = `creature-${field}-${instanceId}`;
    const input = document.getElementById(inputId);
    if (input) {
        const currentValue = parseInt(input.value) || 0;
        const newValue = currentValue + delta;
        input.value = newValue;
        updateInstanceValue(instanceId, field, newValue);
    }
}

function getFamilyCapacities(familyName) {
    const famille = Array.from(xmlDoc.getElementsByTagName('famille'))
        .find(f => f.getAttribute('nom') === familyName);
    
    if (!famille) return [];
    
    const capacites = Array.from(famille.children)
        .find(child => child.tagName === 'capacites_famille');
    
    if (!capacites) return [];
    
    return Array.from(capacites.getElementsByTagName('capacite'));
}

function displayCreatureDetails(creature, familyName) {
    const name = creature.getElementsByTagName('nom')[0].textContent;
    const imageUrl = creature.getElementsByTagName('url_image')[0]?.textContent;
    const instanceId = parseInt(document.querySelector('.creature-tab.active')?.dataset.instanceId);

    let html = `
        <div class="creature-header">
            <div class="creature-title">
                <div class="creature-title-left">
                    <span class="creature-name" onclick="showImage('${imageUrl}')">${name}</span>
                    <img src="images/sound-icon.png" alt="Son" class="sound-icon" id="soundIcon">
                    <button class="icon-button delete-icon" onclick="deleteCreature(${instanceId})" title="Supprimer" style="margin-left: 10px;">🗑️</button>
                </div>
            </div>
        </div>`;

    // Attributs
    const attributs = creature.getElementsByTagName('attributs')[0];
    const endurance = attributs.getElementsByTagName('endurance')[0].textContent;
    const haine = attributs.getElementsByTagName('haine')[0].textContent;

    // Stats
    html += '<div class="stats-grid">';
    
    // Niveau
    html += `
        <div class="stat-diamond">
            <img src="images/diamond.png" alt="diamond">
            <div class="stat-label">Niveau</div>
            <div class="stat-value">${attributs.getElementsByTagName('niveau')[0].textContent}</div>
        </div>`;
    
    // Parade
    html += `
        <div class="stat-diamond">
            <img src="images/diamond.png" alt="diamond">
            <div class="stat-label">Parade</div>
            <div class="stat-value">${attributs.getElementsByTagName('parade')[0].textContent}</div>
        </div>`;
    
    // Armure
    html += `
        <div class="stat-diamond">
            <img src="images/diamond.png" alt="diamond">
            <div class="stat-label">Armure</div>
            <div class="stat-value">${attributs.getElementsByTagName('armure')[0].textContent}</div>
        </div>`;
    
    // Endurance (modifiable)
    html += `
        <div class="stat-wrapper">
            <button class="stat-btn" onclick="adjustCreatureStat(${instanceId}, 'endurance', -1)">-</button>
            <div class="stat-diamond">
                <img src="images/diamond.png" alt="diamond">
                <div class="stat-label">Endurance</div>
                <input type="number" 
                    value="${endurance}" 
                    class="stat-input"
                    id="creature-endurance-${instanceId}"
                    onchange="updateInstanceValue(${instanceId}, 'endurance', this.value)">
            </div>
            <button class="stat-btn" onclick="adjustCreatureStat(${instanceId}, 'endurance', 1)">+</button>
        </div>`;
    
    // Haine (modifiable)
    html += `
        <div class="stat-wrapper">
            <button class="stat-btn" onclick="adjustCreatureStat(${instanceId}, 'haine', -1)">-</button>
            <div class="stat-diamond">
                <img src="images/diamond.png" alt="diamond">
                <div class="stat-label">Haine</div>
                <input type="number" 
                    value="${haine}" 
                    class="stat-input"
                    id="creature-haine-${instanceId}"
                    onchange="updateInstanceValue(${instanceId}, 'haine', this.value)">
            </div>
            <button class="stat-btn" onclick="adjustCreatureStat(${instanceId}, 'haine', 1)">+</button>
        </div>`;
    
    html += '</div>';

    // Compétences et capacités
    html += '<div class="details-grid">';

    // Compétences de combat
    const competences = creature.getElementsByTagName('competences_combat')[0];
    const puissance = attributs.getElementsByTagName('puissance')[0].textContent;
    
    if (competences.getElementsByTagName('arme').length > 0) {
        html += '<div class="combat-skills">';
        html += '<div class="combat-header">';
        html += '<h3>Combat</h3>';
        if (parseInt(puissance) >= 2) {
            html += `<span class="puissance-badge">${puissance}</span>`;
        }
        html += '</div><ul>';
        
        for (let arme of competences.getElementsByTagName('arme')) {
            const nomArme = arme.getElementsByTagName('nom_arme')[0]?.textContent || '';
            const valeurArme = parseInt(arme.getElementsByTagName('valeur_arme')[0]?.textContent || '0');
            const degatsArme = arme.getElementsByTagName('degats_arme')[0]?.textContent || '';
            const specialArme = arme.getElementsByTagName('special_arme')[0]?.textContent || '';

            const diamonds = '&#9830;'.repeat(valeurArme);

            html += `<li>
                <span class="weapon-name">${nomArme}</span> 
                <span class="weapon-value">${diamonds}</span> 
                (<span>${degatsArme}</span>)
                ${specialArme ? `<span class="weapon-special" onclick="toggleSpecialDetails(this)">${specialArme}</span>
                <div class="weapon-special-details">${specialDescriptions[specialArme] || ''}</div>` : ''}
            </li>`;
        }
        html += '</ul></div>';
    }

    // Capacités
    const creatureCapacites = creature.getElementsByTagName('capacites')[0];
    const familyCapacites = getFamilyCapacities(familyName);
    
    if ((creatureCapacites?.getElementsByTagName('capacite').length > 0) || familyCapacites.length > 0) {
        html += '<div class="capacites"><h3>Capacités</h3>';
        
        if (creatureCapacites) {
            for (let capacite of creatureCapacites.getElementsByTagName('capacite')) {
                const titre = capacite.getElementsByTagName('Titre_Capacite')[0].textContent;
                const details = capacite.getElementsByTagName('Detail_Capacite')[0].textContent;
                html += `
                    <div class="capacite-item" onclick="toggleDetails(this)">
                        <strong>${titre}</strong>
                        <div class="details">${details}</div>
                    </div>`;
            }
        }
        
        for (let capacite of familyCapacites) {
            const titre = capacite.getElementsByTagName('Titre_Capacite')[0].textContent;
            const details = capacite.getElementsByTagName('Detail_Capacite')[0].textContent;
            html += `
                <div class="capacite-item" onclick="toggleDetails(this)">
                    <strong>${titre}</strong>
                    <div class="details">${details}</div>
                </div>`;
            }
        
        html += '</div>';
    }
        
    // Section PJ Associés déplacée APRÈS les compétences/capacités
    html += `
        <div class="associated-section">
            <h3>PJ Associé</h3>
            <div id="associated-players-list" class="associated-list"></div>
        </div>
    `;

    creatureCard.innerHTML = html;
    creatureCard.style.display = 'block';
    creatureCard.dataset.instanceId = instanceId;
    
    // Mettre à jour la liste des joueurs associés
    updateAssociatedPlayersList(instanceId);
}

function associatePlayer(instanceId, playerName) {
    if (!creaturePlayerAssociations.has(instanceId)) {
        creaturePlayerAssociations.set(instanceId, new Set());
    }
    creaturePlayerAssociations.get(instanceId).add(playerName);
    updateAssociatedPlayersList(instanceId);
}

function dissociatePlayer(instanceId, playerName) {
    if (creaturePlayerAssociations.has(instanceId)) {
        creaturePlayerAssociations.get(instanceId).delete(playerName);
        updateAssociatedPlayersList(instanceId);
    }
}

function deleteCreature(instanceId) {
    const tabElements = document.querySelectorAll(`.creature-tab[data-instance-id="${instanceId}"]`);
    tabElements.forEach(tab => tab.remove());

    creatureInstances.delete(instanceId);
    creaturePlayerAssociations.delete(instanceId);
    creatureCard.style.display = 'none';
}

// Charger les PJ au démarrage
window.addEventListener('DOMContentLoaded', loadPlayerCharacters);

window.associatePlayer = associatePlayer;
window.dissociatePlayer = dissociatePlayer;
