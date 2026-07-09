# osc-cooking

Eine einfache, statische Rezept-Web-App fuer GitHub Pages. Die App laedt vorhandene Rezepte aus Markdown-Dateien im Ordner `recipes` und braucht kein Backend, keine Datenbank, kein Login und keine kostenpflichtigen Dienste.

## 1. Lokal auf dem Mac starten

Die App muss ueber einen kleinen lokalen Webserver geoeffnet werden, weil der Browser Markdown- und JSON-Dateien per `fetch()` laedt. Ein Doppelklick auf `index.html` reicht dafuer meistens nicht.

1. Oeffne auf dem Mac die App "Terminal".
2. Wechsle in diesen Projektordner.
3. Starte einen lokalen Server:

```bash
python3 -m http.server 8000
```

4. Oeffne Safari und gehe zu:

```text
http://localhost:8000
```

Zum Beenden im Terminal `Ctrl` + `C` druecken.

## 2. Neue Markdown-Rezepte hinzufuegen

Lege fuer jedes Rezept eine neue Datei im Ordner `recipes` an, zum Beispiel:

```text
recipes/risotto.md
```

Eine Rezeptdatei sollte so aufgebaut sein:

```markdown
# Pilz-Risotto

Kurze Beschreibung des Rezepts.

## Zutaten

- 250 g Risotto-Reis
- 300 g Pilze
- 1 Zwiebel

## Zubereitung

1. Zwiebel wuerfeln und anschwitzen.
2. Reis dazugeben und kurz mitroesten.
3. Nach und nach Fluessigkeit zugeben und ruehren.

## Notizen

- Optionaler Hinweis.
```

Wichtig sind besonders die Ueberschriften `## Zutaten` und `## Zubereitung`, weil die App diese Bereiche besonders lesbar darstellt.

## 3. `recipes/index.json` aktualisieren

Die App kann auf GitHub Pages nicht automatisch alle Dateien im Ordner `recipes` finden. Darum muss jedes neue Rezept zusaetzlich in `recipes/index.json` eingetragen werden.

Beispiel:

```json
{
  "id": "risotto",
  "title": "Pilz-Risotto",
  "category": "Reis",
  "duration": "45 Min",
  "servings": "2 Portionen",
  "file": "risotto.md"
}
```

Hinweise:

- `id` muss eindeutig sein und sollte keine Leerzeichen enthalten.
- `title` ist der Name in der Rezeptliste.
- `category` erscheint im Filter.
- `duration` und `servings` werden in Liste und Detailansicht angezeigt.
- `file` ist der Dateiname im Ordner `recipes`.

Wenn du ein Rezept hinzufuegst, achte in der JSON-Datei auf Kommas zwischen den Eintraegen.

## 4. Änderungen mit GitHub Desktop hochladen

1. Oeffne GitHub Desktop.
2. Waehle links oben dieses Repository aus: `osc-cooking`.
3. Pruefe die geaenderten Dateien in der linken Seitenleiste.
4. Schreibe unten links eine kurze Zusammenfassung, zum Beispiel `Add recipe app`.
5. Klicke auf `Commit to main`.
6. Klicke danach auf `Push origin`, damit die Aenderungen zu GitHub hochgeladen werden.

## 5. GitHub Pages aktivieren

1. Oeffne das Repository auf GitHub im Browser.
2. Gehe zu `Settings`.
3. Oeffne links den Bereich `Pages`.
4. Waehle bei `Build and deployment` als Quelle `Deploy from a branch`.
5. Waehle den Branch `main` und den Ordner `/root`.
6. Speichere die Einstellung.

Nach kurzer Zeit ist die App voraussichtlich unter dieser Adresse erreichbar:

```text
https://oschwamm.github.io/osc-cooking/
```

## 6. App auf dem iPhone oeffnen

1. Oeffne Safari auf dem iPhone.
2. Gehe zu:

```text
https://oschwamm.github.io/osc-cooking/
```

3. Tippe auf das Teilen-Symbol.
4. Waehle `Zum Home-Bildschirm`.
5. Bestaetige mit `Hinzufuegen`.

Danach erscheint die App wie ein Symbol auf dem Home-Bildschirm. Beim ersten Oeffnen sollte eine Internetverbindung bestehen, damit alle Dateien geladen und zwischengespeichert werden koennen.

## 7. Einschraenkungen

- Eine kostenlose GitHub-Pages-Seite ist nicht wirklich privat. Wenn das Repository oeffentlich ist, koennen auch andere Personen die Seite und die Rezeptdateien finden oder direkt aufrufen.
- Es gibt kein Login und keinen Zugriffsschutz.
- Die App ist nur zum Lesen gedacht. Rezepte werden nicht in der App erstellt, bearbeitet oder geloescht.
- Neue oder geaenderte Rezepte muessen als Markdown-Dateien gespeichert und in `recipes/index.json` eingetragen werden.
- Der Service Worker speichert App-Dateien und Beispielrezepte im Browsercache. Nach Aenderungen kann es manchmal noetig sein, die Seite neu zu laden oder Safari kurz zu schliessen und wieder zu oeffnen.
- `localStorage` wird nicht fuer Rezeptdaten verwendet.

## Dateien

- `index.html`: Grundgeruest der App
- `style.css`: ruhiges, responsives Design
- `app.js`: Suche, Filter, Rezeptliste, Markdown-Anzeige
- `manifest.json`: PWA-Einstellungen
- `service-worker.js`: Offline-Cache fuer App-Dateien und Beispielrezepte
- `recipes/index.json`: Rezeptverzeichnis
- `recipes/*.md`: einzelne Rezeptdateien
