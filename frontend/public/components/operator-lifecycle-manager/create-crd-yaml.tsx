import * as React from 'react';
import { safeDump } from 'js-yaml';
import { match } from 'react-router-dom';
import * as _ from 'lodash';

import { Firehose, LoadingBox } from '../utils';
import { CreateYAML } from '../create-yaml';
import { referenceForModel, K8sResourceKind, K8sResourceKindReference, referenceFor } from '../../module/k8s';
import { ClusterServiceVersionModel } from '../../models';
import { ClusterServiceVersionKind } from './index';

// TODO(alecmerdler): Implement dynamic form powered by descriptors and CRD validation schema

/**
 * Component which wraps the YAML editor to ensure the templates are added from the `ClusterServiceVersion` annotations.
 */
export const CreateCRDYAML: React.SFC<CreateCRDYAMLProps> = (props) => {
  const annotationKey = 'alm-examples';

  const Create = (createProps: {ClusterServiceVersion: {loaded: boolean, data: ClusterServiceVersionKind}}) => {
    if (createProps.ClusterServiceVersion.loaded && createProps.ClusterServiceVersion.data) {
      const templatesJSON = _.get(createProps.ClusterServiceVersion.data.metadata.annotations, annotationKey, '[]');
      const template = _.attempt(() => safeDump((JSON.parse(templatesJSON) as K8sResourceKind[]).find(obj => referenceFor(obj) === props.match.params.plural)));
      if (_.isError(template)) {
        // eslint-disable-next-line no-console
        console.error('Error parsing example JSON from annotation. Falling back to default.');
      }

      return <CreateYAML {...props as any} template={!_.isError(template) ? template : null} />;
    }
    // Do not render the YAML editor until the template is registered from the loaded `ClusterServiceVersion`
    return <LoadingBox />;
  };

  return <Firehose resources={[{
    kind: referenceForModel(ClusterServiceVersionModel),
    name: props.match.params.appName,
    namespace: props.match.params.ns,
    isList: false,
    prop: 'ClusterServiceVersion',
  }]}>
    <Create {...props as any} />
  </Firehose>;
};

export type CreateCRDYAMLProps = {
  match: match<{appName: string, ns: string, plural: K8sResourceKindReference}>;
};

CreateCRDYAML.displayName = 'CreateCRDYAML';
