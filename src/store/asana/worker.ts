import { AsanaError } from "@/types/asana";
import { useAsanaStore } from "./index2";

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
  await processAction();
  const nextTimeout = useAsanaStore().actions.length > 0 ? 0 : 1000;
  self.setTimeout(() => {
    processActions();
  }, nextTimeout);
}

async function processAction(): Promise<void> {
  const asanaStore = useAsanaStore();
  while (asanaStore.actions.length > 0) {
    const action = asanaStore.actions[0];
    try {
      await action.func();
      asanaStore.actions.shift();
      console.info("completed action");
    } catch (error: any) {
      asanaStore.actions.shift();
      if (
        error.value.errors[0].message.indexOf("does not exist in parent") ===
        -1
      ) {
        asanaStore.errors.push(error as AsanaError);
      }
      if (error.status !== 400 && error.status !== 401) {
        asanaStore.actions.push(action);
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
