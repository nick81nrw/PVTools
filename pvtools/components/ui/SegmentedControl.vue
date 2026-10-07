<template>
  <div
    class="inline-flex w-full rounded-lg border border-line bg-surface-2 p-0.5"
    role="radiogroup"
  >
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      role="radio"
      :aria-checked="modelValue === option.value"
      class="flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition"
      :class="
        modelValue === option.value
          ? 'bg-surface text-ink shadow-sm'
          : 'text-muted hover:text-ink'
      "
      @click="$emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: [String, Number], required: true },
  options: { type: Array, required: true },
})
defineEmits(['update:modelValue'])
</script>
