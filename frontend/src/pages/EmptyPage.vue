<template>
  <section class="card empty-card">
    <div class="empty-emoji">🪄</div>
    <h2>你真是个答题小天才！</h2>
    <p class="muted">题库正在更新中，请明日再来</p>
    <button class="btn primary" type="button" @click="backToLogin" :disabled="loading">
      {{ loading ? "返回中..." : "返回登录页" }}
    </button>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { apiRequest } from "../api";

const router = useRouter();
const loading = ref(false);

const backToLogin = async () => {
  loading.value = true;
  try {
    await apiRequest("/api/auth/logout", { method: "POST" });
  } catch {
    // ignore logout errors
  } finally {
    await router.push("/login");
    loading.value = false;
  }
};
</script>
