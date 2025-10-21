<template>
  <div
    class="sidebar-wrapper"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <div class="sidebar-container" :class="{ expanded: isHovered }">
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
          <div
            class="nav-item"
            :class="{ active: activeItem === 'today' }"
            @click="activeItem = 'today'"
          >
            <v-icon class="nav-icon">mdi-calendar-today</v-icon>
            <span class="nav-label">Today</span>
          </div>

          <div
            class="nav-item"
            :class="{ active: activeItem === 'journal' }"
            @click="activeItem = 'journal'"
          >
            <v-icon class="nav-icon">mdi-book-open-outline</v-icon>
            <span class="nav-label">Journal</span>
          </div>

          <div
            class="nav-item"
            :class="{ active: activeItem === 'schedule' }"
            @click="activeItem = 'schedule'"
          >
            <v-icon class="nav-icon">mdi-calendar-outline</v-icon>
            <span class="nav-label">Schedule</span>
          </div>
        </div>

        <!-- Bottom items -->
        <div class="bottom-items">
          <div class="nav-item account-item">
            <v-avatar size="32" color="orange">
              <span class="text-white">E</span>
            </v-avatar>
            <span class="nav-label">Account</span>
          </div>
        </div>
      </div>

      <!-- Right column: Expanded panel -->
      <transition name="slide-fade">
        <div v-if="isHovered" class="expanded-panel">
          <div v-if="activeItem === 'today'" class="panel-content">
            <div class="panel-header">
              <h3>Today</h3>
              <v-btn icon size="small" variant="text">
                <v-icon size="18">mdi-pin-outline</v-icon>
              </v-btn>
            </div>
            <div class="panel-items">
              <div class="panel-item">
                <v-icon size="18" class="item-icon">mdi-clock-outline</v-icon>
                <span>Recent entries</span>
              </div>
              <div class="panel-item">
                <v-icon size="18" class="item-icon">mdi-phone-outline</v-icon>
                <span>Scheduled calls</span>
              </div>
              <div class="panel-item">
                <v-icon size="18" class="item-icon">mdi-calendar-check</v-icon>
                <span>Today's tasks</span>
              </div>
            </div>
          </div>

          <div v-if="activeItem === 'journal'" class="panel-content">
            <div class="panel-header">
              <h3>Journal</h3>
              <v-btn icon size="small" variant="text">
                <v-icon size="18">mdi-pin-outline</v-icon>
              </v-btn>
            </div>
            <div class="panel-items">
              <div class="panel-item">
                <v-icon size="18" class="item-icon">mdi-file-document-outline</v-icon>
                <span>All entries</span>
              </div>
              <div class="panel-item">
                <v-icon size="18" class="item-icon">mdi-star-outline</v-icon>
                <span>Favorites</span>
              </div>
              <div class="panel-item">
                <v-icon size="18" class="item-icon">mdi-archive-outline</v-icon>
                <span>Archived</span>
              </div>
            </div>
          </div>

          <div v-if="activeItem === 'schedule'" class="panel-content">
            <div class="panel-header">
              <h3>Schedule</h3>
              <v-btn icon size="small" variant="text">
                <v-icon size="18">mdi-pin-outline</v-icon>
              </v-btn>
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
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const activeItem = ref('today');
const isHovered = ref(false);
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
}

.nav-item:hover {
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
  margin-bottom: 16px;
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
</style>
