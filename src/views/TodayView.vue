<template>
  <div class="content-wrapper">
    <div class="center-content">
      <!-- Logo/Title -->
      <div class="app-logo">
        <img
          src="@/assets/ZienNameLogo.svg"
          alt="Zien"
          class="logo-image"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.content-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  padding: 0;
}

.center-content {
  max-width: 720px;
  width: 100%;
}

.app-logo {
  display: flex;
  justify-content: center;
  align-items: center;
}

.logo-image {
  height: 64px;
  width: auto;
}
</style>
