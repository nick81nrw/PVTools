<template>
  <form
    action="https://www.paypal.me/akkudoktor"
    method="post"
    target="_blank"
    title='Unterstütze unsere Arbeit! Nutze als Grund: "PV-Tool"'
  >
    <input type="hidden" name="hosted_button_id" value="RTXEPF475DBVA" />
    <button
      type="submit"
      class="inline-flex items-center gap-1.5 rounded-md bg-[#f5a524] px-3 py-1.5 text-sm font-semibold text-[#1d1300] hover:brightness-110"
    >
      <Heart class="h-3.5 w-3.5" />
      <span>Unterstützen</span>
    </button>
  </form>
</template>

<script setup>
import { Heart } from 'lucide-vue-next'
</script>
