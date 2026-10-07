<template>
  <header
    class="sticky top-0 z-30 border-b border-white/10 bg-[#0a0e0c]/95 text-[#e4ece7] backdrop-blur"
  >
    <div class="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6">
      <RouterLink to="/" class="flex items-center gap-2.5">
        <img src="/logo.svg" alt="" class="h-7 w-7" />
        <span class="font-display text-lg font-bold tracking-tight">
          PVTools
        </span>
        <span class="hidden font-mono text-xs text-[#4ade6b] sm:inline">
          // speicherrechner
        </span>
      </RouterLink>

      <nav class="ml-auto flex items-center gap-1 text-sm">
        <a
          href="/#faq"
          class="hidden rounded-md px-2.5 py-1.5 text-white/70 hover:bg-white/10 hover:text-white md:inline"
          >FAQ</a
        >
        <a
          href="https://www.akkudoktor.net/forum"
          target="_blank"
          rel="noopener"
          class="hidden rounded-md px-2.5 py-1.5 text-white/70 hover:bg-white/10 hover:text-white md:inline"
          >Forum</a
        >
        <a
          href="https://github.com/nick81nrw/PVTools"
          target="_blank"
          rel="noopener"
          class="rounded-md p-2 text-white/70 hover:bg-white/10 hover:text-white"
          title="Quellcode auf GitHub"
        >
          <Github class="h-4 w-4" />
        </a>
        <button
          type="button"
          class="rounded-md p-2 text-white/70 hover:bg-white/10 hover:text-white"
          :title="themeTitle"
          :aria-label="themeTitle"
          @click="cycle"
        >
          <component :is="themeIcon" class="h-4 w-4" />
        </button>
        <SupportButton class="ml-1" />
      </nav>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { Github, Monitor, Moon, Sun } from 'lucide-vue-next'

import { useTheme } from '../../composables/useTheme.js'
import SupportButton from './SupportButton.vue'

const { preference, cycle } = useTheme()

const themeIcon = computed(
  () => ({ system: Monitor, light: Sun, dark: Moon })[preference.value],
)
const themeTitle = computed(
  () =>
    ({
      system: 'Design: wie System (klicken für hell)',
      light: 'Design: hell (klicken für dunkel)',
      dark: 'Design: dunkel (klicken für System)',
    })[preference.value],
)
</script>
