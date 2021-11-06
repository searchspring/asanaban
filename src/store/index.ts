import { createStore } from "vuex";
import asana from "./asana";
import jsonstore from "../utils/jsonstore";

export default createStore({
  state: {
    signedIn: jsonstore.has("user"),
  },
  modules: {
    asana: asana,
  },
});
