<img src="assets/logo.png" alt="Lärarbordet" width="420">


Planering, årshjul, täckning av centralt innehåll i Lgr22 och lokalt bedömningsverktyg för lärare. All data stannar på lärarens egen dator.

Av **DorkTeach**.

## Testa direkt i webbläsaren

**https://joshuamrumack-collab.github.io/Lararbordet/** – öppnas med exempeldata. Vill du spara på riktigt, ladda ner en version nedan.

## Ladda ner

Gå till **Releases** (till höger på sidan) och välj den version som passar din dator:

| Dator | Fil | Var sparas datan |
|---|---|---|
| Windows | `…x64-setup.exe` | `Dokument\Lärarbordet\lararbordet.json` |
| Mac | `…universal.dmg` | `Dokument/Lärarbordet/lararbordet.json` |
| Chromebook, eller om du inte får installera program | `lararbordet.html` | Inuti själva HTML-filen |

Alla versioner använder samma data. Du kan flytta mellan dem med *Inställningar → Öppna annan fil* eller *Importera data*.

## Installera

**Windows:** kör `setup.exe`. Om Windows visar *”Windows skyddade datorn”*: klicka **Mer information → Kör ändå**. Programmet installeras bara för din användare och kräver inte administratörsbehörighet.

**Mac:** öppna `.dmg`-filen och dra *Lärarbordet* till Program. Första gången: högerklicka på appen → **Öppna** → **Öppna**. Står det att appen ”inte kan öppnas”: gå till **Systeminställningar → Integritet och säkerhet** och klicka **Öppna ändå**.

Varningarna visas för att programmet inte är signerat med ett utvecklarcertifikat.

## Signering

Bygget signerar automatiskt så fort certifikaten finns som hemligheter i repot (*Settings → Secrets and variables → Actions*):

- **Mac:** kräver Apples utvecklarprogram (Apple Developer Program, årsavgift). Lägg in `APPLE_CERTIFICATE` (Developer ID Application-certifikat som .p12 i base64), `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD` (appspecifikt lösenord) och `APPLE_TEAM_ID`. Appen signeras och notariseras då, och varningen försvinner.
- **Windows:** lägg in `WINDOWS_CERTIFICATE` (kodsigneringscertifikat som .pfx i base64) och `WINDOWS_CERTIFICATE_PASSWORD`. Gratisalternativ för öppen källkod: [SignPath Foundation](https://signpath.org) – kräver att repot har en godkänd öppen licens, till exempel MIT.

**HTML:** dubbelklicka på `lararbordet.html`. När du ändrar något dyker en fråga upp om att spara. I Chrome och Edge väljer du `lararbordet.html` en gång, sedan sparas varje ändring direkt i filen. Nästa gång du öppnar filen räcker ett klick på *Spara i filen*. I Safari och Firefox laddas en uppdaterad kopia ner som du ersätter den gamla med. Filen fungerar inte inbäddad på en webbsida, bara nedladdad.

## Personuppgifter

Elevnamn och omdömen är personuppgifter. Inget skickas till någon server, men filen ska ligga där skolan tillåter. Använd gärna initialer eller elevnummer.

## Ämnen och centralt innehåll

Allt centralt innehåll finns inbyggt, ordagrant från Skolverkets kurs- och ämnesplaner:

- Grundskolan, alla ämnen (åk 1–3, 4–6, 7–9)
- Anpassade grundskolan, ämnen
- Anpassade grundskolan, ämnesområden
- Gymnasieskolan, ämnen med nivåer (från ht 2025)
- Gymnasieskolan, kurser enligt äldre ämnesplaner

Välj vilka ämnen och årskurser eller nivåer du undervisar i under *Inställningar → Mina ämnen* eller *Centralt innehåll → Välj ämnen*. Egna ämnen och eget innehåll kan läggas till. Se `tools/skolverket` för hur katalogen uppdateras.

## Det här kan Lärarbordet

- **Planering:** kurser, arbetsområden på ett veckoband och lektioner med upplägg, anteckningar och genomförd-bock. Skapa en hel lektionsserie på en gång, lov hoppas över.
- **Schema och kalendarium:** lägg in ditt veckoschema (även jämna och udda veckor) och fyll i kalendariet med lov, studiedagar och aktiviteter som friluftsdag och prao. Lärarbordet räknar ut vilka lektioner som blir inställda, hur många lektioner varje arbetsområde faktiskt får, och kan flytta fram planerade lektioner som krockar.
- **Läsåret i fyra vyer:** årshjul, band (en rad per kurs), månader (som en väggkalender) och veckor (vecka för vecka). Välj den du gillar under Årshjul.
- **Centralt innehåll:** se vad som är genomfört, planerat och var luckorna finns.
- **Bedömning:** matris per elevgrupp. Bedöm mot Skolverkets betygskriterier, del för del, och se underlaget per kriterium för varje elev.
- **Nytt läsår:** kopiera kurser, arbetsområden och lektioner till nästa läsår med datumen flyttade. Tidigare läsår sparas och kan öppnas igen.
- **Dela i arbetslaget:** exportera en kurs som fil, utan elever och omdömen, och importera kollegors kurser.

## Flera datorer och telefonen

- **Flera datorer:** lägg filen i en mapp som synkas med skolans Google Drive eller OneDrive (jobbkontot, om skolan godkänt det för elevuppgifter). Stäng Lärarbordet innan du byter dator. Appen varnar om filen har ändrats på en annan dator sedan du öppnade den, och skrivbordsappen varnar om filen är öppen på en annan dator just nu.
- **Guide:** *Inställningar → Använda Lärarbordet på flera datorer → Steg-för-steg-guide* visar hur du lägger filen i skolans Google Drive eller OneDrive och öppnar samma fil på nästa dator och i telefonen.
- **Telefonen:** en egen, avskalad telefonvy med flikarna Idag, Vecka, Kurser, Elever och Fil. Telefonen kan bara läsa. Ingenting kan ändras eller skrivas över.
  - **Android:** installera `…android.apk` från releasen (tillåt installation från okänd källa första gången).
  - **iPhone:** öppna https://joshuamrumack-collab.github.io/Lararbordet/ i Safari och välj *Dela → Lägg till på hemskärmen*. En installerbar iPhone-app (.ipa) kräver Apples utvecklarprogram och distribueras via TestFlight eller App Store.

## Uppdateringar

Appen kollar vid start om det finns en ny version och visar i så fall en ruta (går att stänga av under *Inställningar → Om Lärarbordet*). Inga uppgifter om dig eller eleverna skickas. Under *Inställningar → Om Lärarbordet* finns en knapp för att hämta senaste versionen. I skrivbordsappen laddar den ner rätt installationsfil för datorn (Windows eller Mac), och datan i Dokument/Lärarbordet ligger kvar. I HTML-versionen hämtar knappen den nya versionen, lägger in all din data i den och sparar den i samma fil (Chrome och Edge) eller som en nedladdning (Safari och Firefox).

## Börja från början

*Inställningar → Rensa allt* tar bort allt, även exempeldatan, och ger ett helt tomt Lärarbordet.

## För utvecklare

Källkoden ligger i `src/`: `template.html`, `styles.css` och JavaScript-moduler i `src/js/` som läses in i nummerordning. Skolverkets data ligger komprimerad i `data/`. Byggskriptet sätter ihop allt till en enda fil, `dist/index.html`, som är HTML-versionen och som skrivbordsversionerna ([Tauri 2](https://tauri.app)) byggs runt.

```bash
npm install
npm run build       # bygger dist/index.html
npm test            # testar logiken (läsår, delning, lektioner, kriterier, inläsning av gamla filer)
npx tauri dev       # kör skrivbordsappen lokalt
npx tauri build     # bygger installationsfil för din plattform
npx tauri icon app-icon.png   # bara om du byter ikon
```

Ny release: höj `version` i `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml` och `package.json` och pusha till `main`. GitHub Actions bygger `.exe`, `.msi`, `.dmg` och lägger till `lararbordet.html`.

## Licens

Copyright © 2026 DorkTeach

Lärarbordet är fri programvara: du får sprida och ändra den enligt villkoren i GNU Affero General Public License, version 3 eller (om du vill) senare, som publicerats av Free Software Foundation. Se [LICENSE](LICENSE).

Programmet distribueras i hopp om att det ska vara användbart, men UTAN NÅGON GARANTI, inte ens underförstådd garanti om SÄLJBARHET eller LÄMPLIGHET FÖR ETT VISST ÄNDAMÅL.

Kort sagt: du får använda, ändra och sprida Lärarbordet, även kommersiellt. Om du sprider en ändrad version, eller låter andra använda en ändrad version som en tjänst på nätet, måste du göra källkoden till din version tillgänglig under samma licens.

Övrigt innehåll:
- Centralt innehåll och betygskriterier kommer från Skolverkets kurs- och ämnesplaner via Skolverkets öppna API.
- fflate (MIT-licens, © Arjun Barrett) används för att packa upp den inbyggda datan.
- Skrivbordsapparna byggs med Tauri (MIT- eller Apache-2.0-licens).
