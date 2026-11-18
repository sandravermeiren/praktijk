# Praktijk (website Sandra Vermeiren)

Statische website: `index.html` plus de map `img` met de afbeeldingen, en één serverfunctie voor het contactformulier (`api/contact.js`). Er is geen build nodig.

- Hosting: Vercel, project `Praktijk` (Framework Preset: Other, geen build command, output directory leeg)
- Afspraken lopen via Cal.com (sessiesmetsandra)
- Het contactformulier verstuurt mail via SMTP. Stel in Vercel (Settings, Environment Variables) deze variabelen in: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` en `CONTACT_TO`.

## Let op: nog niet vindbaar in Google

Tijdens de voorlopige fase vraagt `vercel.json` zoekmachines om de site te negeren (kop `X-Robots-Tag: noindex, nofollow`).
**Verwijder dat blok uit `vercel.json` zodra het eigen domein live gaat**, anders blijft de site onvindbaar in Google.
