import * as React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import AddBareMetalHost from './AddBareMetalHost';

export type AddBareMetalHostPageProps = RouteComponentProps<{ ns?: string; name?: string }>;

const AddBareMetalHostPage: React.FunctionComponent<AddBareMetalHostPageProps> = ({
  match,
  location,
}) => {
  const { name, ns: namespace } = match.params;
  const enablePowerMgmt = new URLSearchParams(location.search).has('powerMgmt');

  const isEditing = !!name;
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
            Expand the hardware inventory by registering a new Bare Metal Host.
          </p>
        )}
        <AddBareMetalHost namespace={namespace} name={name} enablePowerMgmt={enablePowerMgmt} />
      </div>
    </>
  );
};

export default AddBareMetalHostPage;
