<template>
  <div class="authenticated-layout with-sidebar">
    <Sidebar />
    <v-main class="main-content">
      <router-view />
    </v-main>
  </div>
</template>

<script setup lang="ts">
import Sidebar from '@/components/Sidebar/Sidebar.vue';
</script>

<style scoped>
.authenticated-layout {
  display: flex;
  width: 100%;
  min-height: 100vh;
}

.main-content {
  background-color: #fcfcf9;
  margin-left: 72px !important;
  flex: 1;
}
</style>
