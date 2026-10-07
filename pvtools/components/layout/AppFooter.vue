<template>
  <footer class="mt-16 border-t border-line bg-surface/60">
    <div class="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
      <div>
        <div class="flex items-center gap-2">
          <img src="/logo.svg" alt="" class="h-6 w-6" />
          <span class="font-display font-bold">PVTools</span>
        </div>
        <p class="mt-3 text-sm text-muted">
          Open-Source-Rechner für Batteriespeicher an PV-Anlagen. Entstanden in
          der Community rund um den
          <a
            href="https://akkudoktor.net"
            target="_blank"
            rel="noopener"
            class="text-brand hover:underline"
            >Akkudoktor</a
          >.
        </p>
      </div>
      <div class="text-sm">
        <div class="label-mono mb-3">// links</div>
        <ul class="space-y-2">
          <li>
            <a
              class="inline-flex items-center gap-2 hover:text-brand"
              href="https://www.youtube.com/watch?v=FKSDynkXchY"
              target="_blank"
              rel="noopener"
              ><Youtube class="h-4 w-4" /> Video: Wie viel spare ich mit einem
              Speicher?</a
            >
          </li>
          <li>
            <a
              class="inline-flex items-center gap-2 hover:text-brand"
              href="https://www.akkudoktor.net/forum"
              target="_blank"
              rel="noopener"
              ><MessagesSquare class="h-4 w-4" /> Akkudoktor-Forum</a
            >
          </li>
          <li>
            <a
              class="inline-flex items-center gap-2 hover:text-brand"
              href="https://github.com/nick81nrw/PVTools"
              target="_blank"
              rel="noopener"
              ><Github class="h-4 w-4" /> Quellcode &amp; Issues</a
            >
          </li>
        </ul>
      </div>
      <div class="text-sm">
        <div class="label-mono mb-3">// rechtliches</div>
        <ul class="space-y-2">
          <li>
            <RouterLink class="hover:text-brand" to="/impress"
              >Impressum &amp; Datenschutz</RouterLink
            >
          </li>
          <li>
            <RouterLink class="hover:text-brand" to="/consumptionProfiles"
              >Lastprofile</RouterLink
            >
          </li>
        </ul>
        <p class="mt-4 font-mono text-xs text-muted">
          Daten: PVGIS © European Union · Geocoding: © OpenStreetMap
        </p>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { Github, MessagesSquare, Youtube } from 'lucide-vue-next'
</script>
