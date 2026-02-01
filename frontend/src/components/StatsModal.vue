<template>
  <div class="modal-backdrop">
    <div class="modal-card">
      <h2>本次答题统计</h2>
      <div class="stat-row">
        <span class="stat-label">✅ 答对</span>
        <span class="stat-value">{{ stats.correctCount }} 题</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">❌ 答错</span>
        <span class="stat-value">{{ stats.wrongCount }} 题</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">🎯 正确率</span>
        <span class="stat-value">{{ stats.accuracy }}%</span>
      </div>
      <button class="btn primary full" @click="$emit('confirm')">
        确认退出
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  stats: {
    correctCount: number;
    wrongCount: number;
    accuracy: number;
  };
}>();
</script>
