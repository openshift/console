import * as React from 'react';
import { connect } from 'react-redux';
import { RootState } from '@console/internal/redux';
import { GraphComponent as BaseGraphComponent, WithContextMenuProps } from '@console/topology';
import { TopologyFilters, getTopologyFilters } from '../filters/filter-utils';

type GraphComponentProps = React.ComponentProps<typeof BaseGraphComponent> & {
  dragEditInProgress?: boolean;
  filters: TopologyFilters;
} & WithContextMenuProps;

const DRAG_ACTIVE_CLASS = 'odc-m-drag-active';
const FILTER_ACTIVE_CLASS = 'odc-m-filter-active';

const GraphComponent: React.FC<GraphComponentProps> = (props) => {
  const { dragEditInProgress, filters } = props;
  React.useEffect(() => {
    const addClassList = [];
    const removeClassList = [];
    filters.searchQuery.trim() !== ''
      ? addClassList.push(FILTER_ACTIVE_CLASS)
      : removeClassList.push(FILTER_ACTIVE_CLASS);
    dragEditInProgress
      ? addClassList.push(DRAG_ACTIVE_CLASS)
      : removeClassList.push(DRAG_ACTIVE_CLASS);

    if (addClassList.length) {
      addClassList.forEach((className) => document.body.classList.add(className));
    }
    if (removeClassList.length) {
      removeClassList.forEach((className) => document.body.classList.remove(className));
    }
  }, [dragEditInProgress, filters.searchQuery]);
  return <BaseGraphComponent {...props} />;
};

const GraphComponentState = (state: RootState) => {
  const filters = getTopologyFilters(state);
  return { filters };
};
export default connect(GraphComponentState)(GraphComponent);
