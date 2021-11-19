import { createApp } from "vue";
import App from "./App.vue";
import "./registerServiceWorker";
import router from "./router";
import store from "./store";
import { quillEditor } from "vue3-quill";

createApp(App).use(quillEditor).use(store).use(router).mount("#app");
