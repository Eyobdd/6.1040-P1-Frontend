<template>
  <div class="journal-page">
    <div class="page-header">
      <div class="hero-card">
        <div class="hero-icon">
          <v-icon size="48" color="#20808d">mdi-message-text-outline</v-icon>
        </div>
        <h1 class="hero-title">Current Prompts</h1>
        <p class="hero-subtitle">Customize the questions for your daily reflection calls</p>
      </div>
    </div>

    <div class="prompts-container">
      <div class="prompts-list">
        <TransitionGroup name="list">
          <div
            v-for="(prompt, index) in prompts"
            :key="prompt._id"
            class="prompt-item"
            :class="{ 'dragging': draggingId === prompt._id, 'inactive': !prompt.isActive }"
            draggable="true"
            @dragstart="handleDragStart($event, index)"
            @dragover.prevent="handleDragOver($event, index)"
            @drop="handleDrop($event, index)"
            @dragend="handleDragEnd"
          >
            <div class="drag-handle">
              <v-icon size="18">mdi-drag-vertical</v-icon>
            </div>
            
            <div v-if="prompt.isActive" class="prompt-number">{{ getActiveIndex(index) }}</div>
            <div v-else class="prompt-number inactive-number"></div>
            
            <div class="prompt-content">
              <input
                v-if="editingId === prompt._id"
                v-model="editText"
                class="prompt-input"
                @blur="saveEdit(prompt)"
                @keydown.enter="saveEdit(prompt)"
                @keydown.esc="cancelEdit"
                ref="editInput"
              />
              <div
                v-else
                class="prompt-text"
                @click="startEdit(prompt)"
              >
                {{ prompt.promptText }}
              </div>
            </div>

            <div class="prompt-actions">
              <button
                class="action-btn toggle-btn"
                :class="{ inactive: !prompt.isActive }"
                @click="toggleActive(prompt)"
                :title="prompt.isActive ? 'Active' : 'Inactive'"
              >
                <v-icon size="18">{{ prompt.isActive ? 'mdi-eye' : 'mdi-eye-off' }}</v-icon>
              </button>
              <button
                class="action-btn delete-btn"
                @click="deletePromptConfirm(prompt)"
                title="Delete prompt"
              >
                <v-icon size="18">mdi-delete-outline</v-icon>
              </button>
            </div>
          </div>
        </TransitionGroup>

        <button
          v-if="prompts.length < 5"
          class="add-prompt-btn"
          @click="showAddPrompt = true"
        >
          <v-icon size="20">mdi-plus</v-icon>
          <span>Add Prompt</span>
        </button>

        <div v-if="prompts.length >= 5" class="max-prompts-notice">
          Maximum of 5 prompts reached
        </div>
      </div>

      <!-- Rating Prompt Section -->
      <div class="rating-section">
        <h3 class="section-title">Day Rating</h3>
        <div class="rating-prompt-item" :class="{ 'inactive': !includeRating }">
          <div class="rating-icon">
            <v-icon size="24" color="#20808d">mdi-star-outline</v-icon>
          </div>
          <div class="rating-content">
            <div class="rating-text">On a scale from -2 to 2 using only whole numbers, what would you rate today?</div>
            <div class="rating-description">This prompt asks users to rate their day at the end of the call</div>
          </div>
          <div class="rating-toggle">
            <button
              class="action-btn toggle-btn"
              :class="{ inactive: !includeRating }"
              @click="toggleRating"
              :title="includeRating ? 'Active' : 'Inactive'"
            >
              <v-icon size="18">{{ includeRating ? 'mdi-eye' : 'mdi-eye-off' }}</v-icon>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Prompt Modal -->
    <div v-if="showAddPrompt" class="modal-overlay" @click.self="showAddPrompt = false">
      <div class="modal-content">
        <h3>Add New Prompt</h3>
        <input
          v-model="newPromptText"
          class="modal-input"
          placeholder="Enter your question..."
          @keydown.enter="addPrompt"
          @keydown.esc="showAddPrompt = false"
          ref="newPromptInput"
        />
        <div class="modal-actions">
          <button class="btn btn-cancel" @click="showAddPrompt = false">Cancel</button>
          <button class="btn btn-add" @click="addPrompt" :disabled="!newPromptText.trim()">Add</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '@/services/api';

interface Prompt {
  _id: string;
  user: string;
  promptText: string;
  position: number;
  isActive: boolean;
}

const router = useRouter();
const prompts = ref<Prompt[]>([]);
const editingId = ref<string | null>(null);
const editText = ref('');
const draggingId = ref<string | null>(null);
const dragOverIndex = ref<number | null>(null);
const showAddPrompt = ref(false);
const newPromptText = ref('');
const editInput = ref<HTMLInputElement | null>(null);
const newPromptInput = ref<HTMLInputElement | null>(null);
const includeRating = ref(true); // Rating prompt is active by default
const userId = ref<string | null>(null);

const getActiveIndex = (index: number) => {
  // Count only active prompts up to this index
  let activeCount = 0;
  for (let i = 0; i <= index; i++) {
    if (prompts.value[i].isActive) {
      activeCount++;
    }
  }
  return activeCount;
};

const toggleRating = async () => {
  if (!userId.value) return;
  includeRating.value = !includeRating.value;
  await api.updateRatingPreference(includeRating.value);
};

const loadPrompts = async () => {
  if (!userId.value) return;
  const result = await api.getUserPrompts();
  // Backend returns { prompts: [...] }
  const promptsArray = (result as any)?.prompts || result;
  if (Array.isArray(promptsArray)) {
    prompts.value = promptsArray;
  }
};

const startEdit = async (prompt: Prompt) => {
  editingId.value = prompt._id;
  editText.value = prompt.promptText;
  await nextTick();
  // editInput.value is an array when used in v-for, get the first element
  const input = Array.isArray(editInput.value) ? editInput.value[0] : editInput.value;
  if (input && typeof input.focus === 'function') {
    input.focus();
    input.select();
  }
};

const saveEdit = async (prompt: Prompt) => {
  if (!userId.value) return;
  if (editText.value.trim() && editText.value !== prompt.promptText) {
    const result = await api.updatePromptText(prompt.position, editText.value.trim());
    if (!('error' in result)) {
      prompt.promptText = editText.value.trim();
    }
  }
  editingId.value = null;
  editText.value = '';
};

const cancelEdit = () => {
  editingId.value = null;
  editText.value = '';
};

const toggleActive = async (prompt: Prompt) => {
  // If this prompt is being edited, save and blur the input first
  if (editingId.value === prompt._id) {
    await saveEdit(prompt);
  }
  
  if (!userId.value) return;
  const result = await api.togglePromptActive(prompt.position);
  if (!('error' in result)) {
    prompt.isActive = !prompt.isActive;
  }
};

const deletePromptConfirm = async (prompt: Prompt) => {
  if (!userId.value) return;
  if (confirm(`Delete "${prompt.promptText}"?`)) {
    const result = await api.deletePrompt(prompt.position);
    if (!('error' in result)) {
      await loadPrompts();
    }
  }
};

const addPrompt = async () => {
  if (!userId.value || !newPromptText.value.trim()) return;
  
  const result = await api.addPrompt(newPromptText.value.trim());
  if ('prompt' in result) {
    await loadPrompts();
    newPromptText.value = '';
    showAddPrompt.value = false;
  }
};

const handleDragStart = (e: DragEvent, index: number) => {
  draggingId.value = prompts.value[index]._id;
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', (e.target as HTMLElement).innerHTML);
  }
};

const handleDragOver = (e: DragEvent, index: number) => {
  e.preventDefault();
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move';
  }
  dragOverIndex.value = index;
};

const handleDrop = async (e: DragEvent, dropIndex: number) => {
  e.preventDefault();
  
  if (!draggingId.value) return;
  
  const dragIndex = prompts.value.findIndex(p => p._id === draggingId.value);
  if (dragIndex === dropIndex) return;
  
  // Reorder locally
  const newPrompts = [...prompts.value];
  const [draggedItem] = newPrompts.splice(dragIndex, 1);
  newPrompts.splice(dropIndex, 0, draggedItem);
  prompts.value = newPrompts;
  
  // Update backend
  if (!userId.value) return;
  const newOrder = newPrompts.map(p => p._id);
  await api.reorderPrompts(newOrder);
  await loadPrompts();
};

const handleDragEnd = () => {
  draggingId.value = null;
  dragOverIndex.value = null;
};

onMounted(async () => {
  // Get authenticated user
  const token = api.getToken();
  if (!token) {
    router.push('/auth');
    return;
  }

  const authResult = await api.authenticate(token);
  if ('error' in authResult || !authResult.user) {
    router.push('/auth');
    return;
  }

  userId.value = authResult.user;
  
  await loadPrompts();
  
  // If no prompts exist, create default prompts
  if (prompts.value.length === 0) {
    await api.createDefaultPrompts();
    await loadPrompts();
  }
  
  // Load rating preference from profile
  const profile = await api.getProfile();
  if (profile && 'includeRating' in profile) {
    includeRating.value = profile.includeRating;
  }
  
  // Auto-focus new prompt input when modal opens
  const unwatchAdd = () => {
    if (showAddPrompt.value && newPromptInput.value) {
      nextTick(() => {
        newPromptInput.value?.focus();
      });
    }
  };
  
  // Watch for modal opening
  const stopWatch = () => unwatchAdd();
  stopWatch();
});
</script>

<style scoped>
.journal-page {
  min-height: 100vh;
  background: #fcfcf9;
  padding: 2rem;
}

.page-header {
  max-width: 720px;
  margin: 0 auto 2rem;
}

.hero-card {
  text-align: center;
  padding: 2rem;
  margin-bottom: 2rem;
}

.hero-icon {
  margin-bottom: 1rem;
}

.hero-title {
  font-size: 48px;
  font-weight: 700;
  color: #202020;
  margin: 0 0 0.5rem 0;
  line-height: 1.2;
  font-family: 'Georgia', serif;
}

.hero-subtitle {
  font-size: 18px;
  color: #666;
  margin: 0;
  font-weight: 400;
}

.prompts-container {
  max-width: 720px;
  margin: 0 auto;
}

.prompts-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.prompt-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
  border: 1px solid #e4e4e4;
  border-radius: 6px;
  padding: 12px 16px;
  transition: all 0.2s ease;
  cursor: move;
}

.prompt-item:hover {
  border-color: #20808d;
  box-shadow: 0 2px 8px rgba(32, 128, 141, 0.1);
}

.prompt-item.dragging {
  opacity: 0.5;
}

.prompt-item.inactive {
  background: #fafafa;
  border-color: #f0f0f0;
  opacity: 0.6;
}

.prompt-item.inactive:hover {
  border-color: #e0e0e0;
  box-shadow: none;
}

.prompt-item.inactive .prompt-text {
  color: #999;
  font-style: italic;
}

.prompt-item.inactive .drag-handle {
  color: #ccc;
}

.drag-handle {
  color: #999;
  cursor: grab;
  display: flex;
  align-items: center;
}

.drag-handle:active {
  cursor: grabbing;
}

.prompt-number {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 600;
  color: #666;
  flex-shrink: 0;
}

.prompt-number.inactive-number {
  background: transparent;
  border: 2px dashed #e0e0e0;
}

.prompt-content {
  flex: 1;
  min-width: 0;
}

.prompt-text {
  padding: 6px 8px;
  border-radius: 4px;
  cursor: text;
  transition: background 0.15s;
  color: #202020;
  font-size: 0.95rem;
  text-align: left;
}

.prompt-text:hover {
  background: #f8f8f8;
}

.prompt-input {
  width: 100%;
  padding: 6px 8px;
  border: 2px solid #20808d;
  border-radius: 4px;
  font-size: 0.95rem;
  font-family: inherit;
  color: #202020;
  outline: none;
  background: white;
}

.prompt-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.prompt-item:hover .prompt-actions {
  opacity: 1;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: all 0.15s;
}

.action-btn:hover {
  background: #f5f5f5;
  color: #202020;
}

.toggle-btn.inactive {
  color: #ccc;
}

.delete-btn:hover {
  background: #fee;
  color: #d32f2f;
}

.add-prompt-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 14px;
  border: 2px dashed #e4e4e4;
  border-radius: 6px;
  background: transparent;
  color: #666;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 8px;
}

.add-prompt-btn:hover {
  border-color: #20808d;
  color: #20808d;
  background: rgba(32, 128, 141, 0.02);
}

.max-prompts-notice {
  text-align: center;
  padding: 14px;
  color: #999;
  font-size: 0.9rem;
  margin-top: 8px;
}

.rating-section {
  max-width: 720px;
  margin: 3rem auto 0;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #202020;
  margin: 0 0 1rem 0;
}

.rating-prompt-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  background: white;
  border: 1px solid #e4e4e4;
  border-radius: 6px;
  padding: 16px;
  transition: all 0.2s ease;
}

.rating-prompt-item.inactive {
  background: #fafafa;
  border-color: #f0f0f0;
  opacity: 0.6;
}

.rating-prompt-item.inactive .rating-text {
  color: #999;
  font-style: italic;
}

.rating-icon {
  flex-shrink: 0;
  padding-top: 2px;
}

.rating-content {
  flex: 1;
  min-width: 0;
}

.rating-text {
  font-size: 0.95rem;
  color: #202020;
  margin-bottom: 6px;
  text-align: left;
}

.rating-description {
  font-size: 0.85rem;
  color: #999;
  text-align: left;
}

.rating-toggle {
  flex-shrink: 0;
}

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
  background: white;
  border-radius: 8px;
  padding: 24px;
  max-width: 480px;
  width: 90%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.modal-content h3 {
  margin: 0 0 16px 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #202020;
}

.modal-input {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #e4e4e4;
  border-radius: 6px;
  font-size: 0.95rem;
  font-family: inherit;
  color: #202020;
  outline: none;
  transition: border-color 0.2s;
  margin-bottom: 20px;
}

.modal-input:focus {
  border-color: #20808d;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn {
  padding: 8px 20px;
  border-radius: 6px;
  font-size: 0.9rem;
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

.btn-add {
  background: #20808d;
  color: white;
}

.btn-add:hover:not(:disabled) {
  background: #1a6a75;
}

.btn-add:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* List transition animations */
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.list-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.list-leave-active {
  position: absolute;
}
</style>
