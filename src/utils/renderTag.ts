import { NTag, SelectRenderTag } from 'naive-ui';
import { h } from 'vue';
import { Color } from 'csstype';

export const renderTag: SelectRenderTag = ({ option, handleClose }) => {
  return h(
    NTag,
    {
      closable: true,
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