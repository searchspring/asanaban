import { State } from "./state";
import { defineStore } from "pinia";
import jsonstore from "@/utils/jsonstore";
import asana from "asana";
import Cookies from "js-cookie";
import CryptoJS from "crypto-js";
import { useAsanaStore } from "../asana";
import { User } from "@/types/asana";
import { startWorkers } from "../asana/worker";

export let asanaClient: asana.Client | null;

export const useAuthStore = defineStore("auth", {
  state: (): State => ({
    user: null
  }),
  getters: {
    LOGGED_IN: (state) => state.user !== null
  },
  actions: {
    LOGIN(): void {
      const codeVerifier = "12345678901234567890123456789012345678901234567890";
      const codeChallenge = base64URL(CryptoJS.SHA256(codeVerifier));

      const url =
        "https://app.asana.com/-/oauth_authorize" +
        "?client_id=1201298517859389" +
        "&redirect_uri=" + location.protocol + "//" + location.host + "/api" +
        "&response_type=code" +
        "&code_challenge_method=S256" +
        "&code_challenge=" + codeChallenge;

      self.location.href = url;
    },

    LOGIN_FRON_SESSION(): void {
      if (jsonstore.has("refresh_token")) {
        asanaClient = this.CREATE_CLIENT(
          Cookies.get("access_token")!,
          jsonstore.get("refresh_token")
        );
        this.SET_USER(jsonstore.get("user"));
      }
    },

    LOGOUT(): void {
      const asanaStore = useAsanaStore();
      Cookies.remove("access_token");
      jsonstore.clear();
      asanaClient = null;
      asanaStore.$reset();
      this.user = null;
    },

    SET_USER(user: User): void {
      this.user = user;
      jsonstore.set("user", user);
    },

    TOKEN_RECIEVED(payload: any): boolean {
      if (payload.error) {
        console.error(payload);
        return false;
      }

      const oneHourFromNow = new Date(new Date().getTime() + 60 * 60 * 1000);

      const access_token = payload.access_token ?? "";
      const refresh_token = payload.refresh_token ?? "";
      const data = payload.data ?? {};
      
      Cookies.set("access_token", access_token, {
        expires: oneHourFromNow ,
      });
      jsonstore.set("refresh_token", refresh_token);
      this.SET_USER(data);

      asanaClient = this.CREATE_CLIENT(access_token, refresh_token);

      return true;
    },

    CREATE_CLIENT(accessToken: string, refreshToken: string) {
      const client = asana.Client.create();

      client.dispatcher.handleUnauthorized = (async () => {
        const asanaStore = useAsanaStore();
        console.error("failed to perform action - signing in again");
        asanaStore.CLEAR_ACTIONS();
        asanaStore.CLEAR_ERRORS();
        this.LOGIN();
      }) as any;

      client.dispatcher.retryOnRateLimit = true;

      const credentials = {
        access_token: accessToken,
        refresh_token: refreshToken,
      };

      client.useOauth({
        credentials: credentials,
      });

      startWorkers();
      return client;
    }
  }
});

function base64URL(string: CryptoJS.lib.WordArray) {
  return string
    .toString(CryptoJS.enc.Base64)
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}