<template>
  <div 
    class="sidebar-wrapper"
    @mouseleave="handleSidebarLeave"
  >
    <nav class="sidebar-container" :class="{ expanded: hoveredItem !== null }" aria-label="Main navigation">
      <!-- Left column: Navigation icons -->
      <div class="nav-column">
        <!-- Logo at top -->
        <div class="logo-container">
          <img
            src="@/assets/ZienSymbolLogo.svg"
            alt="Zien Logo"
            class="logo"
          />
        </div>

        <!-- Main navigation items -->
        <div class="nav-items">
          <router-link 
            to="/" 
            class="nav-item" 
            :class="{ active: activeItem === 'dayView', hovering: hoveredItem === 'dayView' }"
            @mouseenter="handleItemEnter('dayView')"
            @mouseleave="handleItemLeave"
            aria-label="Day View"
          >
            <v-icon class="nav-icon">mdi-calendar-today</v-icon>
            <span class="nav-label">Day View</span>
          </router-link>

          <router-link 
            to="/journal" 
            class="nav-item" 
            :class="{ active: activeItem === 'journal', hovering: hoveredItem === 'journal' }"
            @mouseenter="handleItemEnter('journal')"
            @mouseleave="handleItemLeave"
            aria-label="Journal"
          >
            <v-icon class="nav-icon">mdi-book-open-outline</v-icon>
            <span class="nav-label">Journal</span>
          </router-link>

          <router-link 
            to="/schedule" 
            class="nav-item" 
            :class="{ active: activeItem === 'schedule', hovering: hoveredItem === 'schedule' }"
            @mouseenter="handleItemEnter('schedule')"
            @mouseleave="handleItemLeave"
            aria-label="Schedule"
          >
            <v-icon class="nav-icon">mdi-calendar-outline</v-icon>
            <span class="nav-label">Schedule</span>
          </router-link>
        </div>

        <!-- Bottom items -->
        <div class="bottom-items">
          <router-link 
            to="/account"
            class="nav-item account-item" 
            :class="{ active: activeItem === 'account', hovering: hoveredItem === 'account' }"
            @mouseenter="handleItemEnter('account')"
            @mouseleave="handleItemLeave"
            aria-label="Account"
          >
            <v-avatar size="32" color="orange">
              <span class="text-white">E</span>
            </v-avatar>
            <span class="nav-label">Account</span>
          </router-link>
        </div>
      </div>

      <!-- Right column: Expanded panel -->
      <transition name="slide-fade">
        <div 
          v-if="hoveredItem !== null" 
          class="expanded-panel"
          @mouseenter="cancelHideTimeout"
          @mouseleave="handleItemLeave"
          role="region"
          :aria-label="`${hoveredItem} menu`"
        >
          <div v-if="hoveredItem === 'dayView'" class="panel-content">
            <div class="panel-header">
              <h3>Day View</h3>
            </div>
            <div class="panel-items">
              <div class="panel-item" @click="handleGoToDayView">
                <v-icon size="18" class="item-icon">mdi-calendar-today</v-icon>
                <span>Day View</span>
              </div>
              <div class="button-wrapper">
                <div 
                  class="panel-item call-item" 
                  :class="{ disabled: isCallCompleted }"
                  @click="handleInitiateCall"
                  role="button"
                  tabindex="0"
                  @keyup.enter="handleInitiateCall"
                  aria-label="Initiate call for today"
                >
                  <v-icon size="18" class="item-icon">mdi-phone-outline</v-icon>
                  <span>Initiate Call</span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="hoveredItem === 'journal'" class="panel-content">
            <div class="panel-header">
              <h3>Journal</h3>
            </div>
            <div class="panel-items">
              <div class="panel-item">
                <v-icon size="18" class="item-icon">mdi-star-outline</v-icon>
                <span>Favourite Entries</span>
              </div>
              <div class="panel-item">
                <v-icon size="18" class="item-icon">mdi-message-text-outline</v-icon>
                <span>Current Prompts</span>
              </div>
              <div class="panel-item">
                <v-icon size="18" class="item-icon">mdi-archive-outline</v-icon>
                <span>Past Entries</span>
              </div>
            </div>
          </div>

          <div v-if="hoveredItem === 'schedule'" class="panel-content">
            <div class="panel-header">
              <h3>Schedule</h3>
            </div>
            <div class="panel-items">
              <div class="panel-item">
                <v-icon size="18" class="item-icon">mdi-calendar-clock</v-icon>
                <span>Upcoming calls</span>
              </div>
              <div class="panel-item">
                <v-icon size="18" class="item-icon">mdi-calendar-check</v-icon>
                <span>Availability</span>
              </div>
              <div class="panel-item">
                <v-icon size="18" class="item-icon">mdi-history</v-icon>
                <span>Past calls</span>
              </div>
            </div>
          </div>

          <div v-if="hoveredItem === 'account'" class="panel-content">
            <div class="panel-header">
              <h3>Account</h3>
            </div>
            <div class="panel-items">
              <div class="panel-item">
                <v-icon size="18" class="item-icon">mdi-cog-outline</v-icon>
                <span>Settings</span>
              </div>
              <div class="panel-item">
                <v-icon size="18" class="item-icon">mdi-help-circle-outline</v-icon>
                <span>Help & Feedback</span>
              </div>
              <div class="button-wrapper">
                <div 
                  class="panel-item logout-item" 
                  @click="handleLogout"
                  role="button"
                  tabindex="0"
                  @keyup.enter="handleLogout"
                  aria-label="Logout from your account"
                >
                  <v-icon size="18" class="item-icon">mdi-logout</v-icon>
                  <span>Logout</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '@/services/api';

const route = useRoute();
const router = useRouter();

const activeItem = computed(() => {
  const path = route.path;
  if (path === '/') return 'dayView';
  if (path === '/journal') return 'journal';
  if (path === '/schedule') return 'schedule';
  if (path === '/account') return 'account';
  return 'dayView';
});
const hoveredItem = ref<string | null>(null);
let hideTimeout: ReturnType<typeof setTimeout> | null = null;

// TODO: Replace with actual call status check from API
const isCallCompleted = ref(false);

const handleItemEnter = (item: string) => {
  // Cancel any pending hide timeout
  cancelHideTimeout();
  // Set the hovered item
  hoveredItem.value = item;
};

const handleItemLeave = () => {
  // Clear any existing timeout
  if (hideTimeout) {
    clearTimeout(hideTimeout);
  }
  // Wait 500ms before hiding the panel
  hideTimeout = setTimeout(() => {
    hoveredItem.value = null;
  }, 500);
};

const handleSidebarLeave = () => {
  // Immediately hide when leaving the entire sidebar
  cancelHideTimeout();
  hoveredItem.value = null;
};

// Clear timeout when hovering back over icon or panel
const cancelHideTimeout = () => {
  if (hideTimeout) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }
};

const handleGoToDayView = () => {
  router.push('/');
};

const handleInitiateCall = () => {
  if (isCallCompleted.value) return;
  // TODO: Implement call initiation logic
  console.log('Initiating call...');
  // Keep panel open so user can see the action
};

const handleLogout = async () => {
  try {
    // Call backend logout endpoint
    await api.post('UserAuthentication/logout', {});
    
    // Clear local token
    api.clearToken();
    localStorage.removeItem('phoneNumber');
    
    // Redirect to auth page
    router.push('/auth');
  } catch (error) {
    console.error('Logout failed:', error);
    // Even if backend fails, clear local state and redirect
    api.clearToken();
    localStorage.removeItem('phoneNumber');
    router.push('/auth');
  }
};
</script>

<style scoped>
.sidebar-wrapper {
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  z-index: 1000;
}

.sidebar-container {
  display: flex;
  height: 100vh;
  background-color: #f7f7f7;
  border-right: 1px solid #e5e5e5;
  transition: all 0.3s ease;
}

.sidebar-container.expanded {
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
}

/* Left column: Navigation icons */
.nav-column {
  width: 72px;
  display: flex;
  flex-direction: column;
  padding: 16px 0;
  flex-shrink: 0;
}

.logo-container {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
  padding: 0 16px;
}

.logo {
  width: 32px;
  height: auto;
}

.nav-items {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 0;
  cursor: pointer;
  color: #666;
  transition: all 0.2s ease;
  position: relative;
  text-decoration: none;
}

.nav-item:hover {
  color: #20808d;
  background-color: rgba(32, 128, 141, 0.08);
}

.nav-item.hovering {
  color: #20808d;
  background-color: rgba(32, 128, 141, 0.08);
}

.nav-item.active {
  color: #20808d;
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 32px;
  background-color: #20808d;
  border-radius: 0 2px 2px 0;
}

.nav-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.nav-label {
  font-size: 11px;
  font-weight: 500;
  text-align: center;
  white-space: nowrap;
}

.bottom-items {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  padding: 0 8px;
}

.account-item {
  padding: 8px 0 !important;
}

/* Right column: Expanded panel */
.expanded-panel {
  width: 200px;
  background-color: #f7f7f7;
  padding: 16px;
  overflow-y: auto;
}

.slide-fade-enter-active {
  transition: all 0.3s ease;
}

.slide-fade-leave-active {
  transition: all 0.2s ease;
}

.slide-fade-enter-from {
  transform: translateX(-10px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(-10px);
  opacity: 0;
}

.panel-content {
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  margin-bottom: 12px;
  border-bottom: 1px solid #e5e5e5;
}

.panel-header h3 {
  font-size: 14px;
  font-weight: 600;
  color: #202020;
  margin: 0;
}

.panel-items {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.panel-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  font-size: 13px;
  color: #666;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.panel-item:hover {
  background-color: #f7f7f7;
  color: #202020;
}

.item-icon {
  color: #666;
  flex-shrink: 0;
}

.panel-item:hover .item-icon {
  color: #20808d;
}

.call-item {
  cursor: pointer;
  color: #20808d;
}

.call-item:hover {
  background: rgba(32, 128, 141, 0.08);
}

.call-item:hover .item-icon {
  color: #20808d;
}

.call-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}


.button-wrapper {
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid #e5e5e5;
}

.logout-item {
  color: #d32f2f;
}

.logout-item:hover {
  background: #ffebee;
  color: #ef4444;
}

.logout-item:hover .item-icon {
  color: #ef4444;
}
</style>
