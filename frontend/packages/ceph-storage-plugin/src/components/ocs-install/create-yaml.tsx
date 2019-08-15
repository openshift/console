import * as React from 'react';
import * as _ from 'lodash';
import { match } from 'react-router';
import { safeDump } from 'js-yaml';
import { K8sResourceKind, K8sResourceKindReference } from '@console/internal/module/k8s';
import { CreateYAML } from '@console/internal/components/create-yaml';
import { OCSServiceModel } from '../../models';

export const CreateOCSServiceYAML: React.FC<CreateOCSServiceYAMLProps> = (props) => {
  const template = _.attempt(() => safeDump(props.sample));
  if (_.isError(template)) {
    // eslint-disable-next-line no-console
    console.error('Error parsing example JSON from annotation. Falling back to default.');
  }

  return (
    <CreateYAML
      {...props as any}
      template={template}
      match={props.match}
      hideHeader
      plural={OCSServiceModel.plural}
    />
  );
};

type CreateOCSServiceYAMLProps = {
  sample?: K8sResourceKind;
  match: match<{ appName: string; ns: string; plural: K8sResourceKindReference }>;
};
