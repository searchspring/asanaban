import { NTag, SelectRenderTag } from 'naive-ui';
import { h } from 'vue';
import { Color } from 'csstype';

const renderTag = (closeable: boolean) => {
  return ({ option, handleClose }) => {
    return h(
      NTag,
      {
        closable: closeable,
        round: true,
        themeOverrides: {
          heightMedium: '24px',
          color: option.color as Color,
          border: option.color as Color,
          textColor: option.font as Color,
          closeColor: option.font as Color,
        },
        onClose: (e: MouseEvent) => {
          e.stopPropagation()
          handleClose()
        }
      },
      { default: () => option.label }
    );
  }
}

export const closeableTag: SelectRenderTag = renderTag(true);

export const staticTag: SelectRenderTag = renderTag(false);