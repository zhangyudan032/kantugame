<template>
  <div class="modal-backdrop">
    <div class="modal-card result-modal" :class="type">
      <h2>{{ title }}</h2>
      <p v-if="type === 'wrong'" class="result-detail">
        正确答案：<strong>{{ answer }}</strong>
      </p>
      <button class="btn primary full" @click="$emit('confirm')">
        继续答题
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  type: "correct" | "wrong";
  answer?: string;
}>();

const title = computed(() =>
  props.type === "correct" ? "恭喜您，答对了" : "很遗憾，答错了"
);
</script>
