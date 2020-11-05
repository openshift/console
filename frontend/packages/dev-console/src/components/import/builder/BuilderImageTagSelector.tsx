import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useFormikContext, FormikValues } from 'formik';
import { ResourceName } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { ImageStreamTagModel } from '@console/internal/models';
import { DropdownField } from '@console/shared';
import {
  BuilderImage,
  getTagDataWithDisplayName,
  getPorts,
} from '../../../utils/imagestream-utils';
import { useSafeK8s } from '../../../utils/safe-k8s-hook';
import ImageStreamInfo from './ImageStreamInfo';

export interface BuilderImageTagSelectorProps {
  selectedBuilderImage: BuilderImage;
  selectedImageTag: string;
}

const BuilderImageTagSelector: React.FC<BuilderImageTagSelectorProps> = ({
  selectedBuilderImage,
  selectedImageTag,
}) => {
  const { t } = useTranslation();
  const { setFieldValue, setFieldError } = useFormikContext<FormikValues>();
  const {
    name: imageName,
    tags: imageTags,
    displayName: imageDisplayName,
    imageStreamNamespace,
  } = selectedBuilderImage;

  const tagItems = {};
  _.each(
    imageTags,
    ({ name }) => (tagItems[name] = <ResourceName kind="ImageStreamTag" name={name} />),
  );

  const [imageTag, displayName] = getTagDataWithDisplayName(
    imageTags,
    selectedImageTag,
    imageDisplayName,
  );

  const k8sGet = useSafeK8s();

  React.useEffect(() => {
    setFieldValue('image.tagObj', imageTag);
    k8sGet(ImageStreamTagModel, `${imageName}:${selectedImageTag}`, imageStreamNamespace)
      .then((imageStreamTag: K8sResourceKind) => {
        const ports = getPorts(imageStreamTag);
        setFieldValue('image.ports', ports);
      })
      .catch((err) => setFieldError('image.ports', err.message));
    // Find a way to use useSafeK8s hooks without adding it to the deps array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedImageTag, setFieldValue, setFieldError, imageName, imageStreamNamespace, imageTag]);

  return (
    <>
      <DropdownField
        name="image.tag"
        label={t('devconsole~Builder Image Version')}
        items={tagItems}
        title={tagItems[selectedImageTag]}
        fullWidth
        required
      />
      {imageTag && <ImageStreamInfo displayName={displayName} tag={imageTag} />}
    </>
  );
};

export default BuilderImageTagSelector;
