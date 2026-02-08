/**
 * Gestionnaire de Drag & Drop tactile pour mobile
 * Simule les événements HTML5 Drag & Drop à partir des événements Touch
 */

class TouchDragManager {
    constructor() {
        this.dragSource = null;
        this.dragGhost = null;
        this.isDragging = false;
        this.longPressTimer = null;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.lastTouchX = 0;
        this.lastTouchY = 0;

        // Stockage des données transférées pendant le drag (pour simuler dataTransfer)
        this.dataTransferStore = {};

        // Configuration
        this.longPressDuration = 300; // ms avant de déclencher le drag
        this.moveThreshold = 10; // pixels de mouvement tolérés avant d'annuler le long press

        this.init();
    }

    init() {
        // Écouteurs globaux pour intercepter les interactions sur les éléments draggable
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this));
        document.addEventListener('touchcancel', this.handleTouchEnd.bind(this));
        document.addEventListener('contextmenu', this.handleContextMenu.bind(this));
    }

    // Trouve l'élément draggable parent le plus proche
    getDraggableParent(element) {
        let current = element;
        while (current && current !== document.body) {
            if (current.getAttribute('draggable') === 'true') {
                return current;
            }
            current = current.parentElement;
        }
        return null;
    }

    handleTouchStart(e) {
        // Si déjà en train de drag, on ignore (multi-touch)
        if (this.isDragging) return;

        const touch = e.touches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        const draggable = this.getDraggableParent(target);

        if (!draggable) return;

        // On vérifie si c'est bien une créature ou un joueur (cibles du drag & drop)
        if (!draggable.classList.contains('creature-tab') && !draggable.classList.contains('player-wrapper')) {
            return;
        }

        this.dragSource = draggable;
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        this.lastTouchX = touch.clientX;
        this.lastTouchY = touch.clientY;

        // Démarrer le timer pour détecter l'appui long
        this.longPressTimer = setTimeout(() => {
            this.startDrag(touch);
        }, this.longPressDuration);
    }

    handleTouchMove(e) {
        const touch = e.touches[0];
        this.lastTouchX = touch.clientX;
        this.lastTouchY = touch.clientY;

        if (this.isDragging) {
            // Si on drag, on empêche le scroll
            if (e.cancelable) e.preventDefault();

            // Mettre à jour la position du fantôme
            this.updateGhostPosition(touch.clientX, touch.clientY);

            // Simuler dragover sur l'élément sous le doigt
            const target = document.elementFromPoint(touch.clientX, touch.clientY);
            if (target) {
                this.fireSyntheticEvent('dragover', target, touch.clientX, touch.clientY);
            }
        } else if (this.longPressTimer) {
            // Si on bouge trop pendant l'attente du long press, on annule (c'est un scroll)
            const dx = Math.abs(touch.clientX - this.touchStartX);
            const dy = Math.abs(touch.clientY - this.touchStartY);

            if (dx > this.moveThreshold || dy > this.moveThreshold) {
                clearTimeout(this.longPressTimer);
                this.longPressTimer = null;
                this.dragSource = null;
            }
        }
    }

    handleTouchEnd(e) {
        // Annuler le timer si on relâche avant la fin du long press
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }

        if (this.isDragging) {
            // Terminer le drag
            this.endDrag(e);
        }

        // Réinitialisation partielle (dragSource est nullifié dans endDrag ou ici si pas de drag)
        if (!this.isDragging) {
            this.dragSource = null;
        }
    }

    handleContextMenu(e) {
        // Si on est en train de drag ou qu'on vient de déclencher le drag, on empêche le menu contextuel
        if (this.isDragging || (this.dragSource && !this.longPressTimer)) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }

    startDrag(touch) {
        this.isDragging = true;
        this.longPressTimer = null;
        this.dataTransferStore = {}; // Réinitialiser le store de données

        // Créer le fantôme visuel
        this.createGhost();
        this.updateGhostPosition(touch.clientX, touch.clientY);

        // Ajouter la classe de dragging à la source
        // Note: Les scripts existants utilisent 'dragging-creature' pour les créatures et 'dragging' pour les joueurs
        if (this.dragSource.classList.contains('creature-tab')) {
            this.dragSource.classList.add('dragging-creature');

            // Simuler dragstart
            // Les données définies par le gestionnaire (setData) seront stockées dans this.dataTransferStore
            this.fireSyntheticEvent('dragstart', this.dragSource, touch.clientX, touch.clientY);

        } else if (this.dragSource.classList.contains('player-wrapper')) {
            this.dragSource.classList.add('dragging');
            this.fireSyntheticEvent('dragstart', this.dragSource, touch.clientX, touch.clientY);
        }

        // Vibreur pour feedback tactile (si supporté)
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }

    endDrag(e) {
        this.isDragging = false;

        // Trouver la cible finale
        // Note: touchchend n'a pas de touches, on utilise lastTouchX/Y ou changedTouches
        let clientX = this.lastTouchX;
        let clientY = this.lastTouchY;

        if (e && e.changedTouches && e.changedTouches.length > 0) {
            clientX = e.changedTouches[0].clientX;
            clientY = e.changedTouches[0].clientY;
        }

        const target = document.elementFromPoint(clientX, clientY);

        if (target) {
            // Simuler drop
            this.fireSyntheticEvent('drop', target, clientX, clientY);
        }

        // Simuler dragend sur la source
        if (this.dragSource) {
            this.fireSyntheticEvent('dragend', this.dragSource, clientX, clientY);

            // Nettoyage des classes
            this.dragSource.classList.remove('dragging-creature');
            this.dragSource.classList.remove('dragging');
        }

        // Supprimer le fantôme
        this.removeGhost();
        this.dragSource = null;
        this.dataTransferStore = {};
    }

    createGhost() {
        if (!this.dragSource) return;

        this.dragGhost = this.dragSource.cloneNode(true);

        // Styles pour le fantôme
        this.dragGhost.style.position = 'fixed';
        this.dragGhost.style.pointerEvents = 'none'; // Important pour que elementFromPoint ignore le fantôme
        this.dragGhost.style.zIndex = '9999';
        this.dragGhost.style.opacity = '0.8';
        this.dragGhost.style.transform = 'scale(1.05)';
        this.dragGhost.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
        this.dragGhost.style.width = this.dragSource.offsetWidth + 'px';
        this.dragGhost.style.height = this.dragSource.offsetHeight + 'px';

        // On retire les classes qui pourraient interférer avec l'affichage absolute
        // this.dragGhost.classList.remove('dragging-creature', 'dragging');

        document.body.appendChild(this.dragGhost);
    }

    updateGhostPosition(x, y) {
        if (!this.dragGhost) return;

        // Centrer le fantôme sous le doigt
        const width = this.dragGhost.offsetWidth;
        const height = this.dragGhost.offsetHeight;

        this.dragGhost.style.left = (x - width / 2) + 'px';
        this.dragGhost.style.top = (y - height / 2) + 'px';
    }

    removeGhost() {
        if (this.dragGhost && this.dragGhost.parentNode) {
            this.dragGhost.parentNode.removeChild(this.dragGhost);
        }
        this.dragGhost = null;
    }

    fireSyntheticEvent(type, target, x, y) {
        let event;

        // Création d'un événement DragEvent simulé
        try {
            event = new CustomEvent(type, {
                bubbles: true,
                cancelable: true,
                detail: {
                    originalEvent: null
                }
            });
        } catch (e) {
            event = document.createEvent('CustomEvent');
            event.initCustomEvent(type, true, true, {});
        }

        // Ajouter les propriétés de coordonnées
        event.clientX = x;
        event.clientY = y;
        event.pageX = x + window.scrollX;
        event.pageY = y + window.scrollY;

        // Mocker dataTransfer avec stockage persistant
        const dataStore = this.dataTransferStore;

        event.dataTransfer = {
            dropEffect: 'move',
            effectAllowed: 'all',
            setData: function(format, data) {
                dataStore[format] = data;
            },
            getData: function(format) {
                return dataStore[format];
            },
            clearData: function(format) {
                if (format) delete dataStore[format];
                else for (let key in dataStore) delete dataStore[key];
            },
            setDragImage: function() {}
        };

        // Dispatch
        target.dispatchEvent(event);
        return event;
    }
}

// Initialisation au chargement du DOM
window.addEventListener('DOMContentLoaded', () => {
    new TouchDragManager();
});
