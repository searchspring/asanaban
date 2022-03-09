import { AsanaError } from "@/types/asana";
import { useAsanaStore } from ".";
import { Action } from "./state";

// export start function
export function startWorkers() {
  self.setTimeout(() => {
    processActions();
  }, 1000);
  self.setTimeout(() => {
    reloadTasks();
  }, 5000);
}

async function processActions() {
  const asanaStore = useAsanaStore();
  await processAction(asanaStore.actions, asanaStore.errors);
  const nextTimeout = asanaStore.actions.length > 0 ? 0 : 1000;
  self.setTimeout(() => {
    processActions();
  }, nextTimeout);
}

async function processAction(actions: Action[], errors: AsanaError[]): Promise<void> {
  while (actions.length > 0) {
    const action = actions[0];
    try {
      await action.func();
      actions.shift();
      console.info("completed action");
    } catch (error: any) {
      actions.shift();
      console.log(error);
      if (
        error.value.errors[0].message.indexOf("does not exist in parent") ===
        -1
      ) {
        errors.push(error as AsanaError);
      }
      if (error.status !== 400 && error.status !== 401) {
        actions.push(action);
      }
    }
  }
}

async function reloadTasks() {
  const asanaStore = useAsanaStore();
  if (asanaStore.actions.length === 0) {
    asanaStore.LOAD_AND_MERGE_TASKS();
  }
  self.setTimeout(() => {
    reloadTasks();
  }, 5000);
}
