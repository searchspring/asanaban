import store from '@/store'
import { VueRenderer } from '@tiptap/vue-3'
import tippy from 'tippy.js'
import { Instance, Props } from 'tippy.js'
import MentionList from '../components/MentionList.vue'

export default {
  items: ({ query }) => {
    const users = store.getters["asana/users"]
    return users.filter(u => u.name.toLowerCase().startsWith(query.toLowerCase())).slice(0, 5)
  },

  render: () => {
    let component: VueRenderer;
    let popup: Instance<Props>[];

    return {
      onStart: props => {
        component = new VueRenderer(MentionList, {
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
        })
      },

      onUpdate(props) {
        component.updateProps(props)

        popup[0].setProps({
          getReferenceClientRect: props.clientRect,
        })
      },

      onKeyDown(props) {
        if (props.event.key === 'Escape') {
          popup[0].hide()

          return true
        }

        return component.ref?.onKeyDown(props)
      },
    }
  },
}