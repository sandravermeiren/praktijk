/* Wachtlijst voor de try-out van het live groepstraject (Wolfsziel) via Kit (v4 API).
   Variabelen in Vercel:
   - KIT_API_KEY (v4 API key, dezelfde als voor de nieuwsbrief)
   - KIT_WACHTLIJST_TAG (naam van de tag, standaard "Wolfsziel wachtlijst")
   - KIT_WACHTLIJST_FORM_ID (optioneel: nummer van een apart Kit-formulier voor de wachtlijst,
     zodat Kit een bevestigingsmail verstuurt en de persoon daarna mails kan ontvangen) */
const mailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const hits = new Map();
let tagCache = null;

async function kit(pad, opties, sleutel) {
  const r = await fetch('https://api.kit.com/v4' + pad, {
    ...opties,
    headers: { 'Content-Type': 'application/json', 'X-Kit-Api-Key': sleutel },
  });
  const tekst = await r.text().catch(() => '');
  let json = null;
  try { json = tekst ? JSON.parse(tekst) : null; } catch (e) { /* geen json */ }
  return { ok: r.ok, status: r.status, json, tekst };
}

/* zoekt de tag op naam en maakt ze aan als ze nog niet bestaat */
async function tagId(naam, sleutel) {
  if (tagCache && tagCache.naam === naam) return tagCache.id;
  let pad = '/tags?per_page=1000';
  for (let i = 0; i < 10 && pad; i++) {
    const l = await kit(pad, { method: 'GET' }, sleutel);
    if (!l.ok) throw new Error('tags ophalen mislukt: ' + l.status + ' ' + l.tekst);
    const gevonden = ((l.json && l.json.tags) || []).find((t) => String(t.name).toLowerCase() === naam.toLowerCase());
    if (gevonden) { tagCache = { naam, id: gevonden.id }; return gevonden.id; }
    const p = l.json && l.json.pagination;
    pad = p && p.has_next_page && p.end_cursor ? '/tags?per_page=1000&after=' + encodeURIComponent(p.end_cursor) : null;
  }
  const n = await kit('/tags', { method: 'POST', body: JSON.stringify({ name: naam }) }, sleutel);
  const id = n.ok && n.json && n.json.tag && n.json.tag.id;
  if (!id) throw new Error('tag aanmaken mislukt: ' + n.status + ' ' + n.tekst);
  tagCache = { naam, id };
  return id;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false });
  }
  const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const mail = String(b.mail || '').trim().slice(0, 200);
  const voornaam = String(b.voornaam || '').trim().slice(0, 80);

  if (b.website) return res.status(200).json({ ok: true });
  if (!mailRe.test(mail)) {
    return res.status(400).json({ ok: false, fout: 'Vul een geldig e-mailadres in.' });
  }

  const ip = String(req.headers['x-forwarded-for'] || 'onbekend').split(',')[0].trim();
  const nu = Date.now();
  const lijst = (hits.get(ip) || []).filter((t) => nu - t < 3600000);
  if (lijst.length >= 5) return res.status(429).json({ ok: false, fout: 'Je hebt je al meerdere keren ingeschreven. Probeer het later opnieuw.' });
  lijst.push(nu);
  hits.set(ip, lijst);

  const { KIT_API_KEY, KIT_WACHTLIJST_TAG, KIT_WACHTLIJST_FORM_ID } = process.env;
  if (!KIT_API_KEY) {
    return res.status(500).json({ ok: false, fout: 'De wachtlijst is nog niet volledig ingesteld.' });
  }
  const fout = { ok: false, fout: 'Inschrijven is niet gelukt. Probeer het later opnieuw.' };
  try {
    /* 1. abonnee aanmaken (bestaat het adres al, dan wordt het bijgewerkt) */
    const a = await kit('/subscribers', { method: 'POST', body: JSON.stringify({ email_address: mail, first_name: voornaam || null }) }, KIT_API_KEY);
    if (!a.ok) {
      console.error('Kit abonnee aanmaken mislukt:', a.status, a.tekst);
      return res.status(502).json(fout);
    }
    /* 2. tag "Wolfsziel wachtlijst" geven */
    const id = await tagId(KIT_WACHTLIJST_TAG || 'Wolfsziel wachtlijst', KIT_API_KEY);
    const t = await kit('/tags/' + encodeURIComponent(id) + '/subscribers', { method: 'POST', body: JSON.stringify({ email_address: mail }) }, KIT_API_KEY);
    if (!t.ok) {
      console.error('Kit tag koppelen mislukt:', t.status, t.tekst);
      return res.status(502).json(fout);
    }
    /* 3. (optioneel) aan het wachtlijstformulier koppelen */
    if (KIT_WACHTLIJST_FORM_ID) {
      const f = await kit('/forms/' + encodeURIComponent(KIT_WACHTLIJST_FORM_ID) + '/subscribers', { method: 'POST', body: JSON.stringify({ email_address: mail }) }, KIT_API_KEY);
      if (!f.ok) {
        console.error('Kit formulier koppelen mislukt:', f.status, f.tekst);
        return res.status(502).json(fout);
      }
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Kit-aanroep mislukt:', e && e.message);
    return res.status(500).json(fout);
  }
};
