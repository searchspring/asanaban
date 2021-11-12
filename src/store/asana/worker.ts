import store from "@/store";

// export start function
export function startWorkers() {
  self.setTimeout(() => {
    processActions();
  }, 1000);
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
    const action = state.actions.shift();
    action()
      .then(() => {
        console.info();
      })
      .catch((error) => {
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
