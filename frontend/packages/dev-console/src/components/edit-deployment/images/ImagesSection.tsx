import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckboxField } from '@console/shared/src';
import ImageSearchSection from '../../import/image-search/ImageSearchSection';
import { Resources } from '../../import/import-types';

const ImagesSection: React.FC<{ resourceType: string }> = ({ resourceType }) => {
  const { t } = useTranslation();
  return (
    <>
      {/* To-do: Refactor ImagesSearchSection to make it generic */}
      <ImageSearchSection />
      <CheckboxField
        name="triggers.image"
        label={t('devconsole~Auto deploy when new Image is available')}
      />
      {resourceType === Resources.OpenShift && (
        <CheckboxField
          name="deployment.triggers.config"
          label={t('devconsole~Auto deploy when deployment configuration changes')}
        />
      )}
    </>
  );
};

export default ImagesSection;
