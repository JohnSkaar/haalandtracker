# haalandtracker

Et repo til to sider: **haalandtracker.com** (engelsk) og **haalandtracker.no** (norsk).
Kamptidslinje, meritter, historikk og interaktive rekordgrafer for Erling Braut Haaland — klubb, Champions League og landslag.

## Status

- 🇳🇴 Norsk versjon (`/no/`): ferdig, testet, fungerer fullt ut.
- 🇬🇧 Engelsk versjon (rot `/`): plassholder-side. Full oversettelse av innholdet er ikke gjort ennå.

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

## Gjenstående arbeid

1. **Engelsk oversettelse.** `source/Main.no.dc.html` må oversettes til `source/Main.en.dc.html`
   (all norsk tekst — kamptekster, meritter, historikk-beskrivelser, kildehenvisninger — må
   oversettes nøyaktig), bygges til `assets/site.en.js`, og `index.html` må oppdateres til å
   bruke den (samme mønster som `no/index.html`).
2. **Domener og hosting.** Koble GitHub-repoet til et Vercel- eller Netlify-prosjekt, og legg
   til `haalandtracker.com` og `haalandtracker.no` som egendefinerte domener på det samme
   prosjektet. `vercel.json` inneholder domene-basert rewrite-logikk (host-header) som ruter
   `haalandtracker.no`-forespørsler til `/no/`-mappen — denne bør testes når domenene faktisk
   er koblet til, siden det ikke kan verifiseres uten ekte DNS.
3. **DNS.** Hos din domeneregistrar (der du kjøpte .com/.no) må du peke domenene til
   Vercel/Netlify sine nameservere eller A/CNAME-oppføringer — dette gjøres i registrarens
   eget kontrollpanel, ikke noe jeg kan gjøre fra denne sesjonen.
4. **Google Analytics (GA4).** Når siden er ekte hostet (ikke lenger en Claude Artifact), kan
   et vanlig GA4-sporingsskript legges til i `<head>` på begge `index.html`-filer — dette var
   blokkert inne i Claude Artifacts, men fungerer normalt på ekte hosting.
