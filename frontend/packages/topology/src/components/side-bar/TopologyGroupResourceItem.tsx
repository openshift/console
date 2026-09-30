import type { ReactElement, FC } from 'react';
import { Grid, GridItem, ListItem } from '@patternfly/react-core';
import { ResourceLink } from '@console/internal/components/utils';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { referenceFor, modelFor } from '@console/internal/module/k8s';

type TopologyGroupResourceItemProps = {
  item: K8sResourceKind;
  releaseNamespace: string;
  linkForResource?: (obj: K8sResourceKind) => ReactElement;
};

const TopologyGroupResourceItem: FC<TopologyGroupResourceItemProps> = ({
  item,
  releaseNamespace,
  linkForResource,
}) => {
  const {
    metadata: { name, namespace },
  } = item;
  const kind = referenceFor(item);
  const model = modelFor(kind);
  const resourceNamespace = model.namespaced ? namespace || releaseNamespace : null;
  const link = linkForResource ? (
    linkForResource(item)
  ) : (
    <ResourceLink kind={kind} name={name} namespace={resourceNamespace} />
  );
  return (
    <ListItem>
      <Grid>
        <GridItem>{link}</GridItem>
      </Grid>
    </ListItem>
  );
};

export default TopologyGroupResourceItem;
