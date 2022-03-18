import { sleep } from "@/utils/sleep";
import { useAsanaStore } from ".";
import { Action, WorkerError } from "./state";

let workersRunning = false;

// export start function
export function startWorkers() {
  if (workersRunning) return;
  workersRunning = true;

  self.setTimeout(() => {
    processActions();
  }, 1000);
  self.setTimeout(() => {
    reloadTasks();
  }, 5000);
}

async function processActions() {
  const asanaStore = useAsanaStore();
  const actions = asanaStore.actions;
  const errors = asanaStore.errors;

  while (workersRunning) {
    await processAction(actions, errors);
    await sleep(1000);
  }
}

async function processAction(actions: Action[], errors: WorkerError[]): Promise<void> {
  while (actions.length > 0) {
    const action = actions[0];
    if (action.isProcessing) {
      errors.push({
        message: "please reload page",
        description: "tried to process request while already being processed"
      });
      break;
    }
    action.isProcessing = true;
    try {
      action.retries++;
      await action.func();
      actions.shift();
      console.info("completed action");
    } catch (error: any) {
      actions.shift();
      if (
        error.value.errors[0].message.indexOf("does not exist in parent") ===
        -1
      ) {
        errors.push({
          message: error.message,
          description: error.value.errors[0].message
        });
      }
      if (error.status !== 400 && error.status !== 401) {
        action.isProcessing = false;
        if (action.retries > 2) {
          errors.push({
            message: "maximum retries for request",
            description: action.description
          });
        } else {
          actions.push(action);
        }
      }
    }
  }
}

async function reloadTasks() {
  const asanaStore = useAsanaStore();
  const actions = asanaStore.actions;

  while (workersRunning) {
    if (actions.length === 0) {
      asanaStore.LOAD_AND_MERGE_TASKS();
    }
    await sleep(5000);
  }
}