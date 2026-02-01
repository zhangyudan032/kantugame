import type { RouteRecordRaw } from "vue-router";
import LoginPage from "./pages/LoginPage.vue";
import GamePage from "./pages/GamePage.vue";
import EmptyPage from "./pages/EmptyPage.vue";

export const routes: RouteRecordRaw[] = [
  { path: "/", redirect: "/login" },
  { path: "/login", component: LoginPage },
  { path: "/game", component: GamePage },
  { path: "/empty", component: EmptyPage },
];
