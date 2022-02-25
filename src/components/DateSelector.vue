<template>
    <va-date-input
    label="due date"
    v-model="value"
    :format="formatDate"
    :parse="parseFn"
    :placeholder="placeholder"
    clearable
    manual-input
    @update:modelValue="customChange"
  />
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from "vue";
import { parse } from "date-fns";
import store from "@/store";

export default defineComponent ({
  props: {
    date: {
      type: String,
      required: true
    }
  },
  setup(props, { emit }) {
    const value = ref<Date>();
    const formatString = store.state["preferences"].dateFormatString as string;
    const placeholder = formatString.toLowerCase();

    const formatDate = (date: Date | undefined) => {
      return store.getters["preferences/formattedDate"](date);
    };

    const parseFn = (event: Event) => {
      const dateString = (event.target as HTMLInputElement).value;
      return parse(dateString, formatString, new Date());
    };

    const customChange = (date: Date) => {
      emit("customChange", date);
    }

    onMounted(() => {
      const date = props.date;
      if (date === "") {
        value.value = undefined;
      } else {
        value.value = parse(date, formatString, new Date());
      }
    });

    return {
      value,
      placeholder,
      formatDate,
      parseFn,
      customChange,
    }
  }
});
</script>