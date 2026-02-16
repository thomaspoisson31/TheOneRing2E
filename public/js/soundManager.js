// État du gestionnaire de son
let currentAudio = null;
let isPlaying = false;
let repeatTimeout = null;

// Vérifie si une famille a des sons disponibles
function hasSounds(familyName) {
    const famille = Array.from(xmlDoc.getElementsByTagName('famille'))
        .find(f => f.getAttribute('nom') === familyName);
    
    if (!famille) return false;
    
    return Array.from(famille.children)
        .some(child => child.tagName.startsWith('son'));
}

// Récupère tous les sons disponibles pour une famille
function getSoundFiles(familyName) {
    const famille = Array.from(xmlDoc.getElementsByTagName('famille'))
        .find(f => f.getAttribute('nom') === familyName);
    
    if (!famille) return [];
    
    return Array.from(famille.children)
        .filter(child => child.tagName.startsWith('son'))
        .map(sound => sound.textContent)
        .filter(Boolean);
}

// Arrête la lecture en cours
function stopSound() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }
    if (repeatTimeout) {
        clearTimeout(repeatTimeout);
        repeatTimeout = null;
    }
    isPlaying = false;
    updateSoundIconStyle(false);
}

// Met à jour le style de l'icône sonore
function updateSoundIconStyle(playing) {
    const soundIcon = document.getElementById('soundIcon');
    if (playing) {
        soundIcon.style.border = '2px solid red';
    } else {
        soundIcon.style.border = 'none';
    }
}

// Joue un son en boucle avec délai
function playSound(audioFile) {
    if (isPlaying) {
        stopSound();
        return;
    }

    currentAudio = new Audio(`sounds/${audioFile}`);
    
    currentAudio.addEventListener('ended', () => {
        repeatTimeout = setTimeout(() => {
            if (isPlaying) {
                currentAudio.play();
            }
        }, 5000); // 5 secondes de délai
    });

    currentAudio.play();
    isPlaying = true;
    updateSoundIconStyle(true);
}

// Joue un son aléatoire de la famille
function playRandomSound(familyName) {
    const sounds = getSoundFiles(familyName);
    if (sounds.length === 0) return;
    
    const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
    playSound(randomSound);
}

// Met à jour la visibilité de l'icône sonore
function updateSoundIconVisibility(familyName) {
    const soundIcon = document.getElementById('soundIcon');
    
    if (hasSounds(familyName)) {
        soundIcon.style.display = 'block';
        soundIcon.onclick = () => {
            if (isPlaying) {
                stopSound();
            } else {
                playRandomSound(familyName);
            }
        };
    } else {
        soundIcon.style.display = 'none';
        soundIcon.onclick = null;
        stopSound();
    }
}