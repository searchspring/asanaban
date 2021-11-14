import store from "@/store";

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
  const nextTimeout = store.state["asana"].actions.length > 0 ? 0 : 1000;
  self.setTimeout(() => {
    processActions();
  }, nextTimeout);
}

async function processAction(): Promise<void> {
  const state = store.state["asana"];
  while (state.actions.length > 0) {
    const action = state.actions[0];
    await action
      .func()
      .then(() => {
        state.actions.shift();
        console.info("completed action");
      })
      .catch((error) => {
        state.actions.shift();
        if (
          error.value.errors[0].message.indexOf("does not exist in parent") ===
          -1
        ) {
          state.errors.push(error);
        }
        if (error.status !== 400) {
          state.actions.push(action);
        }
      });
  }
}

async function reloadTasks() {
  if (store.state["asana"].actions.length === 0) {
    await store.dispatch("asana/mergeTasks");
  }
  self.setTimeout(() => {
    reloadTasks();
  }, 5000);
}
