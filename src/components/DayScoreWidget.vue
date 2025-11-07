<template>
  <div class="day-score-widget" :style="{ background: widgetBackground }">
    <h3 class="widget-title" :style="{ color: titleColor }">Day Score</h3>
    <template v-if="hasScore">
      <div class="score-content">
        <div class="score-number" :style="{ color: textColor }">{{ score! >= 0 ? '+' : '' }}{{ score }}</div>
        <div class="score-label" :style="{ color: textColor }">{{ scoreLabel }}</div>
      </div>
    </template>
    <div v-else class="score-content empty-content">
      <v-icon size="48" :color="emptyIconColor">mdi-minus</v-icon>
      <div class="empty-label">Not yet rated</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  score?: number | null; // -2 to 2, or null/undefined if not set
}>();

const hasScore = computed(() => {
  return props.score !== null && props.score !== undefined;
});

const scoreColors = {
  '-2': '#0D0D5F', // Deep blue - very bad
  '-1': '#026C7C', // Teal - bad
  '0': '#9ca3af',  // Gray - neutral
  '1': '#E57C04',  // Orange - good
  '2': '#FB6376',  // Pink/Red - very good
};

const scoreLabels = {
  '-2': 'Very Difficult',
  '-1': 'Challenging',
  '0': 'Neutral',
  '1': 'Good',
  '2': 'Excellent',
};

const widgetBackground = computed(() => {
  if (!hasScore.value) return '#fcfcf9'; // Match main content background
  const clampedScore = Math.max(-2, Math.min(2, props.score!));
  const baseColor = scoreColors[clampedScore.toString() as keyof typeof scoreColors];
  // Mix with 85-90% white for very light, readable background
  return `color-mix(in srgb, ${baseColor} 15%, white)`;
});

const titleColor = computed(() => {
  return hasScore.value ? '#202020' : '#666';
});

const textColor = computed(() => {
  return '#202020'; // Dark text on light backgrounds
});

const emptyIconColor = computed(() => {
  return '#ccc';
});

const scoreLabel = computed(() => {
  if (!hasScore.value) return '';
  const clampedScore = Math.max(-2, Math.min(2, props.score!));
  return scoreLabels[clampedScore.toString() as keyof typeof scoreLabels];
});
</script>

<style scoped>
.day-score-widget {
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  padding: 24px;
  transition: background 0.3s ease;
  min-height: 200px;
  display: flex;
  flex-direction: column;
}

.widget-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 20px 0;
  transition: color 0.3s ease;
}

.score-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 12px;
}

.score-number {
  font-size: 56px;
  font-weight: 700;
  margin: 0;
  line-height: 1;
}

.score-label {
  font-size: 15px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.empty-content {
  gap: 16px;
}

.empty-label {
  font-size: 14px;
  font-weight: 500;
  color: #999;
}
</style>
