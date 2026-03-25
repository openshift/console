import type { FC } from 'react';
import type { TextColumnItemProps } from './text-column-types';
import TextColumnItemContent from './TextColumnItemContent';

const TextColumnItem: FC<TextColumnItemProps> = (props) => {
  return <TextColumnItemContent {...props} previewDropRef={null} dragRef={null} opacity={1} />;
};
export default TextColumnItem;
