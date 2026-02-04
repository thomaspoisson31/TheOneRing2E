:root {
    --primary-color: #2c3e50;
    --secondary-color: #34495e;
    --text-color: #ecf0f1;
    --accent-color: #e74c3c;
    --title-color: #b30f04;
}

body {
    font-family: Arial, sans-serif;
    line-height: 1.4;
    color: var(--primary-color);
    max-width: 800px;
    margin: 0 auto;
    padding: 0.5rem;
    background: #f5f6fa;
    font-size: 14px;
}

header {
    text-align: center;
    margin-bottom: 0.75rem;
}

/* Mise à jour du conteneur selector pour inclure l'icône */
.selector {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    margin-bottom: 1rem;
} 

.add-button {
    background-color: var(--title-color);
    color: white;
    width: 30px;
    height: 30px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1.2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s;
}

.add-button:hover {
    background-color: #8b0000;
}

.add-button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
}

/* Ajout des styles pour le conteneur des boutons */
.button-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
}

.left-buttons {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

.right-buttons {
    display: flex;
    gap: 0.5rem;
}

.icon-button {
    background-color: #e2e8f0;
    border: none;
    border-radius: 4px;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background-color 0.2s;
}

.icon-button:hover {
    background-color: #cbd5e1;
}

.icon-button img {
    width: 20px;
    height: 20px;
}

.creature-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
}

.creature-tab {
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 0.5rem 1rem;
    cursor: pointer;
    transition: all 0.2s;
}

.creature-tab:hover {
    background: #f8f9fa;
}

.creature-tab.active {
    background: var(--title-color);
    color: white;
    border-color: var(--title-color);
}

.creature-card {
    background: white;
    border-radius: 4px;
    padding: 0.75rem;
    margin-bottom: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    display: none;
}

.creature-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
}


.creature-name {
    font-family: Georgia, serif;
    font-weight: bold;
    font-size: 1.5rem;
    color: var(--title-color);
    margin-bottom: 0.5rem;
    cursor: pointer;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(2, auto);
    gap: 0.25rem;
    margin-bottom: 0.5rem;
}

.stats-grid > div {
    display: flex;
    align-items: center;
    white-space: nowrap;
    gap: 0.25rem;
}

/* Première ligne */
.stats-grid > div:nth-child(1) { grid-column: 1; grid-row: 1; }
.stats-grid > div:nth-child(3) { grid-column: 2; grid-row: 1; }
.stats-grid > div:nth-child(5) { grid-column: 3; grid-row: 1; }

/* Deuxième ligne */
.stats-grid > div:nth-child(2) { grid-column: 1 / span 2; grid-row: 2; }
.stats-grid > div:nth-child(4) { grid-column: 2 / span 2; grid-row: 2; }

@media (max-width: 768px) {
    .stats-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    
    .stats-grid > div:nth-child(2),
    .stats-grid > div:nth-child(4) {
        grid-column: auto;
        justify-content: flex-start;
    }
}

.details-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1rem;
}

.combat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
}

.combat-header h3 {
    margin: 0;
}

.puissance-badge {
    background-color: var(--title-color);
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-weight: bold;
    font-size: 0.9rem;
}

.combat-skills, .capacites {
    background: #f8f9fa;
    border-radius: 4px;
    padding: 0.5rem;
}

.combat-header h3,
.capacites h3 {
    font-size: 1rem;
}

.combat-skills li {
    background: #ecf0f1;
    border-radius: 5px;
    padding: 0.5rem;
    margin-bottom: 0.5rem;
    font-size: 0.8rem; /* Réduction de la taille du texte */
}

.weapon-name {
    font-weight: bold;
    font-size: 0.8rem; /* Réduction de la taille du nom d'arme */
}

.weapon-value {
    font-weight: bold;
    font-size: 0.9rem; /* Légère réduction de la valeur d'arme */
    color: var(--title-color);
}

.weapon-special {
    font-style: italic;
    cursor: pointer;
    color: var(--primary-color);
    font-size: 0.8rem; /* Réduction de la taille du texte spécial */
}

.weapon-special-details {
    display: none;
    font-size: 0.8rem; /* Réduction de la taille des détails */
    color: var(--secondary-color);
    padding: 0.5rem;
    margin-top: 0.25rem;
    background: #f8f9fa;
    border-radius: 4px;
}

.capacite-item {
    cursor: pointer;
    margin-bottom: 0.5rem;
    padding: 0.5rem;
    background: #ecf0f1;
    border-radius: 5px;
    font-size: 0.8rem; /* Réduction de la taille du texte des capacités */
}

.capacite-item .details {
    display: none;
    padding-top: 0.5rem;
    font-size: 0.8rem; /* Réduction de la taille des détails des capacités */
    color: #2c3e50;
}

.capacite-item.open .details {
    display: block;
}


.full-screen-image {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.9);
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.full-screen-image img {
    max-width: 90%;
    max-height: 90%;
    object-fit: contain;
}

select {
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    min-width: 200px;
}

h3 {
    color: var(--title-color);
    margin: 0;  /* Supprime toutes les marges des titres h3 */
}

ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

li {
    margin-bottom: 0.5rem;
}

/* Styles pour les inputs de statistiques */

.stat-input {
    background: transparent;
    border: none;
    -moz-appearance: textfield;
}

.stat-input::-webkit-inner-spin-button,
.stat-input::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
}


.stat-input:focus {
    outline: none;
}


/* Style pour chaque statistique en losange */
.stat-diamond {
    position: relative;
    width: 80px;
    height: 80px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.stats-grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-around;
    gap: 2rem;
    margin: 2rem 0;
    padding: 0 1rem;
}


.stat-diamond {
    position: relative;
    width: 70px;
    height: 70px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.stat-diamond img {
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 1;
}


.stat-label {
    position: absolute;
    top: -20px;
    color: var(--title-color);
    font-size: 0.8rem;
    font-weight: bold;
    text-transform: uppercase;
    white-space: nowrap;
}


.stat-value {
    position: relative;
    z-index: 2;
    color: var(--title-color);
    font-size: 1.8rem;
    font-weight: bold;
    text-align: center;
    width: 45px;
    height: 45px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0;
    padding: 0;
    line-height: 1;
}

.stat-input {
    position: relative;
    z-index: 2;
    color: #00000;
    font-size: 1.8rem;
    font-weight: bold;
    text-align: center;
    width: 45px;
    height: 45px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0;
    padding: 0;
    line-height: 1;
}


.sound-icon {
    width: 24px;
    height: 24px;
    cursor: pointer;
    transition: opacity 0.2s;
    vertical-align: middle;
}

.sound-icon:hover {
    opacity: 0.8;
}

/* Supprimer l'icône de son de la barre de sélection */
.selector .sound-icon {
    display: none !important;
}

.sound-message {
    margin-top: 0.5rem;
    padding: 0.5rem;
    background-color: #f8f9fa;
    border-radius: 4px;
    font-size: 0.9rem;
    color: var(--primary-color);
}

.sound-files {
    font-size: 0.8rem;
    color: var(--secondary-color);
    margin-top: 0.5rem;
    padding: 0.5rem;
    background: #f8f9fa;
    border-radius: 4px;
    border: 1px solid #ddd;
}

.sound-link {
    color: var(--primary-color);
    text-decoration: none;
    display: block;
    padding: 0.25rem 0;
}

.sound-link:hover {
    color: var(--accent-color);
    text-decoration: underline;
}


/* Styles pour le conteneur des statistiques  -- temporairement désactivé
.stats-grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
    align-items: center;
} */


/* Responsive design */

/* Ajustements pour mobile */

@media (max-width: 600px) {
    .stats-grid {
        gap: 2.5rem 1rem;
    }
    
    .stat-diamond {
        width: 60px;
        height: 60px;
    }
    
    .stat-value, .stat-input {
        font-size: 1.5rem;
        width: 40px;
        height: 40px;
    }
    
    .stat-label {
        font-size: 0.7rem;
    }
}

