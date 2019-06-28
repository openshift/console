import * as React from 'react';
import FormSectionDivider from '../import/section/FormSectionDivider';
import ProgressiveListFooter from './ProgressiveListFooter';
import ProgressiveListItem from './ProgressiveListItem';
import './ProgressiveList.scss';

export interface ProgressiveListProps {
  visibleItems: string[];
  onVisibleItemChange: (item: string) => void;
  text: string;
}

const ProgressiveList: React.FC<ProgressiveListProps> = ({
  visibleItems,
  children,
  onVisibleItemChange,
  text,
}) => {
  const items: string[] = [];
  const validChildren: React.ReactNode[] = React.Children.toArray(children).filter(
    (child: React.ReactElement) => {
      const { name } = child.props;
      const validChild = child.type === ProgressiveListItem;
      const isNameInVisibleItems = visibleItems.includes(name);
      if (validChild && !isNameInVisibleItems) items.push(name);
      return validChild;
    },
  );
  return (
    <React.Fragment>
      {visibleItems.map((item: string, index: number) => (
        <React.Fragment key={item}>
          {validChildren.find(({ props }: React.ReactElement) => item === props.name)}
          {index !== validChildren.length - 1 && <FormSectionDivider />}
        </React.Fragment>
      ))}
      <ProgressiveListFooter text={text} items={items} onShowItem={onVisibleItemChange} />
    </React.Fragment>
  );
};

export default ProgressiveList;
