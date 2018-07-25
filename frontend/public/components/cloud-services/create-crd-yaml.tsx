/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import { safeDump } from 'js-yaml';
import { match } from 'react-router-dom';
import * as _ from 'lodash-es';

import { firehoseFor, LoadingBox } from '../utils';
import { CreateYAML } from '../create-yaml';
import { referenceForModel, K8sResourceKind, K8sResourceKindReference, kindForReference, apiVersionForReference } from '../../module/k8s';
import { ClusterServiceVersionModel } from '../../models';
import { ClusterServiceVersionKind } from './index';
import { registerTemplate } from '../../yaml-templates';
import { ocsTemplates } from './ocs-templates';

/**
 * Component which wraps the YAML editor to ensure the templates are added from the `ClusterServiceVersion` annotations.
 */
export const CreateCRDYAML: React.SFC<CreateCRDYAMLProps> = (props) => {
  const annotationKey = 'alm-examples';

  const CreateCRDYAMLFirehose = firehoseFor({
    ClusterServiceVersion: {
      kind: referenceForModel(ClusterServiceVersionModel),
      name: props.match.params.appName,
      namespace: props.match.params.ns,
      isList: false,
      prop: 'ClusterServiceVersion'
    }
  });
  CreateCRDYAMLFirehose.displayName = 'CreateCRDYAMLFirehose';

  const Create = (createProps: {ClusterServiceVersion: {loaded: boolean, data: ClusterServiceVersionKind}}) => {
    if (createProps.ClusterServiceVersion.loaded && createProps.ClusterServiceVersion.data) {
      try {
        (JSON.parse(_.get(createProps.ClusterServiceVersion.data.metadata.annotations, annotationKey)) as K8sResourceKind[] || [])
          .forEach((template) => registerTemplate(`${template.apiVersion}.${template.kind}`, safeDump(template)));
      } catch (err) {
        const key = `${apiVersionForReference(props.match.params.plural)}.${kindForReference(props.match.params.plural)}`;
        registerTemplate(key, ocsTemplates.get(key));
      }
      return <CreateYAML {...props as any} />;
    }
    // Do not render the YAML editor until the template is registered
    return <LoadingBox />;
  };

  return <CreateCRDYAMLFirehose render={({ClusterServiceVersion}) =>
    <Create ClusterServiceVersion={ClusterServiceVersion} />
  } />;
};

export type CreateCRDYAMLProps = {
  match: match<{appName: string, ns: string, plural: K8sResourceKindReference}>;
};

CreateCRDYAML.displayName = 'CreateCRDYAML';
