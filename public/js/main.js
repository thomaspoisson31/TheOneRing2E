// Chargement initial du XML et population de la liste
window.addEventListener('DOMContentLoaded', function () {
    // Charger le fichier XML des adversaires
    fetch('data/Adversaires2.xml')
        .then(response => response.text())
        .then(str => {
            const parser = new DOMParser();
            xmlDoc = parser.parseFromString(str, "text/xml");
            populateCreatureSelect();
        })
        .catch(error => {
            console.error('Erreur lors du chargement du fichier XML:', error);
            alert('Erreur lors du chargement du fichier XML');
        });

    // Charger le fichier XML des PJ
    fetch('data/PJ.xml')
        .then(response => response.text())
        .then(str => {
            const parser = new DOMParser();
            const pjDoc = parser.parseFromString(str, "text/xml");
            createPlayerTabs(pjDoc);
        })
        .catch(error => {
            console.error('Erreur lors du chargement des PJ:', error);
        });
});

function calculateInitiative() {
    // Retirer les anciennes pastilles d'initiative
    document.querySelectorAll('.initiative-badge').forEach(badge => badge.remove());

    const playerWrappers = Array.from(document.querySelectorAll('.player-wrapper'));
    if (playerWrappers.length === 0) return;

    // Enregistrer les positions initiales pour l'animation FLIP
    const firstPositions = new Map();
    playerWrappers.forEach(wrapper => {
        firstPositions.set(wrapper, wrapper.getBoundingClientRect());
    });

    const totalHeroes = playerWrappers.length;

    const getPosturePriority = (wrapper) => {
        const playerIndex = parseInt(wrapper.dataset.playerIndex);
        const postureValue = window.playerAdvantages ? (window.playerAdvantages.get(playerIndex) ?? 0) : 0;
        // Posture values: 1: AVANCE, 0: EXPOSE, 3: DEFENSIF, 2: ARRIERE
        switch (postureValue) {
            case 1: return 1; // AVANCE
            case 0: return 2; // EXPOSE
            case 3: return 3; // DEFENSIF
            case 2: return 4; // ARRIERE
            default: return 2;
        }
    };

    // Préparer les données des héros
    const heroData = playerWrappers.map((wrapper, domIndex) => {
        const wits = parseInt(wrapper.dataset.wits) || 0;
        const priority = getPosturePriority(wrapper);
        return { wrapper, wits, priority, domIndex };
    });

    // Trier les héros : 1) priorité de posture (croissant), 2) Esprit (décroissant), 3) ordre DOM (croissant)
    heroData.sort((a, b) => {
        if (a.priority !== b.priority) {
            return a.priority - b.priority;
        }
        if (b.wits !== a.wits) {
            return b.wits - a.wits;
        }
        return a.domIndex - b.domIndex;
    });

    // Réordonner les héros dans le DOM (du rang 1 à gauche vers les rangs supérieurs à droite)
    const playerTabsContainer = document.querySelector('.player-tabs');
    const actionsCol = playerTabsContainer ? playerTabsContainer.querySelector('.hero-actions-column') : null;

    heroData.forEach((hero) => {
        if (playerTabsContainer) {
            if (actionsCol && actionsCol.parentNode === playerTabsContainer) {
                playerTabsContainer.insertBefore(hero.wrapper, actionsCol);
            } else {
                playerTabsContainer.appendChild(hero.wrapper);
            }
        }
    });

    // Attribuer l'initiative aux héros et à leurs adversaires
    heroData.forEach((hero, sortedIndex) => {
        const heroRank = sortedIndex + 1;
        const playerTab = hero.wrapper.querySelector('.player-tab');
        if (playerTab) {
            const tabContent = playerTab.querySelector('.tab-content') || playerTab;
            const badge = document.createElement('span');
            badge.className = 'initiative-badge';
            badge.textContent = heroRank;
            tabContent.appendChild(badge);
        }

        // Calculer l'initiative des adversaires engagés
        const opponentTabs = hero.wrapper.querySelectorAll('.pj-opponents .creature-tab');
        const opponentRank = heroRank + totalHeroes;
        opponentTabs.forEach(creatureTab => {
            const tabContent = creatureTab.querySelector('.tab-content') || creatureTab;
            const badge = document.createElement('span');
            badge.className = 'initiative-badge';
            badge.textContent = opponentRank;
            tabContent.appendChild(badge);
        });
    });

    // Effet visuel de rotation rapide sur le bouton Reload
    const reloadBtn = document.querySelector('.reload-initiative-btn');
    if (reloadBtn) {
        reloadBtn.classList.add('spinning');
        setTimeout(() => reloadBtn.classList.remove('spinning'), 400);
    }

    // Animation FLIP : Déplacement fluide et rapide des colonnes de héros
    requestAnimationFrame(() => {
        heroData.forEach((hero) => {
            const wrapper = hero.wrapper;
            const firstPos = firstPositions.get(wrapper);
            if (!firstPos) return;

            const lastPos = wrapper.getBoundingClientRect();
            const deltaX = firstPos.left - lastPos.left;
            const deltaY = firstPos.top - lastPos.top;

            if (deltaX !== 0 || deltaY !== 0) {
                wrapper.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
                wrapper.style.transition = 'none';

                requestAnimationFrame(() => {
                    wrapper.offsetHeight; // Force reflow
                    wrapper.style.transition = 'transform 0.3s cubic-bezier(0.2, 0, 0, 1)';
                    wrapper.style.transform = '';
                });

                const onTransitionEnd = () => {
                    wrapper.style.transition = '';
                    wrapper.removeEventListener('transitionend', onTransitionEnd);
                };
                wrapper.addEventListener('transitionend', onTransitionEnd);
            }
        });
    });
}

function createPlayerTabs(pjDoc) {
    const players = pjDoc.getElementsByTagName('Player_Character');
    const tabsContainer = document.getElementById('creatureTabs');
    
    // Créer un conteneur principal incluant les colonnes de combat
    const combatSection = document.createElement('div');
    combatSection.className = 'combat-section';

    // Créer un conteneur spécifique pour les onglets PJ
    const playerTabsContainer = document.createElement('div');
    playerTabsContainer.className = 'player-tabs';
    combatSection.appendChild(playerTabsContainer);

    // --- LOGIQUE DRAG & DROP DU CONTENEUR ---
    playerTabsContainer.addEventListener('dragover', (e) => {
        e.preventDefault(); // Nécessaire pour autoriser le drop
        
        const draggingItem = playerTabsContainer.querySelector('.dragging');
        // Si on ne déplace pas un onglet joueur, on arrête
        if (!draggingItem) return;

        const siblings = [...playerTabsContainer.querySelectorAll('.player-wrapper:not(.dragging)')];

        // Trouver l'élément de référence pour l'insertion (le plus proche de la souris)
        const nextSibling = siblings.find(sibling => {
            const box = sibling.getBoundingClientRect();
            // On cherche l'élément dont le centre est après la souris
            return e.clientX <= box.left + box.width / 2;
        });

        // Déplacement visuel immédiat dans le DOM (en s'assurant de ne pas mettre après la colonne d'actions s'il y en a une)
        const actionsCol = playerTabsContainer.querySelector('.hero-actions-column');
        if (nextSibling) {
            playerTabsContainer.insertBefore(draggingItem, nextSibling);
        } else if (actionsCol && actionsCol.parentNode === playerTabsContainer) {
            playerTabsContainer.insertBefore(draggingItem, actionsCol);
        } else {
            playerTabsContainer.appendChild(draggingItem);
        }
    });
    // ----------------------------------------
    
    Array.from(players).forEach((player, index) => {
        const name = player.getElementsByTagName('Name')[0]?.textContent;
        const tokenName = player.getElementsByTagName('token')[0]?.textContent;
        const wits = player.getElementsByTagName('WITS')[0]?.textContent || '0';
        
        if (name) {
            const wrapper = document.createElement('div');
            wrapper.className = 'player-wrapper';
            wrapper.dataset.playerIndex = index;
            wrapper.dataset.playerName = name;
            wrapper.dataset.wits = wits;

            // --- ACTIVATION DRAG & DROP SUR LE WRAPPER ---
            wrapper.setAttribute('draggable', true);

            wrapper.addEventListener('dragstart', () => {
                wrapper.classList.add('dragging');
            });

            wrapper.addEventListener('dragend', () => {
                wrapper.classList.remove('dragging');
            });
            // -------------------------------------------

            const tabElement = document.createElement('div');
            tabElement.className = 'player-tab';
            tabElement.dataset.playerIndex = index;

            // Créer le conteneur pour le contenu de l'onglet
            const tabContent = document.createElement('div');
            tabContent.className = 'tab-content';

            // Si un token existe, créer une image
            if (tokenName) {
                const tokenImage = document.createElement('img');
                tokenImage.src = `images/PJ/${tokenName}.png`;
                tokenImage.alt = name;
                tokenImage.className = 'player-token';
                tabContent.appendChild(tokenImage);
            } else {
                // Sinon utiliser les initiales comme avant
                tabContent.textContent = name.substring(0, 2).toUpperCase();
            }

            tabElement.appendChild(tabContent);

            // --- 2. HÉRO PORTRAIT / TAB --- (wrapper.appendChild(tabElement) called later)

            // --- 3. POSTURE DE COMBAT / INDICATEUR MILIEU ---
            const advantageIndicator = document.createElement('div');
            advantageIndicator.className = 'advantage-indicator posture-advantage';
            const initialPosture = (window.playerAdvantages && window.playerAdvantages.has(index)) ? window.playerAdvantages.get(index) : 0;
            if (typeof updatePostureElementStyle === 'function') {
                updatePostureElementStyle(advantageIndicator, initialPosture);
            } else {
                advantageIndicator.textContent = 'EXPOSE';
                advantageIndicator.classList.add('posture-expose');
            }
            advantageIndicator.style.display = 'block';
            advantageIndicator.addEventListener('click', (e) => {
                e.stopPropagation();
                if (typeof cyclePlayerAdvantage === 'function') {
                    cyclePlayerAdvantage(index, advantageIndicator);
                }
            });

            // Créer le conteneur des adversaires associés
            const opponentsContainer = document.createElement('div');
            opponentsContainer.className = 'pj-opponents';

            // --- LOGIQUE DRAG & DROP POUR LES ADVERSAIRES ---
            opponentsContainer.addEventListener('dragover', (e) => {
                // On n'accepte le drop que si on déplace une créature
                const draggingCreature = document.querySelector('.dragging-creature');
                if (!draggingCreature) return;

                e.preventDefault();
                e.stopPropagation(); // Ne pas propager au playerTabsContainer

                // Logique d'insertion visuelle du placeholder
                const siblings = [...opponentsContainer.querySelectorAll('.creature-tab:not(.dragging-creature)')];
                const nextSibling = siblings.find(sibling => {
                    const box = sibling.getBoundingClientRect();
                    return e.clientY <= box.top + box.height / 2;
                });

                if (window.dragPlaceholder) {
                    if (nextSibling) {
                        opponentsContainer.insertBefore(window.dragPlaceholder, nextSibling);
                    } else {
                        opponentsContainer.appendChild(window.dragPlaceholder);
                    }
                }
            });

            opponentsContainer.addEventListener('drop', (e) => {
                const draggingCreature = document.querySelector('.dragging-creature');
                if (!draggingCreature) return;

                e.preventDefault();
                e.stopPropagation();

                const instanceId = parseInt(draggingCreature.dataset.instanceId);
                const newPlayerName = wrapper.dataset.playerName;

                // Check if it's already engaged by ANOTHER PJ.
                // It is engaged if its parent is a pj-opponents AND that parent is not THIS opponentsContainer
                const isEngagedElsewhere = draggingCreature.parentNode &&
                                           draggingCreature.parentNode.classList.contains('pj-opponents') &&
                                           draggingCreature.parentNode !== opponentsContainer;

                if (isEngagedElsewhere) {
                    // Create a virtual clone instead of moving the original
                    const clonedTab = draggingCreature.cloneNode(true);
                    clonedTab.classList.remove('dragging-creature');
                    clonedTab.classList.add('secondary');

                    // Reattach dragging logic to clone
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
                        const creatureInstance = window.creatureInstances ? window.creatureInstances.get(instanceId) : null;
                        if (creatureInstance && typeof displayCreatureDetails === 'function') {
                            displayCreatureDetails(creatureInstance, clonedTab.dataset.familyName);
                        }
                    });

                    if (window.dragPlaceholder && window.dragPlaceholder.parentNode === opponentsContainer) {
                        opponentsContainer.insertBefore(clonedTab, window.dragPlaceholder);
                        window.dragPlaceholder.remove();
                    } else {
                        opponentsContainer.appendChild(clonedTab);
                    }
                } else {
                    // Normal move
                    if (window.dragPlaceholder && window.dragPlaceholder.parentNode === opponentsContainer) {
                        opponentsContainer.insertBefore(draggingCreature, window.dragPlaceholder);
                        window.dragPlaceholder.remove();
                    } else {
                        opponentsContainer.appendChild(draggingCreature);
                    }
                }

                if (instanceId && newPlayerName && typeof associatePlayer === 'function') {
                    associatePlayer(instanceId, newPlayerName);
                }
            });
            // ------------------------------------------------

            // Ajouter le gestionnaire d'événements pour l'affichage du profil
            tabElement.addEventListener('click', function() {
                // Réinitialiser la sélection des créatures
                creatureSelect.value = '';
                
                // Retirer la classe active de tous les onglets
                document.querySelectorAll('.player-tab, .creature-tab').forEach(tab => 
                    tab.classList.remove('active')
                );
                
                // Ajouter la classe active à l'onglet cliqué
                this.classList.add('active');

                // Cloner et stocker l'instance du joueur
                const playerInstance = player.cloneNode(true);
                playerInstances.set(playerInstances.size, playerInstance);
                
                // Afficher le profil du joueur
                displayPlayerProfile(playerInstance);
            });
            
            wrapper.appendChild(tabElement);
            wrapper.appendChild(advantageIndicator);
            wrapper.appendChild(opponentsContainer);
            
            playerTabsContainer.appendChild(wrapper);
        }
    });
    
    // Créer le conteneur de la colonne des boutons d'actions héros/combat
    const actionsColumn = document.createElement('div');
    actionsColumn.className = 'hero-actions-column';

    // Emplacement pour le bouton reload (aligné avec la ligne des portraits héros)
    const slotReload = document.createElement('div');
    slotReload.className = 'action-slot slot-reload';

    const reloadBtn = document.createElement('button');
    reloadBtn.className = 'reload-initiative-btn action-icon-btn';
    reloadBtn.title = 'Calculer l\'initiative';
    const reloadImg = document.createElement('img');
    reloadImg.src = 'images/Reload.png';
    reloadImg.alt = 'Reload';
    reloadBtn.appendChild(reloadImg);
    reloadBtn.addEventListener('click', calculateInitiative);
    slotReload.appendChild(reloadBtn);
    actionsColumn.appendChild(slotReload);

    // Emplacement posture
    const slotPosture = document.createElement('div');
    slotPosture.className = 'action-slot slot-posture';
    actionsColumn.appendChild(slotPosture);

    // Emplacement pour les opposants (remplit le milieu)
    const slotOpponents = document.createElement('div');
    slotOpponents.className = 'action-slot slot-opponents';
    actionsColumn.appendChild(slotOpponents);

    // Emplacement pour le bouton random (aligné avec la ligne des modificateurs adversaires)
    const slotRandom = document.createElement('div');
    slotRandom.className = 'action-slot slot-random';

    const randomBtn = document.createElement('button');
    randomBtn.id = 'randomAssociationBtn';
    randomBtn.className = 'random-association-btn action-icon-btn';
    randomBtn.title = 'Association aléatoire';
    randomBtn.style.display = 'none'; // Masqué par défaut
    const randomImg = document.createElement('img');
    randomImg.src = 'images/Random.png';
    randomImg.alt = 'Random';
    randomBtn.appendChild(randomImg);
    randomBtn.addEventListener('click', performRandomAssociation);
    slotRandom.appendChild(randomBtn);
    actionsColumn.appendChild(slotRandom);

    playerTabsContainer.appendChild(actionsColumn);

    // Insérer les onglets PJ avec headers avant les onglets des créatures
    if (tabsContainer.firstChild) {
        tabsContainer.insertBefore(combatSection, tabsContainer.firstChild);
    } else {
        tabsContainer.appendChild(combatSection);
    }
    
    // Configurer le drag & drop pour le conteneur principal des créatures (zone "non associés")
    tabsContainer.addEventListener('dragover', (e) => {
        const draggingCreature = document.querySelector('.dragging-creature');
        if (!draggingCreature) return;

        e.preventDefault();
        // On autorise le drop ici (retour vers la zone non associée)
    });

    tabsContainer.addEventListener('drop', (e) => {
        const draggingCreature = document.querySelector('.dragging-creature');
        if (!draggingCreature) return;

        e.preventDefault();
        
        // Retirer le placeholder s'il existe
        if (window.dragPlaceholder && window.dragPlaceholder.parentNode) {
            window.dragPlaceholder.remove();
        }

        const instanceId = parseInt(draggingCreature.dataset.instanceId);

        // Retirer toutes les autres instances de cette créature dans le DOM
        const allTabs = document.querySelectorAll(`.creature-tab[data-instance-id="${instanceId}"]`);
        allTabs.forEach(tab => {
            if (tab !== draggingCreature) {
                tab.remove();
            }
        });

        // Nettoyer la classe secondary de l'élément déplacé si c'était un clone
        draggingCreature.classList.remove('secondary');

        // Ajouter la créature au conteneur principal (zone non assignée)
        tabsContainer.appendChild(draggingCreature);

        // Dissocier de tous les joueurs
        if (window.creaturePlayerAssociations && window.creaturePlayerAssociations.has(instanceId)) {
            window.creaturePlayerAssociations.get(instanceId).clear();
        }

        // Mettre à jour l'UI des associations
        if (typeof updateAssociatedPlayersList === 'function') {
            updateAssociatedPlayersList(instanceId);
        }

        // Mettre à jour la visibilité du bouton d'association aléatoire
        updateRandomAssociationButtonVisibility();
    });
}

/**
 * Récupère les onglets de créatures non engagées (directement dans #creatureTabs, pas dans .pj-opponents)
 */
function getUnassignedCreatureTabs() {
    const tabsContainer = document.getElementById('creatureTabs');
    if (!tabsContainer) return [];
    return Array.from(tabsContainer.querySelectorAll(':scope > .creature-tab'));
}

/**
 * Récupère la liste des héros éligibles (Endurance > 0) avec leur Endurance actuelle et leurs adversaires engagés
 */
function getEligibleHeroes() {
    const playerWrappers = Array.from(document.querySelectorAll('.player-wrapper'));
    const eligibleHeroes = [];

    playerWrappers.forEach((wrapper) => {
        const playerIndex = parseInt(wrapper.dataset.playerIndex);
        const name = wrapper.dataset.playerName;

        // Récupérer l'Endurance depuis l'instance XML ou l'input si ouvert
        let endurance = 0;
        const input = document.getElementById(`player-Endurance-${playerIndex}`);
        if (input) {
            endurance = parseInt(input.value) || 0;
        } else if (window.playerInstances && window.playerInstances.has(playerIndex)) {
            const instance = window.playerInstances.get(playerIndex);
            const val = instance.getElementsByTagName('Endurance')[0]?.textContent;
            endurance = parseInt(val) || 0;
        } else if (window.playerCharacters && window.playerCharacters[playerIndex]) {
            // Si l'instance n'est pas encore instanciée dans playerInstances, lire le XML d'origine
            // mais par défaut dans l'app, endurance est chargée
            endurance = 10; // valeur par défaut positive si introuvable
        }

        if (endurance > 0) {
            const opponentsContainer = wrapper.querySelector('.pj-opponents');
            eligibleHeroes.push({
                wrapper: wrapper,
                playerIndex: playerIndex,
                name: name,
                endurance: endurance,
                opponentsContainer: opponentsContainer
            });
        }
    });

    return eligibleHeroes;
}

/**
 * Met à jour la visibilité du bouton d'association aléatoire.
 * Affiché si au moins 1 créature non engagée existe ET au moins 1 héros avec Endurance > 0 existe.
 */
function updateRandomAssociationButtonVisibility() {
    const diceBtn = document.getElementById('randomAssociationBtn');
    if (!diceBtn) return;

    const unassignedTabs = getUnassignedCreatureTabs();
    const eligibleHeroes = getEligibleHeroes();

    if (unassignedTabs.length > 0 && eligibleHeroes.length > 0) {
        diceBtn.style.display = 'flex';
    } else {
        diceBtn.style.display = 'none';
    }
}
window.updateRandomAssociationButtonVisibility = updateRandomAssociationButtonVisibility;

/**
 * Effectue l'association aléatoire des adversaires non engagés aux héros selon les règles définies:
 * 1. Priorité aux héros ayant le moins d'adversaires associés.
 * 2. Si égalité du nombre d'adversaires, répartition sur les héros.
 * 3. S'il reste moins d'adversaires à répartir que de héros éligibles, attribution aux héros ayant le moins d'Endurance (> 0).
 *    En cas d'égalité d'Endurance, choix aléatoire parmi eux.
 */
function performRandomAssociation() {
    const unassignedTabs = getUnassignedCreatureTabs();
    let eligibleHeroes = getEligibleHeroes();

    if (unassignedTabs.length === 0 || eligibleHeroes.length === 0) {
        updateRandomAssociationButtonVisibility();
        return;
    }

    // Mélanger initialement la liste des créatures pour un tirage aléatoire
    const creaturesToAssign = [...unassignedTabs].sort(() => Math.random() - 0.5);

    while (creaturesToAssign.length > 0) {
        // Compter le nombre actuel d'adversaires pour chaque héros éligible
        const heroCounts = eligibleHeroes.map(hero => ({
            hero: hero,
            count: hero.opponentsContainer ? hero.opponentsContainer.querySelectorAll('.creature-tab').length : 0
        }));

        // Trouver le nombre minimum d'adversaires parmi les héros
        const minCount = Math.min(...heroCounts.map(h => h.count));

        // Filtrer les héros qui ont le moins d'adversaires associés
        const minCountHeroes = heroCounts.filter(h => h.count === minCount).map(h => h.hero);

        let chosenHero = null;

        if (creaturesToAssign.length >= minCountHeroes.length) {
            // S'il y a assez d'adversaires pour en donner au moins un à chacun des héros ayant le minCount,
            // on tire au sort parmi minCountHeroes
            chosenHero = minCountHeroes[Math.floor(Math.random() * minCountHeroes.length)];
        } else {
            // S'il reste moins d'adversaires que de héros dans minCountHeroes,
            // on choisit parmi minCountHeroes ceux qui ont le moins d'Endurance (> 0)
            const minEndurance = Math.min(...minCountHeroes.map(h => h.endurance));
            const lowestEnduranceHeroes = minCountHeroes.filter(h => h.endurance === minEndurance);

            // Tirage aléatoire en cas d'égalité d'Endurance
            chosenHero = lowestEnduranceHeroes[Math.floor(Math.random() * lowestEnduranceHeroes.length)];
        }

        if (chosenHero && creaturesToAssign.length > 0) {
            const creatureTab = creaturesToAssign.shift();
            const instanceId = parseInt(creatureTab.dataset.instanceId);

            // Déplacer l'élément DOM dans le pj-opponents du héros
            chosenHero.opponentsContainer.appendChild(creatureTab);

            // Mettre à jour la structure de données des associations
            if (instanceId && chosenHero.name && typeof associatePlayer === 'function') {
                associatePlayer(instanceId, chosenHero.name);
            }
        }
    }

    // Mettre à jour l'affichage de l'association si une fiche créature est ouverte
    const activeTab = document.querySelector('.creature-tab.active');
    if (activeTab && typeof updateAssociatedPlayersList === 'function') {
        updateAssociatedPlayersList(parseInt(activeTab.dataset.instanceId));
    }

    // Recalculer la visibilité du bouton
    updateRandomAssociationButtonVisibility();
}
window.performRandomAssociation = performRandomAssociation;