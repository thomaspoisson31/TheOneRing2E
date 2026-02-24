function populateCreatureSelect() {
    // Initialisation des listes
    familySelect.innerHTML = '<option value="">Choix Famille</option>';
    creatureSelect.innerHTML = '<option value="">Choix Adversaire</option>';
    
    // Ajouter l'option "Changer de liste" dans le sélecteur de famille
    const changeListOption = document.createElement('option');
    changeListOption.value = "change_list";
    changeListOption.textContent = "*** Changer de liste ***";
    familySelect.appendChild(changeListOption);
    
    if (!xmlDoc) return;

    // Récupérer et trier les familles
    const familles = Array.from(xmlDoc.getElementsByTagName('famille'));
    familles.sort((a, b) => a.getAttribute('nom').localeCompare(b.getAttribute('nom')));
    
    for (let famille of familles) {
        const option = document.createElement('option');
        const familyName = famille.getAttribute('nom');
        const displayName = familyName.replace('_', ' ');
        option.value = familyName;
        option.textContent = displayName;
        familySelect.appendChild(option);
    }
}

function updateCreatureList(familyName) {
    creatureSelect.innerHTML = '<option value="">Choix Adversaire</option>';

    if (!familyName || familyName === "change_list" || !xmlDoc) return;

    // Trouver la famille sélectionnée
    const familles = Array.from(xmlDoc.getElementsByTagName('famille'));
    const selectedFamily = familles.find(f => f.getAttribute('nom') === familyName);

    if (selectedFamily) {
        // Récupérer et trier les créatures de cette famille
        const creatures = Array.from(selectedFamily.getElementsByTagName('creature'));
        creatures.sort((a, b) => {
            const nameA = a.getElementsByTagName('nom')[0]?.textContent || "";
            const nameB = b.getElementsByTagName('nom')[0]?.textContent || "";
            return nameA.localeCompare(nameB);
        });

        // Ajouter les créatures triées
        for (let creature of creatures) {
            const creatureNameElement = creature.getElementsByTagName('nom')[0];
            if (creatureNameElement) {
                const creatureName = creatureNameElement.textContent;
                const option = document.createElement('option');
                option.value = JSON.stringify({
                    family: familyName,
                    creature: creatureName
                });
                option.textContent = creatureName;
                creatureSelect.appendChild(option);
            }
        }
    }
}
