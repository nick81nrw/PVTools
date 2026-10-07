<template>
  <label class="block">
    <span class="mb-1 flex items-center gap-1 text-xs font-medium text-muted">
      {{ label }}
      <span v-if="hint" class="cursor-help" :title="hint">
        <Info class="h-3.5 w-3.5" />
      </span>
    </span>
    <span class="relative block">
      <input
        class="input pr-16"
        type="number"
        inputmode="decimal"
        :min="min"
        :max="max"
        :step="step"
        :disabled="disabled"
        :value="displayValue"
        @input="onInput"
      />
      <span
        v-if="unit"
        class="pointer-events-none absolute inset-y-0 right-3 flex items-center font-mono text-xs text-muted"
        >{{ unit }}</span
      >
    </span>
  </label>
</template>

<script setup>
import { computed } from 'vue'
import { Info } from 'lucide-vue-next'

const props = defineProps({
  label: { type: String, required: true },
  modelValue: { type: Number, default: 0 },
  unit: { type: String, default: '' },
  hint: { type: String, default: '' },
  min: { type: [Number, String], default: undefined },
  max: { type: [Number, String], default: undefined },
  step: { type: [Number, String], default: 'any' },
  // the value is shown multiplied with this factor, e.g. Wh as kWh = 0.001
  factor: { type: Number, default: 1 },
  disabled: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const displayValue = computed(() =>
  Number.isFinite(props.modelValue)
    ? Math.round(props.modelValue * props.factor * 1e6) / 1e6
    : '',
)

const onInput = (event) => {
  const value = event.target.valueAsNumber
  if (Number.isFinite(value)) {
    emit('update:modelValue', Math.round((value / props.factor) * 1e6) / 1e6)
  }
}
</script>
