import * as React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Firehose, FirehoseResource } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { BareMetalHostModel } from '../../../models';
import AddBareMetalHost from './AddBareMetalHost';

export type AddBareMetalHostPageProps = RouteComponentProps<{ ns?: string }>;

const AddBareMetalHostPage: React.FunctionComponent<AddBareMetalHostPageProps> = ({ match }) => {
  const namespace = match.params.ns;
  const resources: FirehoseResource[] = [
    {
      kind: referenceForModel(BareMetalHostModel),
      namespaced: true,
      namespace,
      isList: true,
      prop: 'hosts',
    },
  ];
  const title = 'Add Bare Metal Host';
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
        <p className="co-m-pane__explanation">
          Expand the hardware inventory by registering new Bare Metal Host.
        </p>
        <Firehose resources={resources}>
          <AddBareMetalHost namespace={namespace} />
        </Firehose>
      </div>
    </>
  );
};

export default AddBareMetalHostPage;
