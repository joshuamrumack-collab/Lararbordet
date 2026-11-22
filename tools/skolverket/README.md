# Uppdatera kurs- och ämnesplaner från Skolverket

Centralt innehåll hämtas från Skolverkets öppna Syllabus API (https://api.skolverket.se/syllabus/v1).

```bash
cd tools/skolverket
curl -s https://api.skolverket.se/syllabus/v1/subjects -o /tmp/all.json
python3 fetch.py     # laddar ner alla ämnen för GR, GRAN, GY och GYAN till raw/
python3 build.py     # bygger catalog.json
python3 crit.py      # bygger crit.json (betygskriterier)
gzip -9 -n -c catalog.json > ../../data/catalog.json.gz && gzip -9 -n -c crit.json > ../../data/crit.json.gz
npm run build        # bygger om dist/index.html
```

Höj sedan versionen och pusha till `main`.

En enskild skolform kan läggas till utan att bygga om allt: `python3 add_forms.py GYAN` (läser raw/ och lägger in skolformen i de befintliga datafilerna).
