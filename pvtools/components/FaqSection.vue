<template>
  <section id="faq" class="scroll-mt-20">
    <div class="label-mono">// faq &amp; news</div>
    <h2 class="mt-1 font-display text-2xl font-bold">Fragen &amp; Antworten</h2>
    <div class="mt-6 grid gap-x-8 gap-y-6 md:grid-cols-2">
      <div v-for="group in groups" :key="group.realm">
        <h3 class="mb-2 font-mono text-xs tracking-wider text-brand uppercase">
          {{ group.realm }}
        </h3>
        <div class="card divide-y divide-line">
          <details
            v-for="faq in group.items"
            :key="faq.title"
            class="group px-4"
          >
            <summary
              class="flex cursor-pointer list-none items-center gap-3 py-3 text-sm font-medium"
            >
              <span class="flex-1">{{ faq.title }}</span>
              <Plus
                class="h-4 w-4 shrink-0 text-muted transition group-open:rotate-45"
              />
            </summary>
            <!-- static, trusted content from data/faq.js -->
            <p
              class="faq-text pb-4 text-sm leading-relaxed text-muted"
              v-html="faq.text"
            ></p>
          </details>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { Plus } from 'lucide-vue-next'

import faqs from '../data/faq.js'

const groups = faqs.reduce((list, faq) => {
  let group = list.find((g) => g.realm === faq.realm)
  if (!group) list.push((group = { realm: faq.realm, items: [] }))
  group.items.push(faq)
  return list
}, [])
</script>

<style scoped>
.faq-text :deep(a) {
  color: var(--brand);
  text-decoration: underline;
}
</style>
