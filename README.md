# Lärarbordet

Planering, årshjul, täckning av centralt innehåll i Lgr22 och lokalt bedömningsverktyg för lärare. All data stannar på lärarens egen dator.

Av **DorkTeach**.

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

**HTML:** dubbelklicka på `lararbordet.html`. Tryck **Spara** uppe till höger (eller Ctrl/Cmd+S). I Chrome och Edge väljer du `lararbordet.html` en gång, sedan sparas allt automatiskt. I Safari och Firefox laddas en ny kopia ner som du ersätter den gamla med. Filen fungerar inte inbäddad på en webbsida, bara nedladdad.

## Personuppgifter

Elevnamn och omdömen är personuppgifter. Inget skickas till någon server, men filen ska ligga där skolan tillåter. Använd gärna initialer eller elevnummer.

## Centralt innehåll

Formuleringarna för Svenska, Matematik, Engelska och Teknik 7–9 är förkortade. Kontrollera mot kursplanerna på skolverket.se. Egna ämnen kan läggas till under *Inställningar*.

## För utvecklare

Appen är en enda fil: `dist/index.html`. Skrivbordsversionerna byggs med [Tauri 2](https://tauri.app) runt samma fil.

```bash
npm ci
npx tauri icon app-icon.png
npx tauri dev       # kör lokalt
npx tauri build     # bygger installationsfil för din plattform
```

Ny release: höj `version` i `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml` och `package.json` och pusha till `main`. GitHub Actions bygger `.exe`, `.msi`, `.dmg` och lägger till `lararbordet.html`.
