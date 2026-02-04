<template>
  <section class="card auth-card">
    <div class="card-head">
      <div class="pill">开始答题</div>
      <h2>{{ mode === "login" ? "欢迎回来" : "新用户注册" }}</h2>
      <p class="muted">
        {{ mode === "login" ? "输入邮箱和密码继续游戏" : "创建账号后自动登录" }}
      </p>
    </div>

    <form class="form" @submit.prevent="handleSubmit">
      <label class="field">
        <span>邮箱</span>
        <input
          v-model.trim="email"
          type="email"
          placeholder="test@example.com"
          autocomplete="email"
        />
      </label>

      <label class="field">
        <span>密码</span>
        <input
          v-model="password"
          type="password"
          placeholder="至少 6 位"
          autocomplete="current-password"
        />
      </label>

      <label v-if="mode === 'register'" class="field">
        <span>确认密码</span>
        <input
          v-model="confirmPassword"
          type="password"
          placeholder="再输入一次"
          autocomplete="new-password"
        />
      </label>

      <div v-if="newUserNotice" class="notice">
        {{ newUserNotice }}
      </div>

      <div v-if="error" class="error">
        {{ error }}
      </div>

      <label class="remember">
        <input v-model="rememberMe" type="checkbox" />
        <span>记住我</span>
      </label>

      <button class="btn primary full" type="submit" :disabled="submitting">
        {{ submitting ? "处理中..." : mode === "login" ? "登录 / 注册" : "注册并登录" }}
      </button>
    </form>

    <div class="switch">
      <span>{{ mode === "login" ? "没有账号？" : "已经有账号？" }}</span>
      <button class="link" type="button" @click="toggleMode">
        {{ mode === "login" ? "去注册" : "去登录" }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { apiRequest, type ApiError } from "../api";
import { trackEvent } from "../utils/analytics";
import { isValidEmail } from "../utils/validators";

type AuthMode = "login" | "register";

const router = useRouter();
const route = useRoute();
const mode = ref<AuthMode>("login");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const rememberMe = ref(false);
const error = ref("");
const newUserNotice = ref("");
const submitting = ref(false);

const resetNotices = () => {
  error.value = "";
  newUserNotice.value = "";
};

const applyLogoutReset = () => {
  if (route.query.from !== "logout") return;
  resetNotices();
  mode.value = "login";
  email.value = "";
  password.value = "";
  confirmPassword.value = "";
  rememberMe.value = false;
  router.replace("/login");
};

watch(() => route.query.from, applyLogoutReset, { immediate: true });

const toggleMode = () => {
  resetNotices();
  mode.value = mode.value === "login" ? "register" : "login";
};

const handleSubmit = async () => {
  resetNotices();

  if (!isValidEmail(email.value)) {
    error.value = "请输入有效的邮箱地址";
    return;
  }

  if (password.value.length < 6) {
    error.value = "密码至少需要 6 位";
    return;
  }

  if (mode.value === "register" && confirmPassword.value !== password.value) {
    error.value = "两次密码不一致，请重新输入";
    return;
  }

  submitting.value = true;
  try {
    if (mode.value === "login") {
      await apiRequest<{ userId: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: email.value,
          password: password.value,
          rememberMe: rememberMe.value,
        }),
      });
      trackEvent("login", { method: "email" });
      await router.push("/game");
      return;
    }

    await apiRequest<{ userId: string }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: email.value,
        password: password.value,
        rememberMe: rememberMe.value,
      }),
    });
    trackEvent("sign_up", { method: "email" });
    await router.push("/game");
  } catch (err) {
    const apiError = err as ApiError;
    if (mode.value === "login") {
      if (apiError.code === "USER_NOT_FOUND" || apiError.status === 404) {
        mode.value = "register";
        newUserNotice.value =
          "检测到您是新用户，请确认密码后完成注册";
        return;
      }
      if (apiError.code === "INVALID_PASSWORD" || apiError.status === 401) {
        error.value = "密码错误，请重试";
        return;
      }
      if (apiError.code === "INVALID_EMAIL") {
        error.value = "请输入有效的邮箱地址";
        return;
      }
      error.value = apiError.message || "登录失败，请稍后重试";
      return;
    }

    if (apiError.code === "EMAIL_EXISTS") {
      error.value = "邮箱已被注册，请直接登录";
      mode.value = "login";
      return;
    }
    error.value = apiError.message || "注册失败，请稍后重试";
  } finally {
    submitting.value = false;
  }
};
</script>
