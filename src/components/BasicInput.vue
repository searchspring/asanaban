<template>
  <n-space vertical>
    <n-input 
      ref="inputInstRef"
      v-model:value="inputValue" 
      type="text" 
      placeholder=""
      @update:value="updateInput"
    />
  </n-space>
</template>

<script lang="ts">

import { defineComponent, ref, onMounted } from 'vue';
import { NInput, NSpace, InputInst } from 'naive-ui';

export default defineComponent({
  components: { NInput, NSpace },
  props: {
    input: {
      type: String,
    }
  },
  setup (props, { emit }) {
    const inputInstRef = ref<InputInst | null>(null);
    const inputValue = ref<string>("");

    const updateInput = (input: string) => {
      emit("update:input", input);
    };

    const handleFocus = () => {
      inputInstRef.value?.focus();
    };

    onMounted(() => {
      handleFocus();

      if (!props.input) {
        inputValue.value = "";
      } else {
        inputValue.value = props.input;
      }

    });

    return {
      inputInstRef,
      inputValue,
      handleFocus,
      updateInput,
    }
  }
});
</script>