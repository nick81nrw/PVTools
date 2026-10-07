<template>
  <div>
    <b-button v-b-toggle.collapseFaq>FAQs und News</b-button>
    <b-collapse id="collapseFaq">
      <b-card v-for="realm in getRealms()" :key="realm">
        <h3>{{ realm }}</h3>
        <div
          class="card-header p-1"
          role="tab"
          v-for="(faq, i) in getFaqs(realm)"
          :key="i"
        >
          <b-button
            class="w-100"
            variant="info"
            :aria-expanded="openFaq === realm + i"
            @click="openFaq = openFaq === realm + i ? null : realm + i"
            >{{ faq.title }}</b-button
          >
          <b-collapse :model-value="openFaq === realm + i" role="tabpanel">
            <div class="card-body">
              <p class="card-text"><span v-html="faq.text"></span></p>
            </div>
          </b-collapse>
        </div>
      </b-card>
    </b-collapse>
  </div>
</template>

<script>
export default {
  name: 'FAQ',
  data() {
    return {
      openFaq: null,
      faqs: [
        {
          realm: 'Neuigkeiten',
          title: 'Bessere Berechnung und Datendownload (11/23)',
          text: "In die Berechnung haben wir 'Ungenauigkeiten' beim Stromverbrauch eingebaut, damit werden Verbrauchsschwankungen auf Grundlage des aktuellen Verbrauchs simuliert. Zudem haben wir je nach Leistung des Wechselrichters eine Wirkungsgrad-Kennlinie hinterlegt und berechnen diese ein. Beides führt dazu, dass sich der Eigenverbrauch reduziert und damit näher an den tatsächlichen Wert herankommt. Zudem können nun die Ergebnisse als CSV-Datei heruntergeladen und weiterverarbeitet werden. ACHTUNG: Die Dezimalzahlen haben einen Punkt anstatt eines Kommas, das müsst ihr beim Import in Excel berücksichtigen.",
        },
        {
          realm: 'Neuigkeiten',
          title: 'Eigenen Verbrauch nutzen (09/23)',
          text: "Es ist nun möglich, den eigenen Verbrauch in die Berechnung einfließen zu lassen. Wie das geht, könnt ihr in den FAQs unter 'Erweitert' nachlesen.",
        },
        {
          realm: 'Allgemeines',
          title: 'Woher kommen die Daten',
          text: 'Die Berechnung basiert auf Daten von PVGIS, einem kostenlosen Tool der Europäischen Kommission zur Ermittlung von Strahlungsdaten. Dieses Tool stellt auch einige kostenlose Schnittstellen bereit, die wir nutzen. Zusätzlich wurde für den Stromverbrauch das Standardlastprofil H0 des BDEW verwendet und auf den eingetragenen Jahresstromverbrauch hochgerechnet.',
        },
        {
          realm: 'Allgemeines',
          title: 'Wie funktioniert die Berechnung',
          text: 'Anhand des eingetragenen Standortes werden bei PVGIS die PV-Erzeugungsdaten je Stunde für ein Jahr abgerufen (Standard 2020) und mit den Verbrauchsdaten aus dem Lastprofil und verschiedenen Batteriegrößen verrechnet.',
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
          text: '(Pflichtfeld) Hier kannst du eine Stadt, eine Postleitzahl oder eine komplette Adresse eingeben und mit [Suche nach Adresse] suchen. Der erste Treffer laut OpenStreetMap wird dann verwendet. Falls die Adresse nicht stimmen sollte, einfach mehr Informationen eingeben. Daraus werden Breiten- und Längengrad ermittelt, die für die Berechnung benötigt werden.',
        },
        {
          realm: 'Eingabefelder',
          title: 'Stromverbrauch, Stromkosten und Einspeisevergütung',
          text: 'Um eine einfache Berechnung der Amortisation machen zu können, werden diese Werte benötigt. Wenn du keine Einspeisevergütung bekommst, kannst du diese auf 0 € setzen.',
        },
        {
          realm: 'Eingabefelder',
          title: 'Ausrichtung, Neigung und installierte Leistung',
          text: '(Pflichtfeld) Hier musst du mindestens eine Ausrichtung/ein Dach eintragen und auf [Ausrichtung zur Berechnung hinzufügen] klicken. Die Ausrichtung wird als für PV-Anlagen typischer Azimut angegeben. Dabei sind -180° und 180° Norden, -90° Osten, 0° Süden und 90° Westen. Die installierte Leistung wird in Watt-Peak angegeben (10 kWp = 10000 Wp).',
        },
        {
          realm: 'Eingabefelder',
          title: 'Bearbeiten der Ausrichtungen',
          text: 'Nachdem ihr mindestens eine Ausrichtung eingetragen habt, könnt ihr diese mit dem Mülleimer wieder entfernen oder mit dem Stift bearbeiten.',
        },
        {
          realm: 'Eingabefelder',
          title: 'Berechnen/Zurücksetzen/Erweiterte Einstellungen',
          text: 'Mit Berechnen wird die Berechnung ausgeführt. Der Button ist inaktiv, wenn du die Pflichtfelder nicht ausgefüllt hast. Mit Zurücksetzen werden deine eingegebenen und damit gespeicherten Daten gelöscht. Unter Erweiterte Einstellungen findest du vorbelegte Parameter, die du anpassen kannst.',
        },
        {
          realm: 'Erweitert',
          title: 'Vergleichsjahr',
          text: 'Für die PV-Erzeugung stehen bei PVGIS mehrere Jahre zur Verfügung, aktuell die Jahre 2005 bis 2023. Der Rechner berechnet immer nur ein Jahr. Wenn du genauer rechnen möchtest, solltest du die Ergebnisse mehrerer Jahre vergleichen.',
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
          title: 'Maximalleistung Wechselrichter/Speicher',
          text: 'Wenn du mehr PV-Leistung hast, als der Wechselrichter nutzen kann, kannst du damit die max. Leistung festlegen. Die Ergebnisse werden in den Details angezeigt. Das gilt beim Speicher genauso. NEU 11/23: Dieser Wert wird genutzt, um einen Wirkungsgrad zu ermitteln, deshalb ist er standardmäßig auf 5000 W gesetzt.',
        },
        {
          realm: 'Erweitert',
          title: 'Maximale Netzeinspeisung',
          text: 'Diese Einstellung kann für die 70%-Regel in Deutschland genutzt werden. Die Ergebnisse werden in den Details angezeigt.',
        },
        {
          realm: 'Details',
          title: 'Daten herunterladen',
          text: "Je berechneter Batteriegröße könnt ihr die berechneten Daten herunterladen. Achtung: Die Dezimalzahlen sind mit einem Punkt anstatt eines Kommas geschrieben. Dies müsst ihr beim Import berücksichtigen (oder mit einem Texteditor alle '.' in ',' ändern).",
        },
        {
          realm: 'Erweitert',
          title: 'Eigenen Stromverbrauch nutzen',
          text: "Ihr könnt euch unter 'Erweiterte Einstellungen' eine CSV-Vorlage herunterladen und eure stündlichen Verbräuche in Wattstunden in Spalte B einpflegen. Die Spalte A muss so bleiben. Außerdem könnt ihr auswählen, gegen welches Jahr ihr euren Verbrauch berechnen wollt, Standard ist 2020. Wenn ihr keine Daten aus dem Jahr habt, ist das nicht schlimm. Das Jahr betrifft nur die Sonneneinstrahlung. Ihr könnt also auch eure Verbrauchsdaten von z.B. 2022 eingeben und gegen das Jahr 2020 rechnen lassen.",
        },
        {
          realm: 'Fehlerbehebung',
          title: 'Irgendwas stimmt nicht',
          text: 'Nutze den Zurücksetzen-Knopf. Dann wird alles zurückgesetzt und die meisten Fehler sollten sich erledigen.',
        },
      ],
    }
  },
  methods: {
    getRealms() {
      return this.faqs.reduce(
        (prev, curr) =>
          prev.includes(curr.realm) ? prev : [...prev, curr.realm],
        [],
      )
    },
    getFaqs(realm) {
      return this.faqs.filter((faq) => faq.realm == realm)
    },
  },
}
</script>
