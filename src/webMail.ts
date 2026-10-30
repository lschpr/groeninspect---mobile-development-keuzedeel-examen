// Alleen voor de webversie. Een mailto-link kan geen bijlagen meesturen, dus
// in de browser gebruiken we het deelmenu (Web Share API) om de foto mee te
// geven. Kan de browser geen bestanden delen, dan downloaden we de foto zodat
// de medewerker hem zelf aan de mail kan toevoegen.

type WebMail = { aan: string; onderwerp: string; tekst: string; fotoUri: string; bestandsnaam: string };

// 'gedeeld' = via het deelmenu verstuurd, 'geannuleerd' = deelmenu gesloten,
// 'niet-ondersteund' = browser kan geen bestanden delen.
export async function deelMetFoto(mail: WebMail): Promise<'gedeeld' | 'geannuleerd' | 'niet-ondersteund'> {
  const blob = dataUriNaarBlob(mail.fotoUri);
  if (!blob) return 'niet-ondersteund';
  const bestand = new window.File([blob], mail.bestandsnaam, { type: blob.type });
  const data: ShareData = {
    files: [bestand],
    title: mail.onderwerp,
    // Het deelmenu kan geen ontvanger invullen; daarom staat het adres in de tekst.
    text: `Aan: ${mail.aan}\n\n${mail.tekst}`,
  };
  if (!navigator.canShare?.(data)) return 'niet-ondersteund';
  try {
    await navigator.share(data);
    return 'gedeeld';
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return 'geannuleerd';
    throw e;
  }
}

// Synchroon (zonder await) omzetten: browsers staan navigator.share alleen toe
// direct na een tik van de gebruiker, en een await ertussen kan dat breken.
function dataUriNaarBlob(uri: string): Blob | null {
  const match = /^data:([^;,]+);base64,(.*)$/.exec(uri);
  if (!match) return null;
  const binair = atob(match[2]);
  const bytes = new Uint8Array(binair.length);
  for (let i = 0; i < binair.length; i++) bytes[i] = binair.charCodeAt(i);
  return new Blob([bytes], { type: match[1] });
}

export function downloadFoto(fotoUri: string, bestandsnaam: string): void {
  const a = document.createElement('a');
  a.href = fotoUri;
  a.download = bestandsnaam;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function openMailto(aan: string, onderwerp: string, tekst: string): void {
  window.location.href = `mailto:${aan}?subject=${encodeURIComponent(onderwerp)}&body=${encodeURIComponent(tekst)}`;
}
