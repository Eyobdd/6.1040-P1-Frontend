<template>
  <div class="modal-overlay" @click.self="handleCancel">
    <div class="modal-content">
      <div class="modal-header">
        <h3>{{ isNewWindow ? 'Create Call Window' : 'Edit Call Window' }}</h3>
        <button class="close-btn" @click="handleCancel">
          <v-icon size="20">mdi-close</v-icon>
        </button>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <label>Start Time</label>
          <div class="time-inputs">
            <input 
              v-model.number="startHour" 
              type="number" 
              min="1" 
              max="12" 
              class="time-input"
              @blur="validateHour('start')"
            />
            <span>:</span>
            <input 
              v-model.number="startMinute" 
              type="number" 
              min="0" 
              max="59" 
              class="time-input"
              @blur="validateMinute('start')"
            />
            <select v-model="startPeriod" class="time-select">
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>End Time</label>
          <div class="time-inputs">
            <input 
              v-model.number="endHour" 
              type="number" 
              min="1" 
              max="12" 
              class="time-input"
              @blur="validateHour('end')"
            />
            <span>:</span>
            <input 
              v-model.number="endMinute" 
              type="number" 
              min="0" 
              max="59" 
              class="time-input"
              @blur="validateMinute('end')"
            />
            <select v-model="endPeriod" class="time-select">
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>
        </div>

        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
      </div>

      <div class="modal-footer">
        <button v-if="!isNewWindow" class="btn btn-delete" @click="handleDelete">
          <v-icon size="18">mdi-delete</v-icon>
          Delete
        </button>
        <div class="footer-right" :class="{ 'full-width': isNewWindow }">
          <button class="btn btn-secondary" @click="handleCancel">
            Cancel
          </button>
          <button class="btn btn-primary" @click="handleSave">
            {{ isNewWindow ? 'Create' : 'Save' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { DisplayWindow } from '@/types/callWindow';

interface Props {
  window: DisplayWindow;
}

const props = defineProps<Props>();

const isNewWindow = computed(() => props.window.id === 'new');
const emit = defineEmits<{
  save: [window: DisplayWindow];
  cancel: [];
  delete: [];
}>();

// State
const startHour = ref(12);
const startMinute = ref(0);
const startPeriod = ref<'AM' | 'PM'>('AM');
const endHour = ref(12);
const endMinute = ref(0);
const endPeriod = ref<'AM' | 'PM'>('AM');
const errorMessage = ref('');

// Methods
const validateHour = (type: 'start' | 'end') => {
  const hour = type === 'start' ? startHour.value : endHour.value;
  if (hour < 1 || hour > 12 || isNaN(hour)) {
    if (type === 'start') {
      startHour.value = 12;
    } else {
      endHour.value = 12;
    }
  }
};

const validateMinute = (type: 'start' | 'end') => {
  const minute = type === 'start' ? startMinute.value : endMinute.value;
  if (minute < 0 || minute > 59 || isNaN(minute)) {
    if (type === 'start') {
      startMinute.value = 0;
    } else {
      endMinute.value = 0;
    }
  }
};
const parseTime = (date: Date) => {
  let hours = date.getHours();
  const mins = date.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  
  if (hours === 0) hours = 12;
  else if (hours > 12) hours -= 12;
  
  return { hours, mins, period };
};

const createDateTime = (hour: number, minute: number, period: 'AM' | 'PM'): Date => {
  const date = new Date(props.window.startTime);
  date.setHours(0, 0, 0, 0);
  
  let hours24 = hour;
  if (period === 'PM' && hour !== 12) {
    hours24 += 12;
  } else if (period === 'AM' && hour === 12) {
    hours24 = 0;
  }
  
  date.setHours(hours24, minute);
  return date;
};

const handleSave = () => {
  const newStart = createDateTime(startHour.value, startMinute.value, startPeriod.value);
  const newEnd = createDateTime(endHour.value, endMinute.value, endPeriod.value);
  
  // Validation
  if (newEnd <= newStart) {
    errorMessage.value = 'End time must be after start time';
    return;
  }
  
  const duration = (newEnd.getTime() - newStart.getTime()) / (1000 * 60);
  if (duration < 15) {
    errorMessage.value = 'Window must be at least 15 minutes';
    return;
  }
  
  emit('save', {
    ...props.window,
    startTime: newStart,
    endTime: newEnd,
  });
};

const handleCancel = () => {
  emit('cancel');
};

const handleDelete = () => {
  emit('delete');
};

// Lifecycle
onMounted(() => {
  const start = parseTime(props.window.startTime);
  const end = parseTime(props.window.endTime);
  
  startHour.value = start.hours;
  startMinute.value = start.mins;
  startPeriod.value = start.period as 'AM' | 'PM';
  
  endHour.value = end.hours;
  endMinute.value = end.mins;
  endPeriod.value = end.period as 'AM' | 'PM';
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  width: 90%;
  max-width: 400px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e5dd;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #202020;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background-color: #e5e5dd;
  color: #202020;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #202020;
  margin-bottom: 8px;
}

.time-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-input {
  padding: 8px 12px;
  border: 1px solid #e4e4e4;
  border-radius: 4px;
  font-size: 14px;
  color: #202020;
  background-color: white;
  width: 60px;
  transition: all 0.2s;
}

.time-input:focus {
  outline: none;
  border-color: #20808d;
}

.time-input:hover {
  border-color: #999;
}

.time-select {
  padding: 8px 12px;
  border: 1px solid #e4e4e4;
  border-radius: 4px;
  font-size: 14px;
  color: #202020;
  background-color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.time-select:focus {
  outline: none;
  border-color: #20808d;
}

.time-select:hover {
  border-color: #999;
}

.error-message {
  margin-top: 16px;
  padding: 12px;
  background-color: #ffebee;
  color: #d32f2f;
  border-radius: 4px;
  font-size: 13px;
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-top: 1px solid #e5e5dd;
}

.footer-right {
  display: flex;
  gap: 8px;
}

.footer-right.full-width {
  flex: 1;
  justify-content: flex-end;
}

.btn {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-primary {
  background-color: #20808d;
  color: white;
}

.btn-primary:hover {
  background-color: #1a6a75;
}

.btn-secondary {
  background-color: #f0f0e8;
  color: #666;
}

.btn-secondary:hover {
  background-color: #e5e5dd;
  color: #202020;
}

.btn-delete {
  background-color: transparent;
  color: #d32f2f;
  border: 1px solid #d32f2f;
}

.btn-delete:hover {
  background-color: #ffebee;
}
</style>
