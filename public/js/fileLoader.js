// Gestionnaire pour la sélection des fichiers
function initFileLoader() {
    const fileList = document.getElementById('fileList');
    if (fileList) {
        fileList.addEventListener('click', (e) => {
            if (e.target.tagName === 'LI') {
                // Retirer la sélection précédente
                const items = fileList.getElementsByTagName('li');
                for (let item of items) {
                    item.classList.remove('selected');
                }
                
                // Ajouter la sélection au fichier cliqué
                e.target.classList.add('selected');
            }
        });
    }
}

// Fermer la fenêtre modale
function closeFileModal() {
    const fileModal = document.getElementById('fileModal');
    if (fileModal) {
        fileModal.style.display = 'none';
    }
}

// Ouvrir la fenêtre modale
function openFileModal() {
    const fileModal = document.getElementById('fileModal');
    if (fileModal) {
        fileModal.style.display = 'block';
    }
}

// Charger le fichier sélectionné
function loadSelectedFile() {
    const fileList = document.getElementById('fileList');
    const selectedFile = fileList?.querySelector('.selected');
    if (selectedFile) {
        const fileName = selectedFile.dataset.file;
        
        // Sauvegarder les onglets PJ existants
        const playerTabs = document.querySelector('.player-tabs');
        
        // Charger le nouveau fichier XML
        fetch(`data/${fileName}`)
            .then(response => response.text())
            .then(str => {
                const parser = new DOMParser();
                xmlDoc = parser.parseFromString(str, "text/xml");
                
                // Réinitialiser l'interface
                creatureSelect.value = '';
                creatureCard.style.display = 'none';
                creatureTabs.innerHTML = '';
                
                // Restaurer les onglets PJ s'ils existaient
                if (playerTabs) {
                    creatureTabs.appendChild(playerTabs);
                }
                
                // Mettre à jour la liste des créatures
                populateCreatureSelect();
                
                // Fermer la fenêtre modale
                closeFileModal();
            })
            .catch(error => {
                console.error('Erreur lors du chargement du fichier XML:', error);
                alert('Erreur lors du chargement du fichier XML');
            });
    }
}

// Fermer la fenêtre modale si on clique en dehors
window.addEventListener('click', (e) => {
    const fileModal = document.getElementById('fileModal');
    if (e.target === fileModal) {
        closeFileModal();
    }
});

// Initialiser le gestionnaire d'événements au chargement de la page
window.addEventListener('DOMContentLoaded', initFileLoader);