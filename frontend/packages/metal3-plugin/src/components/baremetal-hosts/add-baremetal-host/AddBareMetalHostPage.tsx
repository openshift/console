import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useLocation } from 'react-router';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import AddBareMetalHost from './AddBareMetalHost';

const AddBareMetalHostPage: FC = () => {
  const { t } = useTranslation('metal3-plugin');
  const location = useLocation();
  const { name, ns: namespace } = useParams();
  const enablePowerMgmt = new URLSearchParams(location.search).has('powerMgmt');

  const isEditing = !!name;
  const title = isEditing ? t('Edit Bare Metal Host') : t('Add Bare Metal Host');
  return (
    <>
      <DocumentTitle>{title}</DocumentTitle>
      <PageHeading
        title={title}
        helpText={t('Expand the hardware inventory by registering a new Bare Metal Host.')}
      />
      <PaneBody className="co-m-pane__form">
        <AddBareMetalHost namespace={namespace} name={name} enablePowerMgmt={enablePowerMgmt} />
      </PaneBody>
    </>
  );
};

export default AddBareMetalHostPage;
