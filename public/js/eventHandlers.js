// Sélection des éléments DOM
const cardModal = document.getElementById('cardModal');
const cardContent = document.getElementById('cardContent');
const addButton = document.getElementById('addCreature');

// Variables pour stocker la sélection courante
let selectedCreature = null;
let selectedFamily = null;


// Le gestionnaire pour addButton est supprimé car le bouton est caché

// Fonction pour fermer la fenêtre modale des cartes
function closeCardModal() {
    cardModal.style.display = 'none';
}

function triggerEyeEvent() {
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
            
            const modalContent = document.getElementById('cardContent');
            const modal = document.getElementById('cardModal');
            if (modalContent && modal) {
                modalContent.innerHTML = html;
                modalContent.className = 'disadvantage';
                modal.style.display = 'block';
            }
        })
        .catch(error => console.error('Erreur lors du chargement des événements:', error));
}

function triggerRuneEvent() {
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
            
            const modalContent = document.getElementById('cardContent');
            const modal = document.getElementById('cardModal');
            if (modalContent && modal) {
                modalContent.innerHTML = html;
                modalContent.className = 'advantage';
                modal.style.display = 'block';
            }
        })
        .catch(error => console.error('Erreur lors du chargement des événements:', error));
}

window.triggerEyeEvent = triggerEyeEvent;
window.triggerRuneEvent = triggerRuneEvent;

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