<template>
  <section class="card">
    <div class="card-head">
      <div class="pill">Admin</div>
      <h2>题库生成与健康检查</h2>
      <p class="muted">仅管理员可访问此页面。</p>
    </div>

    <div v-if="loading" class="loading-block">
      <div class="skeleton line"></div>
      <div class="skeleton line"></div>
      <div class="skeleton line short"></div>
    </div>

    <template v-else>
      <div v-if="error" class="result-banner bad">{{ error }}</div>

      <template v-else>
        <div class="stat-row">
          <span>服务状态</span>
          <span>{{ health?.ok ? "正常" : "异常" }}</span>
        </div>
        <div class="stat-row">
          <span>题目数量</span>
          <span>{{ health?.counts.questions ?? 0 }}</span>
        </div>
        <div class="stat-row">
          <span>用户数量</span>
          <span>{{ health?.counts.users ?? 0 }}</span>
        </div>
        <div class="stat-row">
          <span>答题数量</span>
          <span>{{ health?.counts.answers ?? 0 }}</span>
        </div>
        <div class="stat-row">
          <span>环境</span>
          <span>{{ health?.server.nodeEnv ?? "-" }}</span>
        </div>
        <div class="stat-row">
          <span>更新时间</span>
          <span>{{ health?.timestamp ?? "-" }}</span>
        </div>
      </template>
    </template>

    <form class="form" @submit.prevent="handleGenerate">
      <label class="field">
        <span>生成题量（1 - 20）</span>
        <input v-model.number="count" type="number" min="1" max="20" />
      </label>
      <div class="actions">
        <button class="btn primary" type="submit" :disabled="submitting">
          {{ submitting ? "生成中..." : "生成题目" }}
        </button>
        <button class="btn ghost" type="button" :disabled="loading" @click="fetchHealth">
          刷新状态
        </button>
      </div>
    </form>

    <div v-if="message" class="result-banner" :class="messageType">{{ message }}</div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { apiRequest, type ApiError } from "../api";

type HealthResponse = {
  ok: boolean;
  timestamp: string;
  counts: {
    questions: number;
    users: number;
    answers: number;
  };
  server: {
    nodeEnv: string;
  };
};

type GenerateResponse = {
  ok: boolean;
  requested: number;
  generated: number;
  saved: number;
};

const router = useRouter();
const loading = ref(true);
const submitting = ref(false);
const health = ref<HealthResponse | null>(null);
const error = ref("");
const message = ref("");
const messageType = ref<"ok" | "bad">("ok");
const count = ref(5);

const handleAuthError = async (apiError: ApiError) => {
  if (apiError.status === 401) {
    await router.push("/login");
    return true;
  }
  if (apiError.status === 403) {
    error.value = "无权限访问，请使用管理员账号登录。";
    return true;
  }
  return false;
};

const fetchHealth = async () => {
  loading.value = true;
  error.value = "";
  try {
    const data = await apiRequest<HealthResponse>("/api/admin/health");
    health.value = data;
  } catch (err) {
    const apiError = err as ApiError;
    if (!(await handleAuthError(apiError))) {
      error.value = apiError.message || "获取健康检查失败";
    }
  } finally {
    loading.value = false;
  }
};

const handleGenerate = async () => {
  message.value = "";
  const safeCount = Math.max(1, Math.min(20, Math.floor(Number(count.value) || 0)));
  count.value = safeCount;
  submitting.value = true;
  try {
    const data = await apiRequest<GenerateResponse>("/api/admin/generate", {
      method: "POST",
      body: JSON.stringify({ count: safeCount }),
    });
    messageType.value = "ok";
    message.value = `本次请求 ${data.requested} 题，生成 ${data.generated} 题，入库 ${data.saved} 题。`;
    await fetchHealth();
  } catch (err) {
    const apiError = err as ApiError;
    messageType.value = "bad";
    if (!(await handleAuthError(apiError))) {
      message.value = apiError.message || "生成题目失败";
    }
  } finally {
    submitting.value = false;
  }
};

onMounted(fetchHealth);
</script>
