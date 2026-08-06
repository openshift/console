import type { FC } from 'react';
import type { TextColumnItemProps } from './text-column-types';
import TextColumnItemContent from './TextColumnItemContent';

const TextColumnItem: FC<TextColumnItemProps> = (props) => <TextColumnItemContent {...props} />;
export default TextColumnItem;
