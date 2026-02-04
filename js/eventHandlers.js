// Sélection des éléments DOM
const eyeButton = document.getElementById('eyeButton');
const runeButton = document.getElementById('runeButton');
const cardModal = document.getElementById('cardModal');
const cardContent = document.getElementById('cardContent');
const addButton = document.getElementById('addCreature');

// Variables pour stocker la sélection courante
let selectedCreature = null;
let selectedFamily = null;

// Gestionnaire pour la sélection des créatures
creatureSelect.addEventListener('change', function() {
    if (this.value === "change_list") {
        openFileModal();
        this.value = "";
        return;
    }

    if (this.value) {
        addButton.disabled = false;
        try {
            const selectedValue = JSON.parse(this.value);
            const famille = Array.from(xmlDoc.getElementsByTagName('famille'))
                .find(f => f.getAttribute('nom') === selectedValue.family);

            if (famille) {
                const creature = Array.from(famille.getElementsByTagName('creature'))
                    .find(c => c.getElementsByTagName('nom')[0].textContent === selectedValue.creature);

                if (creature) {
                    selectedCreature = creature;
                    selectedFamily = selectedValue.family;
                }
            }
        } catch (error) {
            console.error('Erreur lors de la sélection de la créature:', error);
        }
    } else {
        addButton.disabled = true;
        selectedCreature = null;
        selectedFamily = null;
    }
});

// Gestionnaire pour l'ajout de créatures
addButton.addEventListener('click', function() {
    if (selectedCreature && selectedFamily) {
        displayCreature(selectedCreature, selectedFamily);
    }
});

// Fonction pour fermer la fenêtre modale des cartes
function closeCardModal() {
    cardModal.style.display = 'none';
}

// Gestionnaire pour le bouton Eye (Désavantages)
eyeButton.addEventListener('click', function() {
    fetch('data/evenements.xml')
        .then(response => response.text())
        .then(str => {
            const parser = new DOMParser();
            const eventsDoc = parser.parseFromString(str, "text/xml");
            
            const disadvantageCards = eventsDoc.querySelector('categorie[nom="Désavantages"]').getElementsByTagName('carte');
            const randomCard = disadvantageCards[Math.floor(Math.random() * disadvantageCards.length)];
            
            let html = `
                <h3>${randomCard.getAttribute('nom')}</h3>
                <div class="description">${randomCard.getElementsByTagName('description')[0]?.textContent || ''}</div>`;

            const competence = randomCard.querySelector('test competence');
            if (competence) {
                html += `<div class="test-info">Compétence à tester : ${competence.textContent}</div>`;
            }

            const resultats = randomCard.getElementsByTagName('resultats')[0];
            if (resultats) {
                const echec = resultats.querySelector('echec effet');
                if (echec) {
                    html += `<div class="result-info">Echec : ${echec.textContent}</div>`;
                }

                const reussiteSuperieure = resultats.querySelector('reussiteSuperieure effet');
                if (reussiteSuperieure) {
                    html += `<div class="result-info">Réussite supérieure : ${reussiteSuperieure.textContent}</div>`;
                }
            }
            
            cardContent.innerHTML = html;
            cardContent.className = 'disadvantage';
            cardModal.style.display = 'block';
        })
        .catch(error => console.error('Erreur lors du chargement des événements:', error));
});

// Gestionnaire pour le bouton Rune (Avantages)
runeButton.addEventListener('click', function() {
    fetch('data/evenements.xml')
        .then(response => response.text())
        .then(str => {
            const parser = new DOMParser();
            const eventsDoc = parser.parseFromString(str, "text/xml");
            
            const advantageCards = eventsDoc.querySelector('categorie[nom="Avantages"]').getElementsByTagName('carte');
            const randomCard = advantageCards[Math.floor(Math.random() * advantageCards.length)];
            
            let html = `
                <h3>${randomCard.getAttribute('nom')}</h3>
                <div class="description">${randomCard.getElementsByTagName('description')[0]?.textContent || ''}</div>`;
            
            const conditions = randomCard.getElementsByTagName('conditions')[0];
            if (conditions) {
                html += '<div class="conditions">';
                Array.from(conditions.getElementsByTagName('condition')).forEach(condition => {
                    html += `<div>• ${condition.textContent}</div>`;
                });
                html += '</div>';
            }
            
            cardContent.innerHTML = html;
            cardContent.className = 'advantage';
            cardModal.style.display = 'block';
        })
        .catch(error => console.error('Erreur lors du chargement des événements:', error));
});

// Fermer la fenêtre modale si on clique en dehors
window.addEventListener('click', (e) => {
    if (e.target === cardModal) {
        closeCardModal();
    }
});

// Gestionnaires pour les détails et l'image
function toggleDetails(element) {
    element.classList.toggle('open');
}

function toggleSpecialDetails(element) {
    const details = element.nextElementSibling;
    details.style.display = details.style.display === 'block' ? 'none' : 'block';
}

function showImage(url) {
    if (url) {
        creatureImage.src = url;
        fullScreenImage.style.display = 'flex';
    }
}

fullScreenImage.addEventListener('click', function() {
    this.style.display = 'none';
});