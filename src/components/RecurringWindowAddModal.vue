<template>
  <div class="modal-overlay" @click.self="$emit('cancel')">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Add Call Window</h3>
        <button class="close-btn" @click="$emit('cancel')">
          <v-icon size="20">mdi-close</v-icon>
        </button>
      </div>

      <div class="modal-body">
        <!-- Day selection -->
        <div class="form-group">
          <label>Days</label>
          <div class="day-checkboxes">
            <label
              v-for="day in daysOfWeek"
              :key="day.value"
              class="day-checkbox"
              :class="{ selected: selectedDays.includes(day.value) }"
            >
              <input
                type="checkbox"
                :value="day.value"
                v-model="selectedDays"
              />
              <span>{{ day.label }}</span>
            </label>
          </div>
          <p v-if="selectedDays.length === 0" class="error-text">
            Select at least one day
          </p>
        </div>

        <!-- Time inputs -->
        <div class="time-inputs">
          <div class="form-group">
            <label>Start Time</label>
            <div class="time-input-group">
              <input
                type="number"
                v-model.number="startHour"
                min="1"
                max="12"
                class="time-input"
                placeholder="HH"
              />
              <span>:</span>
              <input
                type="number"
                v-model.number="startMinute"
                min="0"
                max="59"
                class="time-input"
                placeholder="MM"
              />
              <select v-model="startAmPm" class="ampm-select">
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>End Time</label>
            <div class="time-input-group">
              <input
                type="number"
                v-model.number="endHour"
                min="1"
                max="12"
                class="time-input"
                placeholder="HH"
              />
              <span>:</span>
              <input
                type="number"
                v-model.number="endMinute"
                min="0"
                max="59"
                class="time-input"
                placeholder="MM"
              />
              <select v-model="endAmPm" class="ampm-select">
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>
        </div>

        <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
      </div>

      <div class="modal-footer">
        <button class="btn-secondary" @click="$emit('cancel')">Cancel</button>
        <button class="btn-primary" @click="handleSave" :disabled="!canSave">
          Add Window
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

type DayOfWeek = 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';

const emit = defineEmits<{
  save: [data: { days: DayOfWeek[]; startTime: number; endTime: number }];
  cancel: [];
}>();

const daysOfWeek = [
  { label: 'Mon', value: 'MONDAY' as DayOfWeek },
  { label: 'Tue', value: 'TUESDAY' as DayOfWeek },
  { label: 'Wed', value: 'WEDNESDAY' as DayOfWeek },
  { label: 'Thu', value: 'THURSDAY' as DayOfWeek },
  { label: 'Fri', value: 'FRIDAY' as DayOfWeek },
  { label: 'Sat', value: 'SATURDAY' as DayOfWeek },
  { label: 'Sun', value: 'SUNDAY' as DayOfWeek },
];

const selectedDays = ref<DayOfWeek[]>([]);
const startHour = ref(9);
const startMinute = ref(0);
const startAmPm = ref('AM');
const endHour = ref(10);
const endMinute = ref(0);
const endAmPm = ref('AM');
const errorMessage = ref('');

const canSave = computed(() => {
  return selectedDays.value.length > 0 && !errorMessage.value;
});

function convertTo24Hour(hour: number, ampm: string): number {
  if (ampm === 'AM') {
    return hour === 12 ? 0 : hour;
  } else {
    return hour === 12 ? 12 : hour + 12;
  }
}

function handleSave() {
  if (selectedDays.value.length === 0) {
    errorMessage.value = 'Please select at least one day';
    return;
  }

  const startHour24 = convertTo24Hour(startHour.value, startAmPm.value);
  const endHour24 = convertTo24Hour(endHour.value, endAmPm.value);
  
  const startTimeMinutes = startHour24 * 60 + startMinute.value;
  const endTimeMinutes = endHour24 * 60 + endMinute.value;

  if (endTimeMinutes <= startTimeMinutes) {
    errorMessage.value = 'End time must be after start time';
    return;
  }

  if (endTimeMinutes - startTimeMinutes < 5) {
    errorMessage.value = 'Window must be at least 5 minutes';
    return;
  }

  emit('save', {
    days: selectedDays.value,
    startTime: startTimeMinutes,
    endTime: endTimeMinutes,
  });
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #ffffff;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e5e5;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #171717;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  color: #737373;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #171717;
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #171717;
  margin-bottom: 8px;
}

.day-checkboxes {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.day-checkbox {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.day-checkbox input {
  display: none;
}

.day-checkbox span {
  font-size: 14px;
  color: #737373;
}

.day-checkbox.selected {
  background: #20808d;
  border-color: #20808d;
}

.day-checkbox.selected span {
  color: #ffffff;
}

.day-checkbox:hover:not(.selected) {
  border-color: #20808d;
  background: #e6f4f6;
}

.time-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.time-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-input {
  width: 60px;
  padding: 8px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  font-size: 14px;
  text-align: center;
}

.time-input:focus {
  outline: none;
  border-color: #20808d;
}

.ampm-select {
  padding: 8px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.ampm-select:focus {
  outline: none;
  border-color: #20808d;
}

.error-text {
  color: #dc2626;
  font-size: 13px;
  margin-top: 8px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e5e5e5;
}

.btn-secondary,
.btn-primary {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background: #ffffff;
  border: 1px solid #e5e5e5;
  color: #171717;
}

.btn-secondary:hover {
  background: #f5f5f5;
}

.btn-primary {
  background: #20808d;
  border: none;
  color: #ffffff;
}

.btn-primary:hover:not(:disabled) {
  background: #1a6b76;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
