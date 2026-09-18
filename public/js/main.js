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
}

function createPlayerTabs(pjDoc) {
    const players = pjDoc.getElementsByTagName('Player_Character');
    const tabsContainer = document.getElementById('creatureTabs');
    
    // Créer un conteneur principal incluant les titres de section et les colonnes
    const combatSection = document.createElement('div');
    combatSection.className = 'combat-section';

    const topHeader = document.createElement('div');
    topHeader.className = 'combat-section-header top-header';
    topHeader.textContent = 'Avantages de combat - héros';
    combatSection.appendChild(topHeader);

    // Créer un conteneur spécifique pour les onglets PJ
    const playerTabsContainer = document.createElement('div');
    playerTabsContainer.className = 'player-tabs';
    combatSection.appendChild(playerTabsContainer);

    const bottomHeader = document.createElement('div');
    bottomHeader.className = 'combat-section-header bottom-header';
    bottomHeader.textContent = 'Avantages de combat - adversaires';
    combatSection.appendChild(bottomHeader);

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

        // Déplacement visuel immédiat dans le DOM (en s'assurant de ne pas mettre après le bouton reload s'il est là)
        if (nextSibling) {
            playerTabsContainer.insertBefore(draggingItem, nextSibling);
        } else if (reloadBtn && reloadBtn.parentNode === playerTabsContainer) {
            playerTabsContainer.insertBefore(draggingItem, reloadBtn);
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
            
            // --- 1. ZONE AVANTAGE COMBAT HÉROS (HAUT) ---
            const heroTopAdvantage = document.createElement('div');
            heroTopAdvantage.className = 'advantage-indicator hero-top-advantage';
            heroTopAdvantage.textContent = '0';
            heroTopAdvantage.addEventListener('click', (e) => {
                e.stopPropagation();
                if (typeof cycleHeroTopAdvantage === 'function') {
                    cycleHeroTopAdvantage(index, heroTopAdvantage);
                }
            });
            wrapper.appendChild(heroTopAdvantage);

            // Créer le bouton "Repoussé"
            const repousseBtn = document.createElement('button');
            repousseBtn.className = 'repousse-btn';
            repousseBtn.textContent = 'Repoussé';
            repousseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.target.classList.toggle('active');
            });
            wrapper.appendChild(repousseBtn);

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

            // --- 4. ZONE AVANTAGE COMBAT ADVERSAIRES (BAS) ---
            const heroBottomAdvantage = document.createElement('div');
            heroBottomAdvantage.className = 'advantage-indicator hero-bottom-advantage';
            heroBottomAdvantage.textContent = '0';
            heroBottomAdvantage.addEventListener('click', (e) => {
                e.stopPropagation();
                if (typeof cycleHeroBottomAdvantage === 'function') {
                    cycleHeroBottomAdvantage(index, heroBottomAdvantage);
                }
            });
            wrapper.appendChild(heroBottomAdvantage);
            
            playerTabsContainer.appendChild(wrapper);
        }
    });
    
    // Créer le bouton "reload" d'initiative à droite des héros
    const reloadBtn = document.createElement('button');
    reloadBtn.className = 'reload-initiative-btn';
    reloadBtn.title = 'Calculer l\'initiative';
    reloadBtn.textContent = '↻';
    reloadBtn.addEventListener('click', calculateInitiative);
    playerTabsContainer.appendChild(reloadBtn);

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
    });
}