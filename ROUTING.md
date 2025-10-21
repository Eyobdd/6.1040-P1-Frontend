# Vue Router Setup

This application now has Vue Router configured for page navigation.

## Current Routes

- `/` - Today page (main view)
- `/journal` - Journal page
- `/schedule` - Schedule page
- `/account` - Account page

## How to Add New Routes

### 1. Create a new view component

Create a new file in `src/views/`, for example `src/views/YourView.vue`:

```vue
<template>
  <div class="content-wrapper">
    <div class="center-content">
      <h1>Your Page Title</h1>
      <p>Your content here</p>
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
</style>
```

### 2. Add the route to the router

Edit `src/router/index.ts` and add your route to the `routes` array:

```typescript
{
  path: '/your-path',
  name: 'yourName',
  component: () => import('../views/YourView.vue'),
}
```

### 3. Add navigation link (optional)

To add a link in the sidebar, edit `src/components/Sidebar/Sidebar.vue`:

1. Add a `router-link` in the template
2. Update the `activeItem` computed property to include your route

## Navigation

Use `<router-link>` for navigation:

```vue
<router-link to="/your-path">Link Text</router-link>
```

Or programmatically with the router:

```typescript
import { useRouter } from 'vue-router';

const router = useRouter();
router.push('/your-path');
```

## Route Parameters

To add dynamic routes with parameters:

```typescript
{
  path: '/user/:id',
  name: 'user',
  component: () => import('../views/UserView.vue'),
}
```

Access params in the component:

```typescript
import { useRoute } from 'vue-router';

const route = useRoute();
const userId = route.params.id;
```
