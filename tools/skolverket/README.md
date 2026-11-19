# Uppdatera kurs- och ämnesplaner från Skolverket

Centralt innehåll hämtas från Skolverkets öppna Syllabus API (https://api.skolverket.se/syllabus/v1).

```bash
cd tools/skolverket
curl -s https://api.skolverket.se/syllabus/v1/subjects -o /tmp/all.json
python3 fetch.py     # laddar ner alla ämnen för GR, GRAN och GY till raw/
python3 build.py     # bygger catalog.json
python3 inject.py    # lägger in katalogen i dist/index.html
```

Höj sedan versionen och pusha till `main`.
