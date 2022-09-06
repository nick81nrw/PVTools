<template>
    <div> 
        <b-button v-b-toggle.collapseFaq>FAQs</b-button>
        <b-collapse id="collapseFaq">
            <b-card v-for="realm in getRealms()" v-bind:key="realm">
                <h3>{{realm}}</h3>
                <!-- <b-card v-for="(faq,i) in getFaqs(realm)" v-bind:key="i"> -->
                    <b-card-header header-tag="header" class="p-1" role="tab" v-for="(faq,i) in getFaqs(realm)" v-bind:key="i">

                        <b-button block v-b-toggle="realm + i" variant="info">{{faq.title}}</b-button>
                        <b-collapse :id="realm +i" accordion="my-accordion" role="tabpanel">
                            <b-card-body>
                                <b-card-text>{{faq.text}}</b-card-text>
                            </b-card-body>
                        </b-collapse>
                    </b-card-header>
                <!-- </b-card> -->
            </b-card>
        </b-collapse>
    </div>
</template>
  
  <script>
  export default {
    name: 'FAQ',
    data() {
      return {
        faqs: [
            {realm:"Allgemeines",
            title:"Woher kommen die Daten",
            text:"Die Berechnung basiert auf Daten von PVGis, einem kostenlosen Tool der Europäischen Kommision zur ermittlung von Strahlungsdaten. Dieses Tool stellt auch einige kostenlose Schnittstellen bereit die wir nutzen. Zusätzlich wurde für den Stromverbrauch das Standardlastprofil H0 des BDEW verwendet und auf den eingetragenen Jahresstromverbrauch errechnet"},
            {realm:"Allgemeines",
            title:"Wie funktioniert die Berechnung",
            text:"Anhand des eingetragenen Standortes werden bei PVGis die PV-Erzeugungsdaten je Stunde für ein Jahr abgeholt (Standard 2020) und mit den Verbrauchsdaten aus dem Lastprofil und verschiedene Batteriegrößen verrechnet."},
            {realm:"Allgemeines",
            title:"Mir fehlt eine Funktion",
            text:"Wenn dir eine Funktion fehlt, dann melde dich über das Forum von Andreas Schmitz (forum.drbacke.de). Gerne nehmen wir dafür auch eine Untersützung entgegen ;-)"},
            {realm:"Eingabefelder",
            title:"Adresse",
            text:"(Pflichtfeld) Hier kannst du eine Stadt, einer Postleitzahl oder eine Komplette Adresse eingeben. Der erste Treffer laut openstreetmap wird dann verwendet. Falls die Adresse nicht stimmen sollte, einfach mehr Informationen eingeben. Daraus wird der Breiten- und Längengrad ermittelt welche für die Berechnung benötigt wird."},
            {realm:"Eingabefelder",
            title:"Stromverbrauch, Stromkosten und Einspeisevergütung",
            text:"Um eine einfache Berechnung der Amortisation machen zu können, werdend iese Werte benötigt. Wenn du keine Einspeisevergütung bekommst, kannst du diese auf 0€ setzen."},
            {realm:"Eingabefelder",
            title:"Ausrichtung, Neigung und installierte Leistung",
            text:"(Pflichtfeld) Hier musst du mindestens eine Ausrichtung/Dach eintragen und auf [Ausrichtung zur Berechnung hinzufügen] klicken. Die Ausrichtung wird in den PV-Anlagen typischen Azimuth angegeben. Dabei is -180 und 180° Norden, -90° Azimuth genau Osten, 0° Süden und 90° Westen."},
            {realm:"Eingabefelder",
            title:"Bearbeiten der Ausrichtungen",
            text:"Nachdem ihr mindestens eine Ausrichtung eingetragen habt, könnt ihr diese mit dem Mülleimer wieder entfernen oder mit dem Stift bearbeiten."},
            {realm:"Eingabefelder",
            title:"Berechnen/Zurücksetzen/Erweiterte Einstellungen",
            text:"Mit Berechnen wird die Berechnung ausgeführt. Der Button ist inaktiv, wenn du die Pflichfelder nicht gefüllt hast. Mit Zurücksetzen werden deine eingegebenen und damit gespeicherten Daten gelöscht. Unter Erweiterte Einstellungen findest du vorbelegte Parameter, die du anpassen kannst"},
            {realm:"Erweitert",
            title:"Vergleichsjahr",
            text:"Für die PV Erzegung stehen bei PVGis mehrere Jahre zur Verfügung. 2020 ist das aktuellste Jahr. In dem Rechner wird immer nur ein Jahr berechnet, wenn man genauer rechnen möchte, solltest du die Ergebnisse von mehreren Jahren vergleichen."},
            {realm:"Erweitert",
            title:"Systemverluste",
            text:"Diese Verluste werden von PVGis pauschal bei der Ertragsberechnung berücksichtigt."},
            {realm:"Erweitert",
            title:"Ladeeffizienz",
            text:"Bei der Be- und Entladung wird eine nicht 100%ige Effizienz angenommen. Wenn du also 1kWh in den Speicher laden möchstest, benötigst du dafür 1kWh/99% Energie."},
            {realm:"Erweitert",
            title:"Maximalleistung Wechselrichter/Speicher",
            text:"Wenn du mehr PV Leistung hast als der Wechselrichter nutzen kann, kannst du damit die max. Leistung festlegen. Die Ergebnisse werden in den Details angezeigt. Das gilt bei dem Speicher genau so."},
            {realm:"Erweitert",
            title:"Maximale Netzeinspeisung",
            text:"Diese Einstellung kann für die 70%-Regel in Deutschland genutzt werden. Die Ergebnisse werden in den Details angezeigt."},
            {realm:"Fehlerbehebung",
            title:"Irgendwas stimmt nicht",
            text:"Nutze den Zurücksetzen knopf. dann wird alles zurückgesetzt und die meisten Fehler sollten sich erledigen."},
        ]
      }
    },
    methods:{
        getRealms(){
            return this.faqs.reduce((prev, curr) => prev.includes(curr.realm) ?  prev: [...prev,curr.realm],[])
        },
        getFaqs(realm){
            return this.faqs.filter(faq => faq.realm == realm)
        },
        toggleCollapses(id) {
            this.$root.$emit('bv::toggle::collapse', id)
        }
    }
  }
  </script>