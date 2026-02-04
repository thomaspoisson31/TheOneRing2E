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

function createPlayerTabs(pjDoc) {
    const players = pjDoc.getElementsByTagName('Player_Character');
    const tabsContainer = document.getElementById('creatureTabs');
    
    // Créer un conteneur spécifique pour les onglets PJ
    const playerTabsContainer = document.createElement('div');
    playerTabsContainer.className = 'player-tabs';

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

        // Déplacement visuel immédiat dans le DOM
        if (nextSibling) {
            playerTabsContainer.insertBefore(draggingItem, nextSibling);
        } else {
            playerTabsContainer.appendChild(draggingItem);
        }
    });
    // ----------------------------------------
    
    Array.from(players).forEach((player, index) => {
        const name = player.getElementsByTagName('Name')[0]?.textContent;
        const tokenName = player.getElementsByTagName('token')[0]?.textContent;
        
        if (name) {
            const wrapper = document.createElement('div');
            wrapper.className = 'player-wrapper';
            wrapper.dataset.playerIndex = index;
            wrapper.dataset.playerName = name;

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

                // Remplacer le placeholder par l'élément déplacé
                if (window.dragPlaceholder && window.dragPlaceholder.parentNode === opponentsContainer) {
                    opponentsContainer.insertBefore(draggingCreature, window.dragPlaceholder);
                    window.dragPlaceholder.remove();
                } else {
                    opponentsContainer.appendChild(draggingCreature);
                }

                // Mise à jour des associations
                const instanceId = parseInt(draggingCreature.dataset.instanceId);
                const newPlayerName = wrapper.dataset.playerName;

                if (instanceId && newPlayerName) {
                    // Mettre à jour l'association
                    // Note: associatePlayer est dans creatureDisplay.js
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

                // Afficher le sélecteur de créature
                document.querySelector('.creature-selector').classList.add('visible');
                
                // Cloner et stocker l'instance du joueur
                const playerInstance = player.cloneNode(true);
                playerInstances.set(playerInstances.size, playerInstance);
                
                // Afficher le profil du joueur
                displayPlayerProfile(playerInstance);
            });
            
            wrapper.appendChild(tabElement);
            wrapper.appendChild(opponentsContainer);
            
            playerTabsContainer.appendChild(wrapper);
        }
    });
    
    // Insérer les onglets PJ avant les onglets des créatures
    if (tabsContainer.firstChild) {
        tabsContainer.insertBefore(playerTabsContainer, tabsContainer.firstChild);
    } else {
        tabsContainer.appendChild(playerTabsContainer);
    }
}