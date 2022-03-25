<template>
  <n-date-picker 
    v-model:value="timestamp" 
    type="date"
    :placeholder="placeholder"
    placement="bottom"
    clearable 
    @update:value="inputDate"
  />
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue';
import { NDatePicker } from 'naive-ui';
import { isValid } from "date-fns";
import { asanaDateFormat } from "../utils/date";

export default defineComponent({
  components: { NDatePicker },
  props: {
    date: {
      type: Date,
    }
  },
  setup (props, { emit }) {
    const timestamp = ref<number | null>();
    const placeholder = asanaDateFormat.toLowerCase();

    const inputDate = (timestamp: number) => {
      var date: Date;

      if (timestamp === null) {
        date = new Date("")
      } else {
        date = new Date(timestamp)
      }

      emit("update:date", date);
    };

    onMounted(() => {
      if (isValid(props.date)) {
        timestamp.value = props.date?.getTime();
      } else {
        timestamp.value = null;
      }
    });

    return {
      timestamp,
      placeholder,
      inputDate,
    }
  }
});
</script>