// FAQ entries, grouped by realm in the order of their first appearance
export default [
  {
    realm: 'Neuigkeiten',
    title: 'Genauere Berechnung für größere Anlagen (10/26)',
    text: "Innerhalb einer Stunde schwankt der Verbrauch: Wasserkocher oder Herd erzeugen kurze Lastspitzen. Bisher konnte die PV diese Spitzen nur bis zum Stundenmittel des Verbrauchs decken, selbst wenn viel mehr Sonne da war. Dadurch wurde der Eigenverbrauch ohne Speicher zu niedrig und der Nutzen eines Speichers zu hoch berechnet, je nach Anlage um etwa 15 bis 25 %. Jetzt deckt die PV die Spitzen bis zu ihrer tatsächlichen Leistung. Deine Ergebnisse können sich deshalb ändern: mehr Autarkie ohne Speicher, etwas weniger Zusatznutzen durch den Speicher. Außerdem verteilt das neue Modell den Jahresverbrauch realistischer: Das Standardlastprofil H0 ist der glatte Durchschnitt vieler Haushalte, ein echter Haushalt verbraucht unruhiger. Das kalibrierte Profil 'H0 kalibriert' bildet das nach, die Autarkie fällt dadurch einige Prozentpunkte niedriger und realistischer aus. Zum Vergleich kannst du in den Experten-Einstellungen weiterhin das bisherige Rechenmodell „Klassisch“ wählen. Wie genau gerechnet wird, steht in der Datei 'functions/BERECHNUNG.md' im <a href='https://github.com/nick81nrw/PVTools/blob/main/pvtools/functions/BERECHNUNG.md'>Quellcode</a>.",
  },
  {
    realm: 'Neuigkeiten',
    title: 'Neues Design und aktuellere Wetterdaten (10/26)',
    text: 'PVTools hat ein komplett neues Design mit Dark Mode bekommen. Die Ergebnisse zeigen jetzt direkt eine Empfehlung, die wichtigsten Kennzahlen und eine Energiebilanz je Speichergröße. Die Wetterdaten kommen aus PVGIS 5.3, damit stehen die Jahre 2005 bis 2023 zur Auswahl. Außerdem werden der minimale Ladezustand und die maximale Ladeleistung des Speichers jetzt korrekt berücksichtigt.',
  },
  {
    realm: 'Neuigkeiten',
    title: 'Bessere Berechnung und Datendownload (11/23)',
    text: "In die Berechnung haben wir 'Ungenauigkeiten' beim Stromverbrauch eingebaut, damit werden Verbrauchsschwankungen auf Grundlage des aktuellen Verbrauchs simuliert. Zudem haben wir je nach Leistung des Wechselrichters eine Wirkungsgrad-Kennlinie hinterlegt und berechnen diese ein. Beides führt dazu, dass sich der Eigenverbrauch reduziert und damit näher an den tatsächlichen Wert herankommt. Zudem können nun die Ergebnisse als CSV-Datei heruntergeladen und weiterverarbeitet werden. ACHTUNG: Die Dezimalzahlen haben einen Punkt anstatt eines Kommas, das müsst ihr beim Import in Excel berücksichtigen.",
  },
  {
    realm: 'Neuigkeiten',
    title: 'Eigenen Verbrauch nutzen (09/23)',
    text: "Es ist nun möglich, den eigenen Verbrauch in die Berechnung einfließen zu lassen. Wie das geht, könnt ihr in den FAQs unter 'Eingabefelder' nachlesen.",
  },
  {
    realm: 'Allgemeines',
    title: 'Woher kommen die Daten',
    text: 'Die Berechnung basiert auf Daten von PVGIS, einem kostenlosen Tool der Europäischen Kommission zur Ermittlung von Strahlungsdaten. Dieses Tool stellt auch einige kostenlose Schnittstellen bereit, die wir nutzen. Der eingetragene Jahresstromverbrauch wird mit dem Standardlastprofil H0 des BDEW auf die Stunden des Jahres verteilt. Beim Standard-Rechenmodell kommen realistische Schwankungen von Stunde zu Stunde hinzu („H0 kalibriert“), weil ein einzelner Haushalt deutlich unruhiger verbraucht als der Durchschnitt im H0-Profil. Alternativ können eigene Messwerte hochgeladen werden.',
  },
  {
    realm: 'Allgemeines',
    title: 'Wie funktioniert die Berechnung',
    text: 'Anhand des eingetragenen Standortes werden bei PVGIS die PV-Erzeugungsdaten je Stunde für ein Jahr abgerufen (Standard 2020) und mit den Verbrauchsdaten aus dem Lastprofil und verschiedenen Batteriegrößen verrechnet. Dabei wird berücksichtigt, dass der Verbrauch innerhalb einer Stunde schwankt: Kurze Lastspitzen kann die PV nur bis zu ihrer aktuellen Leistung decken, den Rest liefert der Speicher oder das Netz.',
  },
  {
    realm: 'Allgemeines',
    title: 'Wie wird die Empfehlung ermittelt',
    text: 'Empfohlen wird die Speichergröße, bei der sich die gesamte Anlage (PV und Speicher) am schnellsten amortisiert. Ein größerer Speicher erhöht zwar die Autarkie, rechnet sich aber oft nicht mehr. In der Tabelle und im Diagramm kannst du jede Größe auswählen und vergleichen.',
  },
  {
    realm: 'Allgemeines',
    title: 'Mir fehlt eine Funktion',
    text: "Wenn dir eine Funktion fehlt, dann melde dich über das <a href='https://www.akkudoktor.net/forum'>Forum von Andreas Schmitz</a> oder direkt auf der <a href='https://github.com/nick81nrw/PVTools/issues'>Quellcode-Website</a>. Gerne nehmen wir dafür auch eine Unterstützung entgegen ;-)",
  },
  {
    realm: 'Allgemeines',
    title: 'Amortisationsrechnung',
    text: 'Das Tool legt keinen besonderen Fokus auf eine Amortisationsrechnung. Finanzierungen, entgangene Rendite, Reparaturen etc. werden nicht berücksichtigt. Wenn euch der finanzielle Aspekt der PV-Anlage und deren Investition wichtig ist, übernehmt das Ergebnis (Eigenverbrauch, Einspeisung etc.) und rechnet weitere individuelle Annahmen z.B. in Excel durch.',
  },
  {
    realm: 'Eingabefelder',
    title: 'Adresse',
    text: '(Pflichtfeld) Hier kannst du eine Stadt, eine Postleitzahl oder eine komplette Adresse eingeben und mit [Suchen] bestätigen. Der erste Treffer laut OpenStreetMap wird dann verwendet. Falls die Adresse nicht stimmen sollte, einfach mehr Informationen eingeben. Daraus werden Breiten- und Längengrad ermittelt, die für die Berechnung benötigt werden.',
  },
  {
    realm: 'Eingabefelder',
    title: 'Stromverbrauch, Stromkosten und Einspeisevergütung',
    text: 'Um eine einfache Berechnung der Amortisation machen zu können, werden diese Werte benötigt. Wenn du keine Einspeisevergütung bekommst, kannst du diese auf 0 € setzen.',
  },
  {
    realm: 'Eingabefelder',
    title: 'Ausrichtung, Neigung und installierte Leistung',
    text: '(Pflichtfeld) Hier musst du mindestens eine Dachfläche eintragen und auf [Dachfläche hinzufügen] klicken. Die Ausrichtung wird als für PV-Anlagen typischer Azimut angegeben. Dabei sind -180° und 180° Norden, -90° Osten, 0° Süden und 90° Westen. Mit den Knöpfen O, SO, S, SW und W kannst du die gängigen Ausrichtungen direkt wählen. Die installierte Leistung wird in kWp angegeben.',
  },
  {
    realm: 'Eingabefelder',
    title: 'Dachflächen bearbeiten',
    text: 'Nachdem ihr mindestens eine Dachfläche eingetragen habt, könnt ihr diese mit dem Mülleimer wieder entfernen oder mit dem Stift bearbeiten.',
  },
  {
    realm: 'Eingabefelder',
    title: 'Berechnen, Zurücksetzen, Experten-Einstellungen',
    text: 'Mit Berechnen wird die Simulation ausgeführt. Der Button ist inaktiv, solange Standort oder Dachfläche fehlen. Deine Eingaben werden in deinem Browser gespeichert. Unter Experten-Einstellungen findest du vorbelegte Parameter, die du anpassen kannst, und den Knopf, um alle Eingaben zurückzusetzen.',
  },
  {
    realm: 'Erweitert',
    title: 'Wetterjahr',
    text: 'Für die PV-Erzeugung stehen bei PVGIS mehrere Jahre zur Verfügung, aktuell die Jahre 2005 bis 2023. Der Rechner berechnet immer nur ein Jahr. Wenn du genauer rechnen möchtest, solltest du die Ergebnisse mehrerer Jahre vergleichen.',
  },
  {
    realm: 'Erweitert',
    title: 'Rechenmodell',
    text: "Das Rechenmodell legt fest, wie jede Stunde zwischen PV, Speicher und Netz aufgeteilt wird. Standard ist die 'Lastverteilung': Sie berücksichtigt kurze Lastspitzen innerhalb der Stunde und wurde gegen gemessene Minuten-Lastprofile geprüft. Das Modell 'Klassisch' ist die bisherige Berechnung und bleibt zum Vergleich mit älteren Ergebnissen wählbar; es unterschätzt den Eigenverbrauch ohne Speicher und überschätzt den Nutzen eines Speichers. Beim Jahresverbrauch nutzt 'Lastverteilung' das Profil 'H0 kalibriert', 'Klassisch' wie bisher das reine H0-Profil. Das reine H0 ist sehr glatt und lässt die Autarkie um 5–6 Prozentpunkte zu hoch ausfallen. Mit eigenen Messwerten (CSV) ist die Berechnung am genauesten.",
  },
  {
    realm: 'Erweitert',
    title: 'Systemverluste',
    text: 'Diese Verluste werden von PVGIS pauschal bei der Ertragsberechnung berücksichtigt.',
  },
  {
    realm: 'Erweitert',
    title: 'Ladeeffizienz',
    text: 'Bei der Be- und Entladung wird eine nicht 100%ige Effizienz angenommen. Wenn du also 1 kWh in den Speicher laden möchtest, benötigst du dafür 1 kWh / 99 % Energie.',
  },
  {
    realm: 'Erweitert',
    title: 'Maximalleistung Wechselrichter und Speicher',
    text: 'Die AC-Leistung des Wechselrichters entspricht standardmäßig der installierten PV-Leistung und wird bei den Dachflächen angezeigt. Wenn dein Wechselrichter kleiner ist, trag in den Experten-Einstellungen einen eigenen Wert ein; was darüber liegt, wird abgeregelt und in den Details angezeigt. Der Wert bestimmt außerdem den Wirkungsgrad des Wechselrichters bei Teillast. Für den Speicher kannst du die maximale Lade- und Entladeleistung getrennt festlegen.',
  },
  {
    realm: 'Erweitert',
    title: 'Einspeisebegrenzung und Nulleinspeisung',
    text: 'Die Einspeisung kann auf eine feste Leistung (z.B. 800 W), auf einen Anteil der PV-Leistung (z.B. 60 %) oder auf null begrenzt werden. Bei Nulleinspeisung wird Überschuss nur im Speicher genutzt, der Rest wird abgeregelt. Die abgeregelte Energie wird in den Details angezeigt.',
  },
  {
    realm: 'Details',
    title: 'Daten herunterladen',
    text: "Für jede Speichergröße könnt ihr unter 'Details' die berechneten Stundenwerte herunterladen. Achtung: Die Dezimalzahlen sind mit einem Punkt anstatt eines Kommas geschrieben. Dies müsst ihr beim Import berücksichtigen (oder mit einem Texteditor alle '.' in ',' ändern).",
  },
  {
    realm: 'Erweitert',
    title: 'Eigenen Stromverbrauch nutzen',
    text: "Ihr könnt euch im Schritt 'Stromverbrauch' unter 'Eigene Messwerte' eine CSV-Vorlage herunterladen und eure stündlichen Verbräuche in Wattstunden in Spalte B einpflegen (Dezimalkomma oder -punkt). Die Werte können aus einem beliebigen Jahr stammen, z.B. 2025: Sie werden nach Monat, Tag und Stunde auf das gewählte Wetterjahr übertragen. Nach dem Hochladen seht ihr eine Vorschau mit Zeitraum, Jahresverbrauch und fehlenden Werten. Fehlende Stunden könnt ihr interpolieren, mit 0 auffüllen oder mit dem vorherigen Wert füllen; ungültige oder negative Werte werden als Fehler gemeldet.",
  },
  {
    realm: 'Fehlerbehebung',
    title: 'Irgendwas stimmt nicht',
    text: 'Nutze „Alle Eingaben zurücksetzen“ in den Experten-Einstellungen. Dann wird alles zurückgesetzt und die meisten Fehler sollten sich erledigen.',
  },
]
