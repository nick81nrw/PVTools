# So rechnet PVTools

Diese Seite beschreibt die Simulation in `functions/`. Sie läuft für jede
Speichergröße einmal über alle Stunden des Jahres (8.760 bzw. 8.784 Stunden).
Alle Energien sind in Wh, alle Leistungen in W. Da ein Zeitschritt eine Stunde
lang ist, entspricht 1 W genau 1 Wh.

## Ablauf

| Schritt                                                                                             | Funktion                                                                                      | Datei                                            |
| --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| PV-Erzeugung je Dachfläche von PVGIS abrufen, von UTC in Ortszeit umrechnen und stündlich summieren | `fetchGeneration`, `normalizeHourlyRadiation`, `shiftUtcToGermanTime`, `mergePowerGeneration` | `lib/api.js`, `energyFlow.js`                    |
| Verbrauch je Stunde aus Jahresverbrauch und dem Lastprofil des Rechenmodells oder aus der CSV-Datei | `getConsumptionProfile(id).build`, `buildConsumption`                                         | `consumptionProfiles.js`, `consumptionImport.js` |
| Erzeugung und Verbrauch zu Stundenwerten zusammenführen                                             | `generateDayTimeValues`                                                                       | `energyFlow.js`                                  |
| Wechselrichter- und Einspeisegrenzen bestimmen                                                      | `resolveLimits`                                                                               | `simulation.js`                                  |
| Jede Stunde mit dem gewählten Rechenmodell berechnen, Ladezustand an die nächste Stunde weitergeben | `simulateBatterySizes` → `energyFlow` → `getHourModel(id).calculate`                          | `simulation.js`, `energyFlow.js`, `hourModels/`  |
| Jahressummen, Monatswerte, Wirtschaftlichkeit, Energiebilanz-Prüfung                                | `simulateBatterySizes`, `checkEnergyBalance`                                                  | `simulation.js`                                  |

## Rechenmodelle

Wie eine einzelne Stunde zwischen PV, Speicher und Netz aufgeteilt wird,
bestimmt das **Rechenmodell**. Es ist in den Experten-Einstellungen wählbar.

| Modell                                       | Datei                            | Lastprofil    |                                   |
| -------------------------------------------- | -------------------------------- | ------------- | --------------------------------- |
| `loadDistribution` – Lastverteilung          | `hourModels/loadDistribution.js` | H0 kalibriert | Standard, siehe unten             |
| `legacyRegression` – Klassisch (bis 10/2026) | `hourModels/legacyRegression.js` | H0 (BDEW)     | frühere Berechnung, zum Vergleich |

Alle Modelle haben dieselbe Schnittstelle (Parameter, Ergebnis und die
Energiebilanz je Stunde sind in `hourModels/index.js` beschrieben). Gemeinsame
Hilfsfunktionen (Speicher laden, Wechselrichter-Wirkungsgrad, Ersatzverteilung)
liegen in `hourModels/shared.js`.

Jedes Modell nennt in `consumptionProfile` das Lastprofil, mit dem es
abgestimmt ist (siehe [Lastprofile](#lastprofile)). Es wird nur im Modus
„Jahresverbrauch“ verwendet; eigene Messwerte (CSV) gehen unverändert in die
Rechnung ein. So liefert „Klassisch“ weiterhin genau die früheren Ergebnisse.

### Ein weiteres Modell hinzufügen

1. Neue Datei in `hourModels/` mit einer Funktion, die die Schnittstelle aus
   `hourModels/index.js` erfüllt.
2. In `HOUR_MODELS` (`hourModels/index.js`) mit `id`, `label`, `description`,
   `calculate` und `consumptionProfile` eintragen.
3. Fertig: Die Auswahl in der Oberfläche und die Tests in
   `hourModels/hourModels.test.js` (Grenzfälle, ein ganzes Jahr mit
   Energiebilanz) laufen automatisch auch für das neue Modell.

## Modell „Lastverteilung“: `calcHourWithLoadDistribution`

### Warum eine Lastverteilung?

Ein Haushalt mit 500 Wh in einer Stunde zieht nicht gleichmäßig 500 W. Meist
sind es ein paar hundert Watt, für einige Minuten laufen Wasserkocher oder Herd
mit mehreren Kilowatt. Eine reine Stundenbilanz („500 Wh Verbrauch, 1.000 Wh
PV, also alles gedeckt“) überschätzt deshalb den Eigenverbrauch.

PVTools nutzt darum für jede Stunde eine **Lastverteilung**: Sie gibt an,
welchen Anteil der Stunde der Haushalt mit welcher Leistung läuft. Die
Verteilungen liegen in `regression.json` (Schlüssel = Stundenverbrauch, auf
50 Wh abgerundet; Werte = Leistungsstufe in 50-W-Schritten → Anteil der
Stunde). Oberhalb der Datenbank (ab 3.500 Wh pro Stunde) erzeugt
`createRegression` eine Ersatzverteilung.

### Rechenschritte

1. **Laststufen skalieren.** Jede Stufe `i` hat eine Leistung `L_i` (Mitte des
   50-W-Schritts) und einen Zeitanteil `w_i` (Summe 1). Die Stufen werden so
   skaliert, dass ihr Mittelwert genau dem Stundenverbrauch `E` entspricht:
   `L_i = (P_i + 25 W) · E / Σ w_j (P_j + 25 W)`.
2. **PV deckt jede Laststufe bis zu ihrer AC-Leistung.** Die PV-Leistung ist
   innerhalb der Stunde konstant. Der Wechselrichter liefert höchstens
   `PV · η` (Wirkungsgrad `η` je nach Auslastung, `calcInverterEfficiency`):
   `PV-Anteil_i = min(L_i, PV · η)`, selbst genutzt `= Σ w_i · PV-Anteil_i`.
   Die dafür nötige DC-Energie ist `selbst genutzt / η`, die Differenz sind die
   Wechselrichterverluste.
3. **Den Rest der Laststufen soll der Speicher liefern**, begrenzt durch seine
   Entladeleistung: `Bedarf = Σ w_i · min(L_i − PV-Anteil_i, Entladeleistung)`.
   Er liefert das, soweit sein Ladezustand über dem Minimum liegt; dabei
   gehen die Entladeverluste ab.
4. **PV-Überschuss** (`PV − DC-Energie für den Eigenverbrauch`) lädt den
   Speicher (`chargeBattery`: freie Kapazität, Ladeleistung, Ladeverluste).
   Was nicht passt, wird eingespeist; oberhalb der Einspeisegrenze wird
   abgeregelt.
5. **Netzbezug** ist der Teil des Verbrauchs, den weder PV noch Speicher
   decken.

Laden und Entladen in derselben Stunde ist gewollt: Der Speicher deckt die
Lastspitzen, während der PV-Überschuss der ruhigen Minuten ihn lädt.

### Beispiel

500 Wh Verbrauch, 1.000 Wh PV, Wechselrichter mit 6 kW. Bei rund 17 %
Auslastung arbeitet der Wechselrichter mit `η = 91 %`, liefert also höchstens
910 W.

- Die Lastverteilung für 500 Wh hat den Mittelwert 523,5 W, die Stufen werden
  mit dem Faktor 0,955 auf 500 Wh skaliert. Die meiste Zeit liegt die Last bei
  400–600 W, in 6,8 % der Stunde über 910 W.
- **Ohne Speicher:** PV deckt 442,2 Wh direkt (dafür 485,8 Wh DC, also
  43,6 Wh Wechselrichterverluste). 57,8 Wh der Lastspitzen kommen aus dem Netz,
  514,3 Wh werden eingespeist.
- **Mit Speicher** (3.000 Wh geladen, Minimum 500 Wh, je 95 % Wirkungsgrad):
  Der Speicher gibt für die Spitzen 57,8 Wh ab, davon kommen 54,9 Wh beim
  Verbraucher an. Nur 2,9 Wh kommen aus dem Netz. Der Überschuss von 514,3 Wh
  lädt den Speicher auf 3.430,7 Wh, eingespeist wird nichts.

### Unterschied zum Modell „Klassisch“

Das klassische Modell (`regressionCalc`, die Berechnung bis 10/2026)

- deckt die Laststufen nur bis `min(Verbrauch, PV)`, also bis zum
  Stundenmittel statt bis zur PV-Leistung. Selbst sehr große Anlagen beziehen
  dadurch bei Sonne 20–40 % des Verbrauchs aus dem Netz;
- skaliert die Laststufen nicht auf den Stundenverbrauch, oberhalb von rund
  3.000 Wh pro Stunde ist ihr Mittelwert zu niedrig;
- zählt die Wechselrichterverluste als fehlenden Verbrauch (aus Netz oder
  Speicher gedeckt) statt als zusätzlichen PV-Bedarf.

## Lastprofile

Im Modus „Jahresverbrauch“ verteilt ein Lastprofil den Jahresverbrauch auf die
Stunden des Jahres (`consumptionProfiles.js`). Weitere Profile lassen sich wie
die Rechenmodelle über `CONSUMPTION_PROFILES` ergänzen.

| Profil        | `id`           | genutzt von    |
| ------------- | -------------- | -------------- |
| H0 (BDEW)     | `h0`           | Klassisch      |
| H0 kalibriert | `h0Calibrated` | Lastverteilung |

### H0 (BDEW)

Das Standardlastprofil H0 mit Dynamisierung (`SLP.js`, `factorFunction`). Es
ist der Durchschnitt sehr vieler Haushalte und deshalb sehr glatt: Mittags
läuft immer etwas, es gibt keine Tage, an denen niemand zu Hause ist. Dadurch
passt der Verbrauch besser zur PV-Erzeugung als bei einem echten Haushalt, die
Autarkie fällt um 5–6 Prozentpunkte zu hoch aus (siehe Abgleich unten).

### H0 kalibriert: `addVariability`

H0 mit einer festen, reproduzierbaren Schwankung von Stunde zu Stunde:

1. Eine korrelierte Zufallsreihe `x` (AR(1)-Prozess) über alle Stunden des
   Jahres: `x = ρ · x_vorher + √(1 − ρ²) · z`, `z` standardnormalverteilt.
   Mit `ρ = 0,75` dauern ruhige und lebhafte Phasen einige Stunden, wie bei
   einem echten Haushalt.
2. Jede Stunde wird mit `exp(σ · x)` multipliziert, `σ = 1,0`.
3. Die Stunden jedes Tages werden so skaliert, dass der Tag seinen Verbrauch
   aus H0 behält. Jahresverbrauch, Jahreszeiten, Wochentage und Feiertage
   bleiben also wie bei H0, nur die Verteilung innerhalb des Tages schwankt.

Die Zufallszahlen kommen aus einem festen Startwert (`seed = 1`,
Generator mulberry32), dieselbe Eingabe ergibt immer dasselbe Ergebnis. `σ`
und `ρ` (`H0_VARIABILITY`) wurden so gewählt, dass das Modell
„Lastverteilung“ die Minuten-Referenz unten trifft. Die Schwankung gleicht
dabei auch aus, dass H0 um die Mittagszeit einen etwas zu hohen Anteil hat.

## Abgleich mit gemessenen Lastprofilen

Beide Modelle wurden gegen gemessene Lastprofile von Einfamilienhäusern
(1-Minuten-Werte eines Jahres) geprüft. Referenz ist eine minutengenaue
Simulation mit den echten Lastgängen; die PV (Köln, Süd 30°, PVGIS 2010) ist
dabei innerhalb jeder Stunde konstant. Getestet wurde an 37 Haushalten.

PV 2,4 kWp und Speicher 1 kWh je MWh Jahresverbrauch (entspricht 12 kWp und
5 kWh bei 5.000 kWh), Mittelwert der Haushalte:

| Rechenweg                                        | Autarkie ohne Speicher | mit Speicher | Speichergewinn |
| ------------------------------------------------ | ---------------------- | ------------ | -------------- |
| **Referenz: Minutenwerte**                       | **37,5 %**             | **66,2 %**   | **28,7 pp**    |
| Lastverteilung, echte Stundenwerte des Haushalts | 37,0 %                 | 65,8 %       | 28,8 pp        |
| Klassisch, echte Stundenwerte des Haushalts      | 30,8 %                 | 65,2 %       | 34,5 pp        |
| Lastverteilung, Lastprofil H0 kalibriert         | 37,9 %                 | 66,4 %       | 28,5 pp        |
| Lastverteilung, Lastprofil H0                    | 43,1 %                 | 72,2 %       | 29,0 pp        |
| Klassisch, Lastprofil H0                         | 35,7 %                 | 71,5 %       | 35,8 pp        |

Bei 1 kWp je MWh: Referenz 29,9 % / 53,0 % / 23,1 pp, Lastverteilung mit
echten Stundenwerten 29,3 % / 52,7 % / 23,5 pp, mit H0 kalibriert
29,9 % / 53,1 % / 23,2 pp.

Die Parameter von „H0 kalibriert“ wurden an einer Hälfte der Haushalte
bestimmt, die Tabelle zeigt die andere Hälfte. Über sechs Kombinationen
(1 / 2,4 / 4 kWp je MWh, ohne und mit 1–2 kWh je MWh Speicher) liegt die
Abweichung zur Referenz bei höchstens 0,7 Prozentpunkten. Mit einem anderen
Startwert der Zufallsreihe schwankt das Ergebnis um etwa ±0,5 Prozentpunkte.

Ergebnis:

- Mit gemessenen Stundenwerten (CSV-Import) trifft das Modell
  „Lastverteilung“ die Minuten-Referenz auf etwa 0,5 Prozentpunkte genau,
  auch beim Speichergewinn.
- Das klassische Modell überschätzt den Speichergewinn um rund 25 %.
- Mit dem reinen Standardlastprofil H0 liegt die Autarkie um
  5–6 Prozentpunkte zu hoch (mit und ohne Speicher), weil H0 der glatte
  Durchschnitt vieler Haushalte ist. Das Modell „Lastverteilung“ nutzt deshalb
  „H0 kalibriert“ und liegt damit weniger als 1 Prozentpunkt neben der
  Referenz.
- Echte Haushalte streuen stark: Bei gleicher Anlage reicht die Autarkie ohne
  Speicher von 25,6 % bis 46,9 % (Median 37,5 %).

## Energiebilanz

`checkEnergyBalance` prüft jede Speichergröße über das ganze Jahr:

- PV-Erzeugung = selbst genutzt + Wechselrichterverluste + in den Speicher
  geladen + eingespeist + abgeregelt (Einspeisegrenze und Wechselrichter);
- Speicher am Anfang + geladen − Ladeverluste − entladen = Speicher am Ende;
- Verbrauch = PV direkt + aus dem Speicher + Netzbezug.

Geht eine davon nicht auf, zeigt die Oberfläche eine Warnung.

## Wirtschaftlichkeit des Speichers: `batteryEconomics.js`

### Speicherpreis

`batteryPrice(size, input)` liefert den Preis eines Speichers:

- **Richtwert** (`batteryPriceMode: 'perKwh'`): Grundkosten + Preis je kWh ×
  Größe. Die Grundkosten fallen einmal an (z. B. Installation,
  Batterie-Wechselrichter). Vorbelegt sind 1.000 € + 400 €/kWh.
- **Eigene Angebote** (`'offers'`, hat Vorrang): Größe und Preis je Angebot.
  Verglichen werden dann genau diese Größen. Für Größen dazwischen wird
  linear interpoliert.

### Grenznutzen jeder Speicherstufe

Die Amortisation eines ganzen Speichers gegenüber „ohne Speicher“ kann gut
aussehen, obwohl die letzten kWh kaum noch etwas bringen. `batterySteps`
vergleicht deshalb jede Größe mit der nächstkleineren:

```
Mehrkosten        = Preis(größer) − Preis(kleiner)
weniger Netzbezug = Netzbezug(kleiner) − Netzbezug(größer)
Mehrnutzen/Jahr   = Ersparnis(größer) − Ersparnis(kleiner)
                  = weniger Netzbezug × Strompreis
                    − weniger Einspeisung × Einspeisevergütung
Amortisation      = Mehrkosten / Mehrnutzen/Jahr  (∞ bei Mehrnutzen ≤ 0)
```

### Bewertung (`rate`)

Maßstab ist die Lebensdauer des Speichers (Standard 15 Jahre, in den
Experten-Einstellungen änderbar):

| Bewertung | Amortisation                        |
| --------- | ----------------------------------- |
| Ja        | höchstens ⅔ der Lebensdauer (10 J.) |
| Grenzfall | höchstens die Lebensdauer (15 J.)   |
| Nein      | länger oder nie                     |

### Empfehlung (`recommendBattery`)

Ausgehend von „ohne Speicher“ wird zur kleinsten größeren Speichergröße
gewechselt, deren Erweiterung mit „Ja“ bewertet ist. Das wiederholt sich, bis
keine größere Stufe mehr lohnt. Eine Größe kann dabei übersprungen werden, wenn
sich erst der größere Schritt lohnt (z. B. wegen hoher Grundkosten).
`recommendationSentences` formuliert daraus die Empfehlung, z. B.:

> Die ersten 5 kWh Speicher sparen 1.443 kWh Netzbezug im Jahr und
> amortisieren sich nach 9 Jahren. Die Erweiterung von 5 auf 10 kWh bringt nur
> noch 609 kWh und amortisiert sich nach 14,1 Jahren – ein Grenzfall.

Nicht berücksichtigt sind Finanzierung, entgangene Zinsen, Alterung des
Speichers und steigende Strompreise.

## Bekannte Vereinfachungen

- Die PV-Leistung gilt innerhalb einer Stunde als konstant, wechselnde
  Bewölkung wird nicht abgebildet.
- Der Wechselrichter-Wirkungsgrad wird nur auf den Eigenverbrauch angewendet,
  nicht auf Einspeisung und Speicherladung.
- Woher die Lastverteilungen in `regression.json` stammen, ist nicht
  dokumentiert; der Abgleich oben zeigt aber, dass sie gut passen. Sie enden
  bei etwa 5 kW; Wärmepumpe und E-Auto sollten später als eigene Verbraucher
  gerechnet werden.
- „H0 kalibriert“ trifft den Durchschnitt der Haushalte, nicht den
  einzelnen Haushalt: Je nach Lebensgewohnheiten liegt die Autarkie eines
  echten Haushalts rund 10 Prozentpunkte darüber oder darunter. Eigene
  Messwerte (CSV) sind am genauesten.
- „Klassisch“ nutzt weiterhin das reine H0 und überschätzt damit die
  Autarkie um 5–6 Prozentpunkte (siehe oben).
