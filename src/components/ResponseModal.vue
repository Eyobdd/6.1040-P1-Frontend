<template>
  <v-dialog v-model="isOpen" max-width="700px">
    <v-card class="response-modal">
      <div class="modal-header" :style="{ background: headerColor }">
        <h2 class="modal-prompt">{{ prompt }}</h2>
      </div>
      
      <div class="modal-body">
        <p class="modal-response">{{ response }}</p>
      </div>
      
      <div class="modal-actions">
        <v-btn @click="close" variant="text" color="primary">
          Close
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  modelValue: boolean;
  prompt: string;
  response: string;
  colorIndex: number;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const colors = [
  '#0D0D5F',
  '#026C7C',
  '#FFDFAC',
  '#E57C04',
  '#FB6376',
];

const headerColor = computed(() => {
  const baseColor = colors[props.colorIndex % colors.length];
  return `color-mix(in srgb, ${baseColor} 75%, white)`;
});

function close() {
  isOpen.value = false;
}
</script>

<style scoped>
.response-modal {
  border-radius: 12px;
  overflow: hidden;
}

.modal-header {
  padding: 40px 32px;
  text-align: center;
}

.modal-prompt {
  color: white;
  font-size: 24px;
  font-weight: 600;
  line-height: 1.4;
  margin: 0;
}

.modal-body {
  padding: 32px;
  background: white;
  max-height: 60vh;
  overflow-y: auto;
}

.modal-response {
  color: #333;
  font-size: 16px;
  line-height: 1.8;
  margin: 0;
  white-space: pre-wrap;
}

.modal-actions {
  padding: 16px 24px;
  background: #f7f7f7;
  display: flex;
  justify-content: flex-end;
}
</style>
