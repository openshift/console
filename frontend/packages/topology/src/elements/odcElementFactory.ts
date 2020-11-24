import { ElementFactory, GraphElement, ModelKind, BaseGraph } from '@patternfly/react-topology';
import OdcBaseNode from './OdcBaseNode';
import OdcBaseEdge from './OdcBaseEdge';

const odcElementFactory: ElementFactory = (kind: ModelKind): GraphElement | undefined => {
  switch (kind) {
    case ModelKind.graph:
      return new BaseGraph();
    case ModelKind.node:
      return new OdcBaseNode();
    case ModelKind.edge:
      return new OdcBaseEdge();
    default:
      return undefined;
  }
};

export default odcElementFactory;
