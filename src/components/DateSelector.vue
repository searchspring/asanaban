<template>
  <div>
    <va-date-input
    label="due date"
    v-model="value"
    :readonly="false"
    :format="formatDate"
    :parse="parseFn"
    :placeholder="getCurrentDate()"
    clearable
    manual-input
  />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, PropType } from "vue";
import { Task } from "@/types/asana";
import format from 'date-fns/format'
import store from "@/store";

export default defineComponent ({
  props: {
    task: {
      type: Object as PropType<Task>,
      required: true
    }
  },
  setup(props) {
    const value = ref();

    const getCurrentDate = () => {
      if (props.task.due_on) {
        return props.task.due_on
      } 
      return "yyyy-mm-dd"
    };

    const formatDate = (date: Date) => {
      if (date) {
        const formattedDate = format(date, "YYYY-MM-DD");
        return formattedDate
      }
    };

    const parseFn = (event) => {
      const dateString = event.target.value
      const [year, month, day] = dateString.split('-')
      return new Date(year, (month - 1), day)
    };

    watch([value], () => {
      const formattedDate = formatDate(value.value)
      store.dispatch("preferences/setDueDate", formattedDate);
    })

    return {
      value,
      getCurrentDate,
      formatDate,
      parseFn,
    }
  }
});
</script>