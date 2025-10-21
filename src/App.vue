<script setup lang="ts">
import Sidebar from './components/Sidebar/Sidebar.vue';
</script>

<template>
  <v-app class="zien-app">
    <Sidebar />

    <v-main class="main-content" style="margin-left: 72px">
      <div class="content-wrapper">
        <!-- Center content -->
        <div class="center-content">
          <!-- Logo/Title -->
          <div class="app-logo">
            <img
              src="@/assets/ZienNameLogo.svg"
              alt="Zien"
              class="logo-image"
            />
          </div>
        </div>
      </div>
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
}
</style>

<style scoped>
.zien-app {
  background-color: #ffffff;
}

.main-content {
  background-color: #ffffff;
  margin-left: 0 !important;
}

.content-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  padding: 0;
}

.center-content {
  max-width: 720px;
  width: 100%;
}

.app-logo {
  display: flex;
  justify-content: center;
  align-items: center;
}

.logo-image {
  height: 64px;
  width: auto;
}
</style>
