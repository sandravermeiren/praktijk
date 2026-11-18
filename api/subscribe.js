/* Nieuwsbrief-inschrijving via Kit (v4 API).
   Variabelen in Vercel: KIT_API_KEY (v4 API key) en KIT_FORM_ID (nummer van het Kit-formulier). */
const mailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const hits = new Map();

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

  /* eenvoudige rem: maximaal 5 inschrijvingen per uur per IP */
  const ip = String(req.headers['x-forwarded-for'] || 'onbekend').split(',')[0].trim();
  const nu = Date.now();
  const lijst = (hits.get(ip) || []).filter((t) => nu - t < 3600000);
  if (lijst.length >= 5) return res.status(429).json({ ok: false, fout: 'Je hebt je al meerdere keren ingeschreven. Probeer het later opnieuw.' });
  lijst.push(nu);
  hits.set(ip, lijst);

  const { KIT_API_KEY, KIT_FORM_ID } = process.env;
  if (!KIT_API_KEY || !KIT_FORM_ID) {
    return res.status(500).json({ ok: false, fout: 'De nieuwsbrief is nog niet volledig ingesteld.' });
  }
  const kop = { 'Content-Type': 'application/json', 'X-Kit-Api-Key': KIT_API_KEY };
  try {
    /* 1. abonnee aanmaken (bestaat het adres al, dan wordt het bijgewerkt) */
    const a = await fetch('https://api.kit.com/v4/subscribers', {
      method: 'POST',
      headers: kop,
      body: JSON.stringify({ email_address: mail, first_name: voornaam || null }),
    });
    if (!a.ok) {
      console.error('Kit abonnee aanmaken mislukt:', a.status, await a.text().catch(() => ''));
      return res.status(502).json({ ok: false, fout: 'Inschrijven is niet gelukt. Probeer het later opnieuw.' });
    }
    /* 2. abonnee aan het formulier koppelen (bij dubbele opt-in verstuurt Kit de bevestigingsmail) */
    const f = await fetch('https://api.kit.com/v4/forms/' + encodeURIComponent(KIT_FORM_ID) + '/subscribers', {
      method: 'POST',
      headers: kop,
      body: JSON.stringify({ email_address: mail }),
    });
    if (!f.ok) {
      console.error('Kit formulier koppelen mislukt:', f.status, await f.text().catch(() => ''));
      return res.status(502).json({ ok: false, fout: 'Inschrijven is niet gelukt. Probeer het later opnieuw.' });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Kit-aanroep mislukt:', e && e.message);
    return res.status(500).json({ ok: false, fout: 'Inschrijven is niet gelukt. Probeer het later opnieuw.' });
  }
};
