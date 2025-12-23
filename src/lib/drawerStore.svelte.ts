export const drawer = $state({
  open: false,
  selectedObject: null,
});

// Cette fonction MUTE les propriétés de l'objet, elle ne ré-assigne pas
export function openModifyDrawer(object) {
  drawer.selectedObject = object;
  drawer.open = true;
}

// C'est bien d'avoir une fonction pour fermer aussi
export function closeDrawer() {
  drawer.open = false;
  drawer.selectedObject = null;
}
