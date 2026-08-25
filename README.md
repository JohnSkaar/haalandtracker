# haalandtracker

Et repo til to sider: **haalandtracker.com** (engelsk) og **haalandtracker.no** (norsk).
Kamptidslinje, meritter, historikk og interaktive rekordgrafer for Erling Braut Haaland — klubb, Champions League og landslag.

## Status

- 🇳🇴 Norsk versjon (`/no/`): **klar for publisering på haalandtracker.no.** Testet i ekte nettleser
  (Playwright/Chromium) på skjermbredder fra 360px til 1024px+ — ingen horisontal overflow, alle 4
  kolonner (klubb/CL/landslag/fun facts) stables korrekt under hverandre på mobil (≤900px) og vises
  som rader ved siden av hverandre på desktop. Har favicon, robots-meta, canonical-URL, Open
  Graph/Twitter-tagger og en `sitemap.xml`.
- 🇬🇧 Engelsk versjon (rot `/`): plassholder-side, merket `noindex` slik at den ikke indekseres før
  den er ferdig. Full oversettelse av innholdet er ikke gjort ennå.

## Klar for publisering på haalandtracker.no — gjenstår kun hos deg

Alt kode- og innholdsarbeid for den norske siden er gjort og pushet til `main`. Det som gjenstår er
utelukkende ting jeg ikke har tilgang til å gjøre fra denne sesjonen:

1. **Koble repoet til Vercel eller Netlify.** Logg inn med GitHub-kontoen din, importer
   `JohnSkaar/haalandtracker` som et nytt prosjekt. Ingen build-kommando trengs (ren statisk HTML/CSS/JS) —
   sett "Output Directory" til repo-roten (`.`).
2. **Legg til `haalandtracker.no` som egendefinert domene** på Vercel/Netlify-prosjektet.
   `vercel.json` ruter automatisk alle forespørsler med `Host: haalandtracker.no` til `/no/`-innholdet
   (untatt `/assets/`, `/robots.txt`, `/sitemap.xml`, favicon — disse serveres direkte fra roten).
3. **DNS hos domeneregistraren din** (der du kjøpte haalandtracker.no): pek domenet til
   Vercel/Netlify sine oppgitte nameservere eller A/CNAME-oppføringer — vises i deres dashboard
   når du legger til domenet i steg 2.
4. **Verifiser etter at DNS har propagert** (kan ta fra minutter til noen timer): åpne
   `https://haalandtracker.no/` og sjekk at den norske siden vises (ikke plassholderen), og at
   `https://haalandtracker.no/robots.txt` og `/sitemap.xml` svarer riktig.

## Struktur

```
index.html          engelsk plassholder (haalandtracker.com)
no/index.html        norsk side (haalandtracker.no) — fullverdig
assets/style.css      delt CSS for begge språk
assets/site.no.js    generert render-motor + data for norsk (se "Bygge på nytt")
assets/main.no.js     liten runtime som monterer siden og håndterer klikk
source/Main.no.dc.html  kilde: opprinnelig Claude Design-canvas-format (Norwegian)
build/transform.mjs  bygg-script som konverterer .dc.html-kilden til assets/site.<locale>.js
vercel.json          domene-basert routing (haalandtracker.no -> /no/, haalandtracker.com -> rot)
robots.txt           tillater indeksering, peker til sitemap.xml
sitemap.xml           lister https://haalandtracker.no/
```

## Hvorfor et bygg-steg?

Innholdet ble først laget som et Claude Design-canvas (`.dc.html`), som bruker en egen
templating-syntaks (`{{felt}}`, `<sc-if>`, `<sc-for>`) som bare kjører inne i Claude sitt
eget forhåndsvisningsmiljø. `build/transform.mjs` oversetter den syntaksen mekanisk til en
vanlig JS-klasse med en `render(vals)`-funksjon som bruker template literals — resultatet
(`assets/site.no.js`) er ren, avhengighetsfri JavaScript som kjører i enhver nettleser.

## Bygge på nytt

Hvis `source/Main.no.dc.html` oppdateres (nye kamper, rettede data osv.):

```bash
node build/transform.mjs source/Main.no.dc.html assets/site.no.js
```

Ingen npm-avhengigheter kreves for selve siden — kun for lokal testing med Playwright om ønskelig.

## Gjenstående arbeid (utover å publisere haalandtracker.no, se over)

1. **Engelsk oversettelse + haalandtracker.com.** `source/Main.no.dc.html` må oversettes til
   `source/Main.en.dc.html` (all norsk tekst — kamptekster, meritter, historikk-beskrivelser,
   kildehenvisninger — må oversettes nøyaktig), bygges til `assets/site.en.js`, og `index.html`
   må oppdateres til å bruke den (samme mønster som `no/index.html`), samt legges til som
   domene i samme Vercel/Netlify-prosjekt med tilhørende DNS.
2. **Google Analytics (GA4).** Når siden er live på ekte hosting, kan et vanlig GA4-sporingsskript
   legges til i `<head>` på begge `index.html`-filer — dette var blokkert inne i Claude Artifacts,
   men fungerer normalt på ekte hosting.
