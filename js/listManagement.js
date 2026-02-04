function populateCreatureSelect() {
    creatureSelect.innerHTML = '<option value="">Choix Adversaire</option>';
    
    // Ajouter l'option "Changer de liste"
    const changeListOption = document.createElement('option');
    changeListOption.value = "change_list";
    changeListOption.textContent = "*** Changer de liste ***";
    creatureSelect.appendChild(changeListOption);
    
    // Récupérer et trier les familles
    const familles = Array.from(xmlDoc.getElementsByTagName('famille'));
    familles.sort((a, b) => a.getAttribute('nom').localeCompare(b.getAttribute('nom')));
    
    for (let famille of familles) {
        // Ajout de l'option de famille
        const familyOption = document.createElement('option');
        const familyName = famille.getAttribute('nom').replace('_', ' ');
        familyOption.textContent = `---- ${familyName} ----`;
        familyOption.disabled = true;
        creatureSelect.appendChild(familyOption);

        // Récupérer et trier les créatures de cette famille
        const creatures = Array.from(famille.getElementsByTagName('creature'));
        creatures.sort((a, b) => {
            const nameA = a.getElementsByTagName('nom')[0].textContent;
            const nameB = b.getElementsByTagName('nom')[0].textContent;
            return nameA.localeCompare(nameB);
        });

        // Ajouter les créatures triées
        for (let creature of creatures) {
            const option = document.createElement('option');
            const creatureName = creature.getElementsByTagName('nom')[0].textContent;
            option.value = JSON.stringify({
                family: famille.getAttribute('nom'),
                creature: creatureName
            });
            option.textContent = creatureName;
            creatureSelect.appendChild(option);
        }
    }
}