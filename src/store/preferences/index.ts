import jsonstore from "../../utils/jsonstore";
import { State } from "./state";
import { TaskAndSectionId } from "@/types/asana";
import { defineStore } from "pinia";
import { useAsanaStore } from "../asana";

export const usePrefStore = defineStore("preferences", {
  state: (): State => ({
    columnStates: jsonstore.get("columnStates", {}),
    swimlaneStates: jsonstore.get("swimlaneStates", {}),
    search: "",
    taskEditorSectionIdAndTask: null,
    backgroundImage: jsonstore.get("backgroundImage", null)
  }),
  actions: {
    TOGGLE_COLUMN(gid: string) {
      if (!this.columnStates[gid]) {
        this.columnStates[gid] = { collapsed: false };
      }
      this.columnStates[gid] = {
        collapsed: !this.columnStates[gid].collapsed,
      };
      jsonstore.set("columnStates", this.columnStates);
    },

    TOGGLE_SWIMLANE(swimlaneName: string) {
      if (!this.swimlaneStates[swimlaneName]) {
        this.swimlaneStates[swimlaneName] = { collapsed: false };
      }
      this.swimlaneStates[swimlaneName] = {
        collapsed: !this.swimlaneStates[swimlaneName].collapsed,
      };
      jsonstore.set("swimlaneStates", this.swimlaneStates);
    },

    SET_SEARCH(search: string) {
      this.search = search;
    },

    SET_NEW_TAGS(tags: string[]) {
      this.taskEditorSectionIdAndTask!.newTags = tags;
    },

    HIDE_TASK_EDITOR() {
      this.taskEditorSectionIdAndTask = null;
    },

    SHOW_TASK_EDITOR(sectionIdAndTask: TaskAndSectionId) {
      this.taskEditorSectionIdAndTask = sectionIdAndTask;
      if (sectionIdAndTask?.task?.gid) {
        useAsanaStore().LOAD_STORIES(sectionIdAndTask.task);
      }
    },

    SET_BACKGROUND(image: string | null) {
      jsonstore.set("backgroundImage", image);
      this.backgroundImage = image;
    }
  }
});
