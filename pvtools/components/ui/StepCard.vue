<template>
  <section class="card p-4 sm:p-5">
    <header class="mb-4 flex items-baseline gap-3">
      <span class="font-mono text-sm font-semibold text-brand">{{ step }}</span>
      <div class="min-w-0 flex-1">
        <h2 class="font-display text-base font-semibold">{{ title }}</h2>
        <p v-if="subtitle" class="text-xs text-muted">{{ subtitle }}</p>
      </div>
      <slot name="aside" />
    </header>
    <slot />
  </section>
</template>

<script setup>
defineProps({
  step: { type: String, required: true },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
})
</script>
