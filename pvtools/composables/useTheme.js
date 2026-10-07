import { ref } from 'vue'

const STORAGE_KEY = 'pvtools-theme'
const media = window.matchMedia('(prefers-color-scheme: dark)')

const readPreference = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) || 'system'
  } catch {
    return 'system'
  }
}

// 'light' | 'dark' | 'system'
const preference = ref(readPreference())
const isDark = ref(document.documentElement.classList.contains('dark'))

const apply = () => {
  isDark.value =
    preference.value === 'dark' ||
    (preference.value === 'system' && media.matches)
  document.documentElement.classList.toggle('dark', isDark.value)
}

media.addEventListener('change', apply)

export function useTheme() {
  const cycle = () => {
    const order = ['system', 'light', 'dark']
    preference.value = order[(order.indexOf(preference.value) + 1) % 3]
    try {
      localStorage.setItem(STORAGE_KEY, preference.value)
    } catch {}
    apply()
  }
  return { preference, isDark, cycle }
}
