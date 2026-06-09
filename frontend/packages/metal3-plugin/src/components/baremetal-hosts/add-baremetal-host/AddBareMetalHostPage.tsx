import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useLocation } from 'react-router';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import AddBareMetalHost from './AddBareMetalHost';

const AddBareMetalHostPage: FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { name, ns: namespace } = useParams();
  const enablePowerMgmt = new URLSearchParams(location.search).has('powerMgmt');

  const isEditing = !!name;
  const title = isEditing
    ? t('metal3-plugin~Edit BareMetalHost')
    : t('metal3-plugin~Add BareMetalHost');
  return (
    <>
      <DocumentTitle>{title}</DocumentTitle>
      <PageHeading
        title={title}
        helpText={t(
          'metal3-plugin~Expand the hardware inventory by registering a new BareMetalHost.',
        )}
      />
      <PaneBody className="co-m-pane__form">
        <AddBareMetalHost namespace={namespace} name={name} enablePowerMgmt={enablePowerMgmt} />
      </PaneBody>
    </>
  );
};

export default AddBareMetalHostPage;
