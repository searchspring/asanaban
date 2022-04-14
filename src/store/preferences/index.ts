import jsonstore from "../../utils/jsonstore";
import { State } from "./state";
import { Assignee, TaskAndSectionId, User } from "@/types/asana";
import { formattedDate } from "../../utils/date";
import { defineStore } from "pinia";
import { useAsanaStore } from "../asana";

export const usePrefStore = defineStore("preferences", {
  state: (): State => ({
    columnStates: jsonstore.get("columnStates", {}),
    swimlaneStates: jsonstore.get("swimlaneStates", {}),
    search: "",
    taskEditorSectionIdAndTask: null,
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

    SET_TASK_ASSIGNEE(assignee: User | null) {
      const gid = assignee?.gid ?? "null"; // in asana, to update a task to be unassigned, request must be made with gid of "null"
      const photo = (!assignee?.gid) ? undefined : assignee!.photo;

      if (this.taskEditorSectionIdAndTask?.task.assignee) {
        this.taskEditorSectionIdAndTask.task.assignee.gid = gid;
        this.taskEditorSectionIdAndTask.task.assignee.photo = photo;
      } else { 
        this.taskEditorSectionIdAndTask!.task.assignee = {
          gid: gid,
          photo: photo,
        } as Assignee;
      }
    },

    SET_NEW_TAGS(tags: string[]) {
      this.taskEditorSectionIdAndTask!.newTags = tags;
    },

    SET_DUE_DATE(date: Date | undefined) {
      const dateString = formattedDate(date);
      this.taskEditorSectionIdAndTask!.task.due_on = dateString;
    },

    HIDE_TASK_EDITOR() {
      this.taskEditorSectionIdAndTask = null;
    },

    SHOW_TASK_EDITOR(sectionIdAndTask: TaskAndSectionId) {
      this.taskEditorSectionIdAndTask = sectionIdAndTask;
      if (
        sectionIdAndTask &&
        sectionIdAndTask.task &&
        sectionIdAndTask.task.gid
      ) {
        useAsanaStore().LOAD_STORIES(sectionIdAndTask.task);
      }
    }
  }
});
