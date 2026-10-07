<template>
  <div class="mb-4 flex items-baseline justify-between gap-3">
    <h3 class="font-display text-base font-semibold">{{ title }}</h3>
    <span v-if="note" class="shrink-0 font-mono text-xs text-muted">{{
      note
    }}</span>
    <span v-if="hint" class="hidden font-mono text-xs text-muted sm:inline">{{
      hint
    }}</span>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  note: { type: String, default: '' },
  // only shown on larger screens
  hint: { type: String, default: '' },
})
</script>
