// Déclenche le téléchargement d'un Blob côté navigateur (reçus de paiement, certificats, ...) -
// factorisé ici car utilisé par plusieurs écrans (paiement-suivi, eleve-dossier).
export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Certains navigateurs n'ont pas encore commencé à lire l'URL au retour de
  // click(). Une révocation immédiate produit alors un téléchargement vide ou
  // aucun téléchargement.
  window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
}
