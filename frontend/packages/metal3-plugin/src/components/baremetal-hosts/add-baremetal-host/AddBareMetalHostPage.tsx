import * as React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Firehose, FirehoseResource } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { SecretModel } from '@console/internal/models';
import { BareMetalHostModel } from '../../../models';
import { getSecretName } from '../../../k8s/objects/bare-metal-host';
import AddBareMetalHost from './AddBareMetalHost';

export type AddBareMetalHostPageProps = RouteComponentProps<{ ns?: string; name?: string }>;

const AddBareMetalHostPage: React.FunctionComponent<AddBareMetalHostPageProps> = ({ match }) => {
  const { name, ns: namespace } = match.params;
  const resources: FirehoseResource[] = [];

  const isEditing = !!name;
  if (isEditing) {
    resources.push(
      {
        kind: referenceForModel(BareMetalHostModel),
        namespaced: true,
        namespace,
        name,
        isList: false,
        prop: 'host',
      },
      {
        kind: SecretModel.kind,
        namespaced: true,
        namespace,
        name: getSecretName(name),
        isList: false,
        prop: 'secret',
      },
    );
  } else {
    resources.push({
      kind: referenceForModel(BareMetalHostModel),
      namespaced: true,
      namespace,
      isList: true,
      prop: 'hosts',
    });
  }
  const title = `${isEditing ? 'Edit' : 'Add'} Bare Metal Host`;
  return (
    <>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <div className="co-m-pane__body co-m-pane__form">
        {/* TODO(jtomasek): Turn this to PageHeading alternative for create forms (e.g.
        CreateResourceFormPageHeading) */}
        <h1 className="co-m-pane__heading co-m-pane__heading--baseline">
          <div className="co-m-pane__name">{title}</div>
        </h1>
        {!isEditing && (
          <p className="co-m-pane__explanation">
            Expand the hardware inventory by registering new Bare Metal Host.
          </p>
        )}
        <Firehose resources={resources}>
          <AddBareMetalHost namespace={namespace} isEditing={isEditing} />
        </Firehose>
      </div>
    </>
  );
};

export default AddBareMetalHostPage;
