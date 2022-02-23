<template>
  <div>
    <va-date-input
    label="due date"
    v-model="value"
    :format="formatDate"
    :parse="parseFn"
    placeholder="yyyy-mm-dd"
    clearable
    manual-input
  />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, PropType, onMounted } from "vue";
import { Task } from "@/types/asana";
import { format, isValid, parse } from "date-fns";
import store from "@/store";

export default defineComponent ({
  props: {
    task: {
      type: Object as PropType<Task>,
      required: true
    }
  },
  setup(props) {
    const value = ref<Date>();

    const formatDate = (date: Date | undefined) => {

      if (isValid(date)) {
        return format(date!, "yyyy-MM-dd");
      }

      if (date === undefined) {
        return ""
      }

      return "Invalid Date"
    };

    const parseFn = (event: Event) => {
      const dateString = (event.target as HTMLInputElement).value
      const [year, month, day] = dateString.split('-')

      const yearNum = parseInt(year)
      const monthNum = parseInt(month)
      const dayNum = parseInt(day)

      return new Date(yearNum, (monthNum - 1), dayNum)
    };

    watch([value], () => {
      const formattedDate = formatDate(value.value)
      store.dispatch("preferences/setDueDate", formattedDate);
    });

    onMounted(() => {
      if (props.task.due_on === null) {
        value.value = undefined
      } else {
        value.value = parse(props.task.due_on, "yyyy-MM-dd", new Date());
      }
    });

    return {
      value,
      formatDate,
      parseFn,
    }
  }
});
</script>