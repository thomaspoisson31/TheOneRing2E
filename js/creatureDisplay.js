let creatureCounter = 0;
let creatureInstances = new Map(); // Stockage des instances d'adversaires
let creaturePlayerAssociations = new Map(); // Stockage des associations adversaire-PJ

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
        e.stopPropagation(); // Empêcher le déclenchement du drag du parent (player-wrapper)
        // Stocker l'ID de l'instance pour la récupération
        e.dataTransfer.setData('text/plain', instanceId);
        e.dataTransfer.effectAllowed = 'move';
    });

    tabElement.addEventListener('dragend', (e) => {
        tabElement.classList.remove('dragging-creature');
        e.stopPropagation();
    });
    // ----------------------------------------------------

    // Créer le conteneur pour le contenu de l'onglet
    const tabContent = document.createElement('div');
    tabContent.className = 'tab-content';
    
    // Essayer de récupérer l'image
    const imageUrl = creature.getElementsByTagName('url_image')[0]?.textContent;
    
    if (imageUrl) {
        const imageElement = document.createElement('img');
        imageElement.src = imageUrl;
        imageElement.alt = creature.getElementsByTagName('nom')[0]?.textContent || `Creature ${instanceId}`;
        imageElement.className = 'creature-token';
        tabContent.appendChild(imageElement);
    } else {
        tabContent.innerHTML = `<span class="creature-tab-name">${instanceId}</span>`;
    }

    tabElement.appendChild(tabContent);
    
    tabElement.addEventListener('click', function() {
        creatureSelect.value = '';
        
        // Désélectionner tous les onglets (créatures ET personnages)
        document.querySelectorAll('.player-tab, .creature-tab').forEach(tab => 
            tab.classList.remove('active')
        );
        
        // Cacher le sélecteur car on n'est plus sur un PJ
        const selector = document.querySelector('.creature-selector');
        if (selector) selector.classList.remove('visible');

        this.classList.add('active');
        
        const instance = creatureInstances.get(parseInt(this.dataset.instanceId));
        if (instance) {
            displayCreatureDetails(instance, this.dataset.familyName);
            updateSoundIconVisibility(this.dataset.familyName);
        }
    });
    
    // Déterminer où ajouter l'onglet de la créature
    let targetContainer = creatureTabs;
    const activePlayerTab = document.querySelector('.player-tab.active');
    
    if (activePlayerTab) {
        const wrapper = activePlayerTab.closest('.player-wrapper');
        const opponentsContainer = wrapper ? wrapper.querySelector('.pj-opponents') : null;
        
        if (opponentsContainer) {
            targetContainer = opponentsContainer;
            
            // Associer la créature au PJ actif
            const playerName = wrapper.dataset.playerName;
            if (playerName) {
                creaturePlayerAssociations.set(instanceId, playerName);
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
            // Récupérer tous les personnages avec leur nom et leur parade
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

function updatePlayerSelect(instanceId) {
    const playerSelect = document.getElementById('playerSelect');
    if (playerSelect) {
        const savedPlayer = creaturePlayerAssociations.get(instanceId);
        playerSelect.value = savedPlayer || '';
        
        // Mettre à jour les options avec les valeurs d'avantage
        Array.from(playerSelect.options).forEach(option => {
            if (option.value) {
                const playerName = option.value;
                const playerIndex = Array.from(playerInstances.entries())
                    .find(([_, p]) => p.getElementsByTagName('Name')[0].textContent === playerName)?.[0];
                const advantage = playerAdvantages.get(playerIndex);
                const advantageText = advantage !== 0 ? `, ${getAdvantageText(advantage)}` : '';
                const parry = window.playerCharacters.find(pc => pc.name === playerName)?.parry || '';
                option.textContent = `${playerName} (${parry}${advantageText})`;
            }
        });
    }
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
                <div class="creature-title-right">
                    <select id="playerSelect" class="player-select" onchange="associatePlayer(${instanceId}, this.value)">
                        <option value="" disabled selected>Choix PJ</option>
                        ${window.playerCharacters ? window.playerCharacters.map(pc => 
                            `<option value="${pc.name}" ${creaturePlayerAssociations.get(instanceId) === pc.name ? 'selected' : ''}>${pc.name} (${pc.parry})</option>`
                        ).join('') : ''}
                    </select>
                </div>
            </div>
        </div>`;

    // Attributs
    const attributs = creature.getElementsByTagName('attributs')[0];
    const endurance = attributs.getElementsByTagName('endurance')[0].textContent;
    const haine = attributs.getElementsByTagName('haine')[0].textContent;

    // Nouvelle structure pour les statistiques
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

    // Compétences et capacités côte à côte
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

            // Création des symboles losange
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

    // Capacités (spécifiques à la créature et de la famille)
    const creatureCapacites = creature.getElementsByTagName('capacites')[0];
    const familyCapacites = getFamilyCapacities(familyName);
    
    if ((creatureCapacites?.getElementsByTagName('capacite').length > 0) || familyCapacites.length > 0) {
        html += '<div class="capacites"><h3>Capacités</h3>';
        
        // Capacités spécifiques à la créature
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
        
        // Capacités de la famille
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
        
    creatureCard.innerHTML = html;
    creatureCard.style.display = 'block';
    creatureCard.dataset.instanceId = instanceId;
    
    // Mettre à jour la sélection du PJ avec les avantages
    updatePlayerSelect(instanceId);
}

function associatePlayer(instanceId, playerName) {
    creaturePlayerAssociations.set(instanceId, playerName);
    updatePlayerSelect(instanceId);
}

function deleteCreature(instanceId) {
    const tabElement = document.querySelector(`.creature-tab[data-instance-id="${instanceId}"]`);
    if (tabElement) {
        tabElement.remove();
    }
    creatureInstances.delete(instanceId);
    creaturePlayerAssociations.delete(instanceId);
    creatureCard.style.display = 'none';
}

// Charger les PJ au démarrage
window.addEventListener('DOMContentLoaded', loadPlayerCharacters);
