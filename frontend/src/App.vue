<template>
  <div class="app" :class="{ 'game-mode': hideShell }">
    <header v-if="!hideShell" class="brand">
      <div class="brand-mark">🖼️</div>
      <div class="brand-text">
        <p class="brand-kicker">看图猜词小游戏</p>
        <h1>看图猜词 · 眼力挑战</h1>
      </div>
    </header>
    <main class="main">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" :key="route.fullPath" />
        </transition>
      </router-view>
    </main>
    <footer v-if="!hideShell" class="foot">
      <span>看得准、猜得快，挑战你的观察力！</span>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const hideShell = computed(() => ["/game", "/empty", "/admin"].includes(route.path));
</script>
