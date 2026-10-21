import { ScaleDetailsLevel, useVisualizationController } from '@patternfly/react-topology';
import { SHOW_LABELS_FILTER_ID } from './const';
import { getFilterById } from './filter-utils';
import { useDisplayFilters } from './useDisplayFilters';

const useShowLabel = (hover: boolean): boolean => {
  const displayFilters = useDisplayFilters();
  const controller = useVisualizationController();
  const detailsLevel = controller.getGraph().getDetailsLevel();
  const showLabelsFilter = getFilterById(SHOW_LABELS_FILTER_ID, displayFilters);

  return hover || (detailsLevel === ScaleDetailsLevel.high && showLabelsFilter?.value);
};

export { useShowLabel };
