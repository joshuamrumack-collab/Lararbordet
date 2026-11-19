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

Varningarna visas för att programmet inte är signerat med ett betalt utvecklarcertifikat.

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

## Börja från början

*Inställningar → Rensa allt* tar bort allt, även exempeldatan, och ger ett helt tomt Lärarbordet.

## För utvecklare

Appen är en enda fil: `dist/index.html`. Skrivbordsversionerna byggs med [Tauri 2](https://tauri.app) runt samma fil.

```bash
npm install
npx tauri icon app-icon.png   # bara om du byter ikon
npx tauri dev       # kör lokalt
npx tauri build     # bygger installationsfil för din plattform
```

Ny release: höj `version` i `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml` och `package.json` och pusha till `main`. GitHub Actions bygger `.exe`, `.msi`, `.dmg` och lägger till `lararbordet.html`.
