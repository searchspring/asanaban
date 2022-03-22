import { VueRenderer } from '@tiptap/vue-3'
import tippy from 'tippy.js'
import { Instance, Props } from 'tippy.js'
import UserMentionList from '../components/UserMentionList.vue'
import TaskMentionList from '../components/TaskMentionList.vue'
import { SuggestionKeyDownProps, SuggestionOptions, SuggestionProps } from '@tiptap/suggestion'
import { PluginKey } from 'prosemirror-state';
import { Component, ComputedOptions, MethodOptions } from 'vue'
import { useAsanaStore } from '@/store/asana'

// adapted from this demo: https://tiptap.dev/api/nodes/mention

export const userSuggestion: Omit<SuggestionOptions, "editor"> = {
  char: "@",
  allowSpaces: true,
  pluginKey: new PluginKey("userSuggestion"),
  items: ({ query }) => {
    const users = useAsanaStore().users;
    return users.filter(u => u.name.toLowerCase().startsWith(query.toLowerCase())).slice(0, 5);
  },
  render: newRender(UserMentionList)
};

export const taskSuggestion: Omit<SuggestionOptions, "editor"> = {
  char: "#",
  allowSpaces: true,
  pluginKey: new PluginKey("taskSuggestion"),
  items: async ({ query }) => {
    return await useAsanaStore().LOAD_QUERIED_TASK(query) ?? [];
  },
  render: newRender(TaskMentionList)
};

function newRender(mentionList: Component<any, any, any, ComputedOptions, MethodOptions>) {
  return () => {
    let component: VueRenderer;
    let popup: Instance<Props>[];
  
    return {
      onStart: (props: SuggestionProps): void => {
        component = new VueRenderer(mentionList, {
          props,
          editor: props.editor,
        })
  
        popup = tippy('body', {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
        });
      },
  
      onUpdate: (props: SuggestionProps): void => {
        component.updateProps(props);
        popup[0].setProps({
          getReferenceClientRect: props.clientRect,
        });
      },
  
      onKeyDown: (props: SuggestionKeyDownProps): boolean => {
        if (props.event.key === 'Escape') {
          popup[0].hide();
          return true;
        }
        return component?.ref?.onKeyDown(props);
      },
  
      onExit: (): void => {
        popup[0].destroy();
        component.destroy();
      }
    }
  }
}

