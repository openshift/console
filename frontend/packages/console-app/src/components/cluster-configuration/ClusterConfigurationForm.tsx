import type { FC } from 'react';
import { Form } from '@patternfly/react-core';
import ClusterConfigurationField from './ClusterConfigurationField';
import type { ResolvedClusterConfigurationItem } from './types';

type ClusterConfigurationFormProps = {
  items: ResolvedClusterConfigurationItem[];
};

const ClusterConfigurationForm: FC<ClusterConfigurationFormProps> = ({ items }) =>
  items?.length > 0 ? (
    <Form onSubmit={(event) => event.preventDefault()}>
      {items.map((item) => (
        <ClusterConfigurationField key={item.id} item={item} />
      ))}
    </Form>
  ) : null;
export default ClusterConfigurationForm;
