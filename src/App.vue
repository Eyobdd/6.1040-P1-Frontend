<script setup lang="ts">
import CustomAlert from '@/components/CustomAlert.vue';
import { useAlert } from '@/composables/useAlert';

const { alertState, confirm, cancel } = useAlert();
</script>

<template>
  <v-app>
    <router-view />
    <CustomAlert
      v-if="alertState.visible"
      :title="alertState.title"
      :message="alertState.message"
      :confirmText="alertState.confirmText"
      :cancelText="alertState.cancelText"
      :showCancel="alertState.showCancel"
      @confirm="confirm"
      @cancel="cancel"
    />
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
