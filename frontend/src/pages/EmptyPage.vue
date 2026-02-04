<template>
  <section class="card empty-card">
    <div class="empty-emoji">🪄</div>
    <h2>你真是个答题小天才！</h2>
    <p class="muted">{{ retrying ? "题库补充中，请稍候..." : "题库正在更新中" }}</p>
    <div class="actions" style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      <button class="btn primary" type="button" @click="retryNow" :disabled="retrying">
        {{ retrying ? "加载中..." : "刷新看看" }}
      </button>
      <button v-if="isAdmin" class="btn ghost" type="button" @click="goAdmin">
        Admin
      </button>
      <button class="btn ghost" type="button" @click="backToLogin" :disabled="loading">
        {{ loading ? "返回中..." : "返回登录页" }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import { apiRequest } from "../api";
import { trackEvent } from "../utils/analytics";

type NextQuestionResponse =
  | { id: string; imageUrl: string }
  | { code: "NO_QUESTION" };

type MeResponse = {
  ok: boolean;
  user: {
    id: string | null;
    email: string | null;
    isAdmin: boolean;
  };
};

const router = useRouter();
const loading = ref(false);
const retrying = ref(false);
const isAdmin = ref(false);

let retryTimer: ReturnType<typeof setTimeout> | null = null;
let retryCount = 0;
const MAX_RETRIES = 6;

const checkForNewQuestions = async () => {
  try {
    const data = await apiRequest<NextQuestionResponse>("/api/questions/next");
    if (!("code" in data && data.code === "NO_QUESTION")) {
      await router.push("/game");
      return true;
    }
  } catch {
    // ignore
  }
  return false;
};

const retryNow = async () => {
  retrying.value = true;
  const found = await checkForNewQuestions();
  if (!found) {
    retrying.value = false;
  }
};

const autoRetry = async () => {
  if (retryCount >= MAX_RETRIES) return;
  retryCount++;
  retrying.value = true;
  const found = await checkForNewQuestions();
  if (!found) {
    retrying.value = false;
    retryTimer = setTimeout(autoRetry, 5000);
  }
};

const backToLogin = async () => {
  loading.value = true;
  try {
    await apiRequest("/api/auth/logout", { method: "POST" });
  } catch {
    // ignore
  } finally {
    trackEvent("logout", { via: "empty_page" });
    await router.push("/login");
    loading.value = false;
  }
};

const fetchMe = async () => {
  try {
    const data = await apiRequest<MeResponse>("/api/auth/me");
    isAdmin.value = Boolean(data.user?.isAdmin);
  } catch {
    // ignore
  }
};

const goAdmin = async () => {
  await router.push("/admin");
};

onMounted(() => {
  fetchMe();
  retryTimer = setTimeout(autoRetry, 3000);
});

onUnmounted(() => {
  if (retryTimer) clearTimeout(retryTimer);
});
</script>
