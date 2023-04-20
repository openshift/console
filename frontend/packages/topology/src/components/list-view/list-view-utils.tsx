import { isNode, Node, GraphElement } from '@patternfly/react-topology';
import { labelForNodeKind } from '@console/shared';
import { getResourceKind } from '../../utils/topology-utils';

export const getChildKinds = (children: GraphElement[]) => {
  const childNodes = children.filter((n) => isNode(n)) as Node[];
  const kindsMap = childNodes.reduce((acc, n) => {
    const kind = getResourceKind(n);
    if (!acc[kind]) {
      acc[kind] = [];
    }
    acc[kind].push(n);
    return acc;
  }, {});
  const kindKeys = Object.keys(kindsMap).sort((a, b) =>
    labelForNodeKind(a).localeCompare(labelForNodeKind(b)),
  );

  return { kindsMap, kindKeys };
};

export const sortGroupChildren = (children: GraphElement[]): Node[] => {
  const childNodes = children.filter((child) => isNode(child)) as Node[];
  return childNodes
    .sort((a, b) =>
      labelForNodeKind(getResourceKind(a)).localeCompare(labelForNodeKind(getResourceKind(b))),
    )
    .sort((a, b) => a.getLabel().localeCompare(b.getLabel()));
};
