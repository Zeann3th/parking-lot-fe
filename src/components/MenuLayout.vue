<script setup lang="ts">
import { useAuth } from '@/composables/auth';
import type { MenuItem } from 'primevue/menuitem';
import { ref } from 'vue';
import { useMobile } from '@/composables/screen';
import SideBar from './SideBar.vue';
import MenuBar from './MenuBar.vue';
import { memoryStorage } from '@/storage';
import router from '@/router';
import axios from 'axios';

const { isMobile } = useMobile();
const { role, username } = useAuth();

const items = ref<MenuItem[]>([
  { label: "Dashboard", icon: "pi pi-fw pi-chart-bar", url: "/dashboard" },
]);

if (role.value === "ADMIN" || role.value === "SECURITY") {
  items.value.push(
    { label: "Tickets", icon: "pi pi-fw pi-ticket", url: "/tickets" },
    { label: "Residences", icon: "pi pi-fw pi-home", url: "/residences" },
    { label: "Sections", icon: "pi pi-fw pi-warehouse", url: "/sections" },
    { label: "Vehicles", icon: "pi pi-fw pi-car", url: "/vehicles" },
  );
}

if (role.value === "ADMIN" || role.value === "USER") {
  items.value.push({ label: "Transactions", icon: "pi pi-fw pi-receipt", url: "/transactions" });
}

const userProfile: MenuItem[] = [
  { label: username.value, icon: "pi pi-fw pi-user", url: "#" },
  { separator: true },
  { label: "Inbox", icon: "pi pi-fw pi-inbox", url: "/inbox" },
  { label: "Settings", icon: "pi pi-fw pi-cog", url: "/settings" },
  {
    label: "Sign Out",
    icon: "pi pi-fw pi-sign-out",
    url: "#",
    command: async () => {

      const { status } = await axios.get('auth/logout');
      if (status === 204) {
        memoryStorage.clearToken();
        router.push('/sign-in');
      }
    },
  }
];
</script>

<template>
  <SideBar v-if="!isMobile" :items="items" :userProfile="userProfile">
    <slot />
  </Sidebar>

  <MenuBar v-else :items="items" :userProfile="userProfile">
    <slot />
  </MenuBar>
</template>
