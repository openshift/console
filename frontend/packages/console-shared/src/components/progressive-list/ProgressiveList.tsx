import type { ComponentProps, ReactNode, ReactElement, FC } from 'react';
import { Children, Fragment } from 'react';
import ProgressiveListFooter from './ProgressiveListFooter';
import ProgressiveListItem from './ProgressiveListItem';

type ProgressiveListProps = {
  children?: ReactNode;
  visibleItems: string[];
  onVisibleItemChange: (item: string) => void;
  Footer: ComponentProps<typeof ProgressiveListFooter>['Footer'];
};

const ProgressiveList: FC<ProgressiveListProps> = ({
  visibleItems,
  children,
  onVisibleItemChange,
  Footer,
}) => {
  const items: string[] = [];
  const validChildren: ReactNode[] = Children.toArray(children).filter((child: ReactElement) => {
    const { name } = child.props;
    const validChild = child.type === ProgressiveListItem;
    const isNameInVisibleItems = visibleItems.includes(name);
    if (validChild && !isNameInVisibleItems) items.push(name);
    return validChild;
  });
  return (
    <>
      {visibleItems.map((item: string) => (
        <Fragment key={item}>
          {validChildren.find(({ props }: ReactElement) => item === props.name)}
        </Fragment>
      ))}
      <ProgressiveListFooter Footer={Footer} items={items} onShowItem={onVisibleItemChange} />
    </>
  );
};

export default ProgressiveList;
