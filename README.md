# Praktijk (website Sandra Vermeiren)

Statische website: `index.html` plus de map `img` met de afbeeldingen, en twee serverfuncties: het contactformulier (`api/contact.js`) en de nieuwsbriefinschrijving (`api/subscribe.js`). Er is geen build nodig.

- Hosting: Vercel, project `Praktijk` (Framework Preset: Other, geen build command, output directory leeg)
- Afspraken lopen via Cal.com (sessiesmetsandra)
- Het contactformulier verstuurt mail via SMTP. Stel in Vercel (Settings, Environment Variables) deze variabelen in: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` en `CONTACT_TO`.
- De nieuwsbriefformulieren schrijven in bij Kit. Stel in Vercel in: `KIT_API_KEY` (v4 API key uit Kit, Settings, Developer) en `KIT_FORM_ID` (het nummer van het Kit-formulier, zichtbaar in de URL van het formulier).

## Zoekmachines

De site is vindbaar: elke pagina heeft een eigen adres, titel, beschrijving en canonical (zie `seo.py` in de bouwmap), plus `sitemap.xml`, `robots.txt` en `llms.txt`.
Het domein staat ingesteld op `https://www.sandravermeiren.be`.
