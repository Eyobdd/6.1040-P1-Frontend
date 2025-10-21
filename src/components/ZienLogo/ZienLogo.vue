<template>
  <div class="zien-logo">
    <span class="logo-text">zie</span>
    <img
      src="@/assets/ZienSymbolLogo.svg"
      alt="n"
      class="logo-symbol"
    />
  </div>
</template>

<script setup lang="ts">
// No props needed for now
</script>

<style scoped>
.zien-logo {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.logo-text {
  font-size: 64px;
  font-weight: 300;
  color: #202020;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, sans-serif;
  letter-spacing: -0.03em;
  line-height: 1;
}

.logo-symbol {
  height: 56px;
  width: auto;
  margin-bottom: -4px; /* Fine-tune vertical alignment */
}
</style>
