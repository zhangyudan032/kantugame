import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import App from "./App.vue";
import { routes } from "./router";
import { bindPageClose, initAnalytics, trackPageView } from "./utils/analytics";
import "./styles.css";

const router = createRouter({
  history: createWebHistory(),
  routes,
});

initAnalytics();
bindPageClose();

router.afterEach((to) => {
  trackPageView(to.fullPath, document.title);
});

createApp(App).use(router).mount("#app");
