<template>
  <section class="card game-card">
    <div class="game-head">
      <div class="game-title">
        <span class="pill">本局任务</span>
        <h2>看图猜词</h2>
        <p class="muted">看图 → 输入词语 → 提交答案</p>
      </div>
      <button
        class="btn ghost logout-btn"
        type="button"
        @click="handleLogout"
        :disabled="loggingOut"
      >
        {{ loggingOut ? "退出中..." : "退出登录" }}
      </button>
    </div>

    <div class="stepper">
      <div class="step"><span class="step-num">1</span>看图</div>
      <div class="step"><span class="step-num">2</span>输入词语</div>
      <div class="step"><span class="step-num">3</span>提交</div>
    </div>

    <div v-if="loading" class="loading-block">
      <div class="skeleton image"></div>
      <div class="skeleton line"></div>
      <div class="skeleton line short"></div>
    </div>

    <template v-else>
      <div class="label">题目图片</div>
      <div class="image-frame">
        <img
          v-if="question"
          :src="question.imageUrl"
          alt="题目图片"
          @load="imageLoading = false"
          @error="imageLoading = false"
        />
        <div v-if="imageLoading" class="image-loading">图片加载中...</div>
      </div>

      <div v-if="result" class="result-banner" :class="result.isCorrect ? 'ok' : 'bad'">
        <span v-if="result.isCorrect">🎉 答对了！</span>
        <span v-else>❌ 正确答案：{{ result.correctAnswer }}</span>
      </div>

      <div v-else class="answer-area">
        <label class="field">
          <span>你的答案</span>
          <input
            v-model.trim="answer"
            type="text"
            placeholder="请输入你猜到的词语..."
            :disabled="submitting"
            @keyup.enter="submitAnswer"
          />
        </label>
        <p class="muted hint">提示：仔细观察图片里的物体或动作。</p>
        <div v-if="inputError" class="error small">{{ inputError }}</div>
      </div>

      <div class="actions">
        <button
          v-if="!result"
          class="btn primary"
          type="button"
          @click="submitAnswer"
          :disabled="submitting"
        >
          {{ submitting ? "提交中..." : "提交答案" }}
        </button>
        <button v-else class="btn primary" type="button" @click="nextQuestion">
          下一题
        </button>
      </div>
    </template>
  </section>

  <StatsModal v-if="stats" :stats="stats" @confirm="confirmExit" />
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
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

const router = useRouter();
const question = ref<Question | null>(null);
const loading = ref(true);
const imageLoading = ref(true);
const answer = ref("");
const inputError = ref("");
const submitting = ref(false);
const result = ref<AnswerResponse | null>(null);
const stats = ref<LogoutResponse["stats"] | null>(null);
const loggingOut = ref(false);

const fetchQuestion = async () => {
  loading.value = true;
  imageLoading.value = true;
  inputError.value = "";
  result.value = null;
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
    inputError.value = "获取题目失败，请稍后重试";
  } finally {
    loading.value = false;
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
  } catch {
    inputError.value = "提交失败，请稍后重试";
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

onMounted(fetchQuestion);
</script>
