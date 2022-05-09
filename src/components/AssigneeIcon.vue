<template>
  <div aria-hidden="true" class="assignee-icon">
    <span
      class="photo avatar"
      v-if="!assignee.photo"
      v-bind:style="{ backgroundColor: getAvatarColor(assignee.name) }"
    >
      <div
        class="Avatar AvatarPhoto AvatarPhoto--small AvatarPhoto--color2"
        role="img"
        :aria-label="assignee.name"
      >
        <div aria-hidden="true">{{ getAssigneeInitials(assignee.name) }}</div>
      </div>
    </span>
    <img
      class="photo"
      v-else
      :src="assignee.photo?.image_21x21"
    />
  </div>
</template>

<script lang="ts">
import { Assignee } from "@/types/asana";
import { defineComponent, PropType } from "vue";
import getAvatarColor from "../utils/avatar-colors";

export default defineComponent({
  props: {
    assignee: {
      type: Object as PropType<Assignee>,
      required: true,
    },
  },
  setup(props) {
    const getAssigneeInitials = (name: string | null | undefined) => {
      if (name) {
        const nameSplit = name.split(" ");
        const firstInitial = nameSplit[0][0];
        const lastInitial = nameSplit[nameSplit.length - 1][0];
        return nameSplit.length > 1 ? firstInitial + lastInitial : firstInitial;
      }
    };

    return {
      getAvatarColor,
      getAssigneeInitials,
    };
  },
});
</script>

<style scoped>
.photo {
  border-radius: 100%;
  border: solid thin white;
  display: inline-block;
  margin-right: 0.45rem;
  vertical-align: middle;
  width: 21px;
  height: 21px;
}

.avatar {
  background-color: #f0f0f0;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 8px;
  font-weight: 700;
  color: white;
}
</style>
