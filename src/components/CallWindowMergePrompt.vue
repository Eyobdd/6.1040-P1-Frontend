<template>
  <div class="merge-prompt-overlay" @click.self="handleCancel">
    <div class="merge-prompt-modal">
      <h3 class="modal-title">Merge Windows?</h3>
      <p class="modal-message">
        The new window overlaps with an existing window. Would you like to merge them into a single window?
      </p>
      <div class="modal-actions">
        <button class="btn btn-cancel" @click="handleCancel">
          Cancel
        </button>
        <button class="btn btn-merge" @click="handleMerge">
          Merge
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  merge: [];
  cancel: [];
}>();

const handleMerge = () => {
  emit('merge');
};

const handleCancel = () => {
  emit('cancel');
};
</script>

<style scoped>
.merge-prompt-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.merge-prompt-modal {
  background: white;
  border-radius: 8px;
  padding: 24px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.modal-title {
  margin: 0 0 12px 0;
  font-size: 18px;
  font-weight: 600;
  color: #202020;
}

.modal-message {
  margin: 0 0 24px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  gap: 12px;
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
}

.btn-cancel {
  background: #f5f5f5;
  color: #666;
}

.btn-cancel:hover {
  background: #e8e8e8;
}

.btn-merge {
  background: #20808d;
  color: white;
}

.btn-merge:hover {
  background: #1a6a75;
}
</style>
