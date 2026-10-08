# So rechnet PVTools

Diese Seite beschreibt die Simulation in `functions/`. Sie läuft für jede
Speichergröße einmal über alle Stunden des Jahres (8.760 bzw. 8.784 Stunden).
Alle Energien sind in Wh, alle Leistungen in W. Da ein Zeitschritt eine Stunde
lang ist, entspricht 1 W genau 1 Wh.

## Ablauf

| Schritt                                                                          | Funktion                                                               | Datei                                   |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------- |
| PV-Erzeugung je Dachfläche von PVGIS abrufen und stündlich summieren             | `fetchGeneration`, `normalizeHourlyRadiation`, `mergePowerGeneration`  | `lib/api.js`, `energyFlow.js`           |
| Verbrauch je Stunde aus Jahresverbrauch und Lastprofil H0 oder aus der CSV-Datei | `calculateConsumption`, `buildConsumption`                             | `energyFlow.js`, `consumptionImport.js` |
| Erzeugung und Verbrauch zu Stundenwerten zusammenführen                          | `generateDayTimeValues`                                                | `energyFlow.js`                         |
| Wechselrichter- und Einspeisegrenzen bestimmen                                   | `resolveLimits`                                                        | `simulation.js`                         |
| Jede Stunde berechnen, Ladezustand an die nächste Stunde weitergeben             | `simulateBatterySizes` → `energyFlow` → `calcHourWithLoadDistribution` | `simulation.js`, `energyFlow.js`        |
| Jahressummen, Monatswerte, Wirtschaftlichkeit, Energiebilanz-Prüfung             | `simulateBatterySizes`, `checkEnergyBalance`                           | `simulation.js`                         |

## Eine Stunde: `calcHourWithLoadDistribution`

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

### Unterschied zur früheren Berechnung (bis 10/2026)

Die frühere Funktion `regressionCalc` ist in `energyFlow.js` auskommentiert
erhalten. Sie hat

- die Laststufen nur bis `min(Verbrauch, PV)` gedeckt, also bis zum
  Stundenmittel statt bis zur PV-Leistung. Selbst sehr große Anlagen bezogen
  dadurch bei Sonne 20–40 % des Verbrauchs aus dem Netz. Das hat den
  Eigenverbrauch ohne Speicher unterschätzt und den Nutzen eines Speichers
  überschätzt (je nach Anlage um rund 15–25 %);
- die Laststufen nicht auf den Stundenverbrauch skaliert, oberhalb von rund
  3.000 Wh pro Stunde war ihr Mittelwert zu niedrig;
- die Wechselrichterverluste als fehlenden Verbrauch gezählt (aus Netz oder
  Speicher gedeckt) statt als zusätzlichen PV-Bedarf.

## Energiebilanz

`checkEnergyBalance` prüft jede Speichergröße über das ganze Jahr:

- PV-Erzeugung = selbst genutzt + Wechselrichterverluste + in den Speicher
  geladen + eingespeist + abgeregelt (Einspeisegrenze und Wechselrichter);
- Speicher am Anfang + geladen − Ladeverluste − entladen = Speicher am Ende;
- Verbrauch = PV direkt + aus dem Speicher + Netzbezug.

Geht eine davon nicht auf, zeigt die Oberfläche eine Warnung.

## Bekannte Vereinfachungen

- Die PV-Leistung gilt innerhalb einer Stunde als konstant, wechselnde
  Bewölkung wird nicht abgebildet.
- Der Wechselrichter-Wirkungsgrad wird nur auf den Eigenverbrauch angewendet,
  nicht auf Einspeisung und Speicherladung.
- Woher die Lastverteilungen in `regression.json` stammen, ist nicht
  dokumentiert. Sie enden bei etwa 5 kW; Wärmepumpe und E-Auto sollten später
  als eigene Verbraucher gerechnet werden.
