import * as React from 'react';
import {
  useAnchor,
  AnchorEnd,
  Anchor,
  SVGAnchor,
  EllipseAnchor,
  observer,
} from '@console/topology';
import WorkloadNode from './WorkloadNode';

const RevisionNode: React.FC<React.ComponentProps<typeof WorkloadNode>> = (props) => {
  const [trafficAnchor, setTrafficAnchor] = React.useState<Anchor>(
    new EllipseAnchor(props.element),
  );
  const urlAnchorRefCallback = React.useCallback(
    (node): void => {
      if (node) {
        const anchor = new SVGAnchor(props.element);
        anchor.setSVGElement(node);
        setTrafficAnchor(anchor);
      } else {
        setTrafficAnchor(new EllipseAnchor(props.element));
      }
    },
    [props.element],
  );
  useAnchor(
    React.useCallback(() => trafficAnchor, [trafficAnchor]),
    AnchorEnd.target,
    'revision-traffic',
  );
  return <WorkloadNode {...props} urlAnchorRef={urlAnchorRefCallback} />;
};

export default observer(RevisionNode);
