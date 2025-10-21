<template>
  <div class="content-wrapper">
    <div class="center-content">
      <h1>Account</h1>
      <div class="account-info">
        <v-avatar size="80" color="orange">
          <span class="text-white text-h4">E</span>
        </v-avatar>
        <h2 class="mt-4">User Account</h2>
        <p class="text-secondary">Manage your account settings and preferences</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.content-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 2rem;
}

.center-content {
  max-width: 720px;
  width: 100%;
}

h1 {
  color: #20808d;
  margin-bottom: 2rem;
}

.account-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  background-color: #f7f7f7;
  border-radius: 12px;
}

h2 {
  color: #202020;
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.text-secondary {
  color: #666;
}
</style>
