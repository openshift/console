import { isNode, Node, GraphElement } from '@patternfly/react-topology';
import * as _ from 'lodash';
import { K8sKind, modelFor } from '@console/internal/module/k8s';
import { getResourceKind } from '../../utils/topology-utils';

export const labelForNodeKind = (kindString: string) => {
  const model: K8sKind | undefined = modelFor(kindString);
  if (model) {
    return model.label;
  }
  return _.startCase(kindString);
};

export const labelKeyForNodeKind = (kindString: string) => {
  const model: K8sKind | undefined = modelFor(kindString);
  if (model) {
    if (model.labelKey) {
      return model.labelKey;
    }
    return model.label;
  }
  return _.startCase(kindString);
};

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
