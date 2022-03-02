<template>
    <va-date-input
    label="due date"
    v-model="value"
    :format="formatDate"
    :parse="parseFn"
    :placeholder="placeholder"
    clearable
    manual-input
    @update:modelValue="inputDate"
  />
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from "vue";
import { parse, isValid } from "date-fns";
import { asanaDateFormat, formattedDate } from "../utils/date";

export default defineComponent ({
  props: {
    date: {
      type: Date,
    }
  },
  setup(props, { emit }) {
    const value = ref<Date>();
    const placeholder = asanaDateFormat.toLowerCase();

    const formatDate = (date: Date | undefined) => {
      return formattedDate(date);
    };

    const parseFn = (event: Event) => {
      const dateString = (event.target as HTMLInputElement).value;
      return parse(dateString, asanaDateFormat, new Date());
    };

    const inputDate = (date: Date) => {
      emit("update:date", date);
    };

    onMounted(() => {
      if (isValid(props.date)) {
        value.value = props.date;
      } else {
        value.value = undefined;
      }
    });

    return {
      value,
      placeholder,
      formatDate,
      parseFn,
      inputDate,
    }
  }
});
</script>