[![Website](https://img.shields.io/website?up_message=online&url=https%3A%2F%2Fpvtools.sektorsonne.de%2F)](https://pvtools.sektorsonne.de)

# PVTools
PV Auslegungsrechner für mit Support für
- Batteriespeicher
- Mehrere Dachflächen

## API-Foundation:
https://re.jrc.ec.europa.eu/api/v5_2/

https://re.jrc.ec.europa.eu/api/v5_2/SHScalc?lat=45&lon=8&outputformat=json&peakpower=10&batterysize=50&consumptionday=200&cutoff=40

Dokumentation:

https://joint-research-centre.ec.europa.eu/pvgis-photovoltaic-geographical-information-system/getting-started-pvgis/api-non-interactive-service_en

Frontend fragt Backend an mit:

Anfrage Body:
- Link für die Abfrage
- Body für die Abfrage
- HTTP Method


Backend nimmt die Daten und fragt bei "Link" mit "Body" an

Backend schickt Antwort von "Link" an Frontend zurück
