<template>
  <div class="response-card" @click="$emit('click')">
    <div class="card-header" :style="{ background: headerColor }">
      <h3 class="prompt-text">{{ prompt }}</h3>
    </div>
    <div class="card-body">
      <p class="response-preview">{{ responsePreview }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  prompt: string;
  response: string;
  colorIndex: number;
}>();

defineEmits<{
  click: [];
}>();

const colors = [
  '#0D0D5F', // Deep blue
  '#026C7C', // Teal
  '#FFDFAC', // Peach
  '#E57C04', // Orange
  '#FB6376', // Pink/Red
];

const headerColor = computed(() => {
  const baseColor = colors[props.colorIndex % colors.length];
  // Mix with 25% white using color-mix
  return `color-mix(in srgb, ${baseColor} 75%, white)`;
});

const responsePreview = computed(() => {
  const words = props.response.split(/\s+/);
  const first50Words = words.slice(0, 50).join(' ');
  return words.length > 50 ? first50Words + '...' : first50Words;
});
</script>

<style scoped>
.response-card {
  background: #fcfcf9;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
}

.response-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  padding: 24px;
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.prompt-text {
  color: white;
  font-size: 20px;
  font-weight: 600;
  line-height: 1.4;
  margin: 0;
  text-align: center;
}

.card-body {
  padding: 20px 24px 24px;
  background: #fcfcf9;
}

.response-preview {
  color: #666;
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
}
</style>
