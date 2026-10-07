<template>
  <svg
    viewBox="0 0 40 40"
    class="shrink-0"
    :width="size"
    :height="size"
    role="img"
    :aria-label="`Ausrichtung ${azimuthName(aspect)}`"
  >
    <circle
      cx="20"
      cy="20"
      r="17"
      fill="var(--surface-2)"
      stroke="var(--line)"
      stroke-width="1.5"
    />
    <g
      font-family="JetBrains Mono Variable, monospace"
      font-size="5.5"
      fill="var(--muted)"
      text-anchor="middle"
    >
      <text x="20" y="8.5">N</text>
      <text x="20" y="35.5">S</text>
      <text x="5.5" y="22">W</text>
      <text x="34.5" y="22">O</text>
    </g>
    <!-- PVGIS azimuth: 0 = south, -90 = east, 90 = west -->
    <g :transform="`rotate(${aspect} 20 20)`">
      <line
        x1="20"
        y1="20"
        x2="20"
        y2="31"
        stroke="#f5a524"
        stroke-width="2.5"
        stroke-linecap="round"
      />
      <circle cx="20" cy="31" r="2.5" fill="#f5a524" />
    </g>
    <circle cx="20" cy="20" r="2" fill="var(--ink)" />
  </svg>
</template>

<script setup>
import { azimuthName } from '../../lib/format.js'

defineProps({
  aspect: { type: Number, default: 0 },
  size: { type: Number, default: 40 },
})
</script>
