import * as React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { useParams, useLocation } from 'react-router-dom-v5-compat';
import AddBareMetalHost from './AddBareMetalHost';

const AddBareMetalHostPage: React.FunctionComponent = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { name, ns: namespace } = useParams();
  const enablePowerMgmt = new URLSearchParams(location.search).has('powerMgmt');

  const isEditing = !!name;
  const title = isEditing
    ? t('metal3-plugin~Edit Bare Metal Host')
    : t('metal3-plugin~Add Bare Metal Host');
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
            {t('metal3-plugin~Expand the hardware inventory by registering a new Bare Metal Host.')}
          </p>
        )}
        <AddBareMetalHost namespace={namespace} name={name} enablePowerMgmt={enablePowerMgmt} />
      </div>
    </>
  );
};

export default AddBareMetalHostPage;
