<template>
  <div class="app">
    <header class="brand">
      <div class="brand-mark">🖼️</div>
      <div class="brand-text">
        <p class="brand-kicker">看图猜词小游戏</p>
        <h1>看图猜词 · 眼力挑战</h1>
      </div>
    </header>
    <main class="main">
      <transition name="page" mode="out-in">
        <router-view />
      </transition>
    </main>
    <footer class="foot">
      <span>看得准、猜得快，挑战你的观察力！</span>
    </footer>
  </div>
</template>
