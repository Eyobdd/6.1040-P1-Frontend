<script setup lang="ts">
import Sidebar from './components/Sidebar/Sidebar.vue';
</script>

<template>
  <v-app class="zien-app">
    <Sidebar />

    <v-main class="main-content">
      <router-view />
    </v-main>
  </v-app>
</template>

<style>
/* Global styles for #app */
#app {
  margin: 0 0 0 72px !important;
  padding: 0 !important;
  text-align: center !important;
  display: flex !important;
  flex-grow: 1 !important;
  max-width: unset !important;
}
</style>

<style scoped>
.main-content {
  background-color: #fcfcf9;
  margin-left: 0 !important;
}
</style>
