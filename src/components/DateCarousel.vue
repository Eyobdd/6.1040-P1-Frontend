<template>
  <div class="date-carousel-container">
    <div class="date-carousel">
      <!-- Week navigation (double chevrons) -->
      <v-tooltip text="Previous week" location="bottom">
        <template v-slot:activator="{ props }">
          <button 
            @click="scrollLeft" 
            class="nav-button week-nav" 
            aria-label="Go back one week" 
            type="button"
            v-bind="props"
          >
            <v-icon>mdi-chevron-double-left</v-icon>
          </button>
        </template>
      </v-tooltip>
      
      <!-- Day navigation (single chevron) -->
      <v-tooltip text="Previous day" location="bottom">
        <template v-slot:activator="{ props }">
          <button 
            @click="previousDay" 
            class="nav-button day-nav" 
            aria-label="Go back one day" 
            type="button"
            v-bind="props"
          >
            <v-icon>mdi-chevron-left</v-icon>
          </button>
        </template>
      </v-tooltip>
      
      <!-- Start Month Indicator -->
      <div class="month-indicator month-start">{{ startMonth }}</div>
      
      <div class="dates-wrapper">
        <button 
          v-for="date in visibleDates" 
          :key="date.dateString"
          @click="selectDate(date)"
          class="date-item"
          :class="{ active: isSelected(date) }"
          :aria-label="`Select ${date.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`"
          type="button"
        >
          <div class="day-name">{{ date.dayAbbrev }}</div>
          <div class="date-number">{{ date.day }}</div>
        </button>
      </div>
      
      <!-- End Month Indicator -->
      <div class="month-indicator month-end">{{ endMonth }}</div>
      
      <!-- Day navigation (single chevron) -->
      <v-tooltip text="Next day" location="bottom">
        <template v-slot:activator="{ props }">
          <button 
            @click="nextDay" 
            class="nav-button day-nav" 
            aria-label="Go forward one day" 
            type="button"
            v-bind="props"
          >
            <v-icon>mdi-chevron-right</v-icon>
          </button>
        </template>
      </v-tooltip>
      
      <!-- Week navigation (double chevrons) -->
      <v-tooltip text="Next week" location="bottom">
        <template v-slot:activator="{ props }">
          <button 
            @click="scrollRight" 
            class="nav-button week-nav" 
            aria-label="Go forward one week" 
            type="button"
            v-bind="props"
          >
            <v-icon>mdi-chevron-double-right</v-icon>
          </button>
        </template>
      </v-tooltip>
      <v-tooltip text="Go to today" location="bottom">
        <template v-slot:activator="{ props }">
          <button 
            @click="goToToday" 
            class="today-button" 
            aria-label="Go to today's date"
            type="button"
            v-bind="props"
          >
            Today
          </button>
        </template>
      </v-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

interface DateInfo {
  date: Date;
  dateString: string;
  dayAbbrev: string;
  day: number;
  month: number;
  year: number;
}

const props = defineProps<{
  selectedDate: Date;
}>();

const emit = defineEmits<{
  'update:selectedDate': [date: Date];
}>();

const today = new Date();
today.setHours(0, 0, 0, 0);

const visibleDates = computed(() => {
  const dates: DateInfo[] = [];
  // Center the selected date in the 7-day view (3 before, selected, 3 after)
  const baseDate = new Date(props.selectedDate);
  baseDate.setDate(baseDate.getDate() - 3);
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i);
    
    dates.push({
      date: new Date(date),
      dateString: date.toISOString().split('T')[0],
      dayAbbrev: getDayAbbrev(date),
      day: date.getDate(),
      month: date.getMonth(),
      year: date.getFullYear(),
    });
  }
  
  return dates;
});

const startMonth = computed(() => {
  if (visibleDates.value.length === 0) return '';
  const firstDate = visibleDates.value[0].date;
  return firstDate.toLocaleDateString('en-US', { month: 'short' });
});

const endMonth = computed(() => {
  if (visibleDates.value.length === 0) return '';
  const lastDate = visibleDates.value[visibleDates.value.length - 1].date;
  return lastDate.toLocaleDateString('en-US', { month: 'short' });
});

function getDayAbbrev(date: Date): string {
  const days = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'];
  return days[date.getDay()];
}

function isSelected(dateInfo: DateInfo): boolean {
  return dateInfo.dateString === props.selectedDate.toISOString().split('T')[0];
}

function selectDate(dateInfo: DateInfo) {
  emit('update:selectedDate', dateInfo.date);
}

function previousDay() {
  const newDate = new Date(props.selectedDate);
  newDate.setDate(newDate.getDate() - 1);
  emit('update:selectedDate', newDate);
}

function nextDay() {
  const newDate = new Date(props.selectedDate);
  newDate.setDate(newDate.getDate() + 1);
  emit('update:selectedDate', newDate);
}

function scrollLeft() {
  const newDate = new Date(props.selectedDate);
  newDate.setDate(newDate.getDate() - 7);
  emit('update:selectedDate', newDate);
}

function scrollRight() {
  const newDate = new Date(props.selectedDate);
  newDate.setDate(newDate.getDate() + 7);
  emit('update:selectedDate', newDate);
}

function goToToday() {
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  emit('update:selectedDate', todayDate);
}
</script>

<style scoped>
.date-carousel-container {
  background: #fcfcf9;
  border-bottom: 1px solid #e5e5e5;
  position: sticky;
  top: 0;
  z-index: 100;
  height: 72px;
  display: flex;
  align-items: center;
}

.date-carousel {
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  padding: 0 24px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-button {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
  outline: none;
}

.nav-button:focus {
  outline: none;
}

.nav-button:focus-visible {
  outline: 2px solid #20808d;
  outline-offset: 2px;
}

.nav-button:hover {
  background: rgba(32, 128, 141, 0.1);
  color: #20808d;
}

.week-nav {
  opacity: 0.7;
}

.week-nav:hover {
  opacity: 1;
}

.dates-wrapper {
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-shrink: 0;
}

.month-indicator {
  font-size: 13px;
  font-weight: 500;
  color: #666;
  padding: 0 16px;
  flex: 1;
  display: flex;
  align-items: center;
}

.month-start {
  justify-content: flex-end;
  text-align: right;
}

.month-end {
  justify-content: flex-start;
  text-align: left;
}

.date-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 56px;
  position: relative;
  background: none;
  border: none;
  outline: none;
}

.date-item:focus {
  outline: none;
}

.date-item:focus-visible {
  outline: 2px solid #20808d;
  outline-offset: 2px;
  border-radius: 8px;
}

.date-item:hover .date-number {
  color: #20808d;
}

.day-name {
  font-size: 11px;
  font-weight: 600;
  margin-bottom: 6px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.date-item.active .day-name {
  color: #20808d;
  font-weight: 700;
}

.date-number {
  font-size: 18px;
  font-weight: 500;
  color: #333;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.date-item.active .date-number {
  background: #20808d;
  color: white;
  font-weight: 600;
}

.today-button {
  background: transparent;
  border: 1px solid #d0d0d0;
  color: #666;
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  outline: none;
}

.today-button:focus {
  outline: none;
}

.today-button:focus-visible {
  outline: 2px solid #20808d;
  outline-offset: 2px;
}

.today-button:hover {
  background: #f0f0f0;
  border-color: #b0b0b0;
  color: #333;
}
</style>
