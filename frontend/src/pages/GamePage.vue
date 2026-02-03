<template>
  <section class="game-shell">
    <div class="game-topbar">
      <div class="game-actions">
        <button v-if="isAdmin" class="btn ghost tiny" type="button" @click="goAdmin">
          管理后台
        </button>
        <button class="btn ghost tiny" type="button" @click="handleLogout" :disabled="loggingOut">
          {{ loggingOut ? "退出中..." : "退出" }}
        </button>
      </div>
    </div>

    <section class="card game-card">
      <div v-if="loading" class="loading-block">
        <div class="skeleton image"></div>
        <div class="skeleton line"></div>
        <div class="skeleton line short"></div>
      </div>

      <template v-else>
        <div class="game-content">
          <div class="image-frame">
              <img
                v-if="question"
                :src="question.imageUrl"
                alt="题目图片"
                @load="imageLoading = false"
                @error="imageLoading = false"
              />
              <div v-if="imageLoading" class="image-loading">图片加载中...</div>

              <div v-if="showResult === 'correct'" class="result-overlay correct">
                <div class="firework firework-1">
                  <span v-for="n in 12" :key="n" class="firework-particle" :style="`--i:${n}`"></span>
                </div>
                <div class="firework firework-2">
                  <span v-for="n in 12" :key="n" class="firework-particle" :style="`--i:${n}`"></span>
                </div>
                <div class="firework firework-3">
                  <span v-for="n in 12" :key="n" class="firework-particle" :style="`--i:${n}`"></span>
                </div>
                <div class="result-text correct-text">答对啦！</div>
              </div>

              <div v-if="showResult === 'wrong'" class="result-overlay wrong">
                <div class="heart-break">
                  <span class="heart-half left">💔</span>
                </div>
                <div class="result-text wrong-text">答错了～</div>
                <div class="result-text wrong-answer">正确答案：{{ result?.correctAnswer }}</div>
              </div>
          </div>

          <div class="answer-area" :class="{ disabled: showResult }">
            <label class="field">
              <span>你的答案</span>
              <input
                v-model.trim="answer"
                type="text"
                placeholder="请输入你猜到的词语..."
                :disabled="submitting || showResult !== null"
                @keyup.enter="submitAnswer"
              />
            </label>
            <div v-if="inputError" class="error small">{{ inputError }}</div>
            <div class="actions">
              <button
                class="btn primary full"
                type="button"
                @click="submitAnswer"
                :disabled="submitting || showResult !== null"
              >
                {{ submitting ? "提交中..." : "提交答案" }}
              </button>
            </div>
          </div>
        </div>
      </template>
    </section>
  </section>

  <StatsModal v-if="stats" :stats="stats" @confirm="confirmExit" />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import { apiRequest, type ApiError } from "../api";
import StatsModal from "../components/StatsModal.vue";

type Question = {
  id: string;
  imageUrl: string;
};

type NextQuestionResponse =
  | { id: string; imageUrl: string }
  | { code: "NO_QUESTION" };

type AnswerResponse = {
  isCorrect: boolean;
  correctAnswer: string;
};

type LogoutResponse = {
  ok: boolean;
  stats?: {
    correctCount: number;
    wrongCount: number;
    accuracy: number;
  };
};

type MeResponse = {
  ok: boolean;
  user: {
    id: string | null;
    email: string | null;
    isAdmin: boolean;
  };
};

const router = useRouter();
const question = ref<Question | null>(null);
const loading = ref(true);
const imageLoading = ref(true);
const answer = ref("");
const inputError = ref("");
const submitting = ref(false);
const result = ref<AnswerResponse | null>(null);
const showResult = ref<"correct" | "wrong" | null>(null);
const stats = ref<LogoutResponse["stats"] | null>(null);
const loggingOut = ref(false);
const isAdmin = ref(false);

let autoAdvanceTimer: ReturnType<typeof setTimeout> | null = null;

const fetchQuestion = async () => {
  loading.value = true;
  imageLoading.value = true;
  inputError.value = "";
  result.value = null;
  showResult.value = null;
  try {
    const data = await apiRequest<NextQuestionResponse>("/api/questions/next");
    if ("code" in data && data.code === "NO_QUESTION") {
      await router.push("/empty");
      return;
    }
    question.value = { id: data.id, imageUrl: data.imageUrl };
  } catch (err) {
    const apiError = err as ApiError;
    if (apiError.status === 401) {
      await router.push("/");
      return;
    }
    inputError.value = apiError.message || "获取题目失败，请稍后重试";
  } finally {
    loading.value = false;
  }
};

const fetchMe = async () => {
  try {
    const data = await apiRequest<MeResponse>("/api/auth/me");
    isAdmin.value = Boolean(data.user?.isAdmin);
  } catch (err) {
    const apiError = err as ApiError;
    if (apiError.status === 401) {
      await router.push("/login");
    }
  }
};

const submitAnswer = async () => {
  inputError.value = "";
  if (!question.value) return;
  if (!answer.value.trim()) {
    inputError.value = "请输入答案";
    return;
  }

  submitting.value = true;
  try {
    const data = await apiRequest<AnswerResponse>("/api/answers/submit", {
      method: "POST",
      body: JSON.stringify({
        questionId: question.value.id,
        answer: answer.value.trim(),
      }),
    });
    result.value = data;
    showResult.value = data.isCorrect ? "correct" : "wrong";

    autoAdvanceTimer = setTimeout(() => {
      showResult.value = null;
      nextQuestion();
    }, 1000);
  } catch (err) {
    const apiError = err as ApiError;
    inputError.value = apiError.message || "提交失败，请稍后重试";
  } finally {
    submitting.value = false;
  }
};

const nextQuestion = async () => {
  answer.value = "";
  await fetchQuestion();
};

const handleLogout = async () => {
  loggingOut.value = true;
  try {
    const data = await apiRequest<LogoutResponse>("/api/auth/logout", {
      method: "POST",
    });
    if (data.stats) {
      stats.value = data.stats;
      return;
    }
    await router.push("/login");
  } catch (err) {
    const apiError = err as ApiError;
    inputError.value = apiError.message || "退出失败，请稍后重试";
  } finally {
    loggingOut.value = false;
  }
};

const confirmExit = async () => {
  stats.value = null;
  await router.push("/login");
};

const goAdmin = async () => {
  await router.push("/admin");
};

onMounted(() => {
  fetchMe();
  fetchQuestion();
});

onUnmounted(() => {
  if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);
});
</script>
