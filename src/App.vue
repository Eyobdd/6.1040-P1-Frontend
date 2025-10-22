<script setup lang="ts">
</script>

<template>
  <v-app>
    <router-view />
  </v-app>
</template>

<style>
/* Global styles for #app */
#app {
  margin: 0 !important;
  padding: 0 !important;
  text-align: center !important;
  display: flex !important;
  flex-grow: 1 !important;
  max-width: unset !important;
}

/* Authenticated layout with sidebar */
.with-sidebar #app {
  margin: 0 0 0 72px !important;
}
</style>
