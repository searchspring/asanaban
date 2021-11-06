import { createStore } from "vuex";
import asana from "./asana";
import preferences from "./preferences";
import jsonstore from "../utils/jsonstore";

export default createStore({
  state: {
    signedIn: jsonstore.has("user"),
  },
  modules: {
    asana: asana,
    preferences: preferences,
  },
});
