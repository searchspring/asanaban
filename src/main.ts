import { createApp } from "vue";
import App from "./App.vue";
import "./registerServiceWorker";
import router from "./router";
import { VuesticPlugin } from 'vuestic-ui';
import 'vuestic-ui/dist/vuestic-ui.css';
import { createPinia } from "pinia";

const app = createApp(App);
app.use(createPinia());
app.use(router)
app.use(VuesticPlugin);
app.mount("#app");