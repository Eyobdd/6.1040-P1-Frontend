<template>
  <div class="unauthenticated-layout">
    <v-main class="full-width-main">
      <router-view />
    </v-main>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.unauthenticated-layout {
  width: 100%;
  min-height: 100vh;
}

.full-width-main {
  width: 100% !important;
  max-width: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
}
</style>
