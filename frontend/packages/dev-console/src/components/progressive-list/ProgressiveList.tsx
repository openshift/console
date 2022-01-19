import * as React from 'react';
import ProgressiveListFooter from './ProgressiveListFooter';
import ProgressiveListItem from './ProgressiveListItem';

type ProgressiveListProps = {
  visibleItems: string[];
  onVisibleItemChange: (item: string) => void;
};

const ProgressiveList: React.FC<ProgressiveListProps> = ({
  visibleItems,
  children,
  onVisibleItemChange,
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
    <>
      {visibleItems.map((item: string) => (
        <React.Fragment key={item}>
          {validChildren.find(({ props }: React.ReactElement) => item === props.name)}
        </React.Fragment>
      ))}
      <ProgressiveListFooter items={items} onShowItem={onVisibleItemChange} />
    </>
  );
};

export default ProgressiveList;
