import * as React from 'react';
import { FormikValues, useField, useFormikContext } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { LoadingInline } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { referenceForModel } from '@console/internal/module/k8s';
import { FormSelectField, FormSelectFieldOption } from '@console/shared';
import { PipelineResourceModel } from '../../../../models';
import { PipelineResourceKind } from '../../../../types';
import { CREATE_PIPELINE_RESOURCE } from './const';

import './PipelineResourceDropdown.scss';

type PipelineResourceDropdownProps = {
  autoSelect?: boolean;
  filterType: string;
  name: string;
  namespace: string;
};

const PipelineResourceDropdown: React.FC<PipelineResourceDropdownProps> = (props) => {
  const { t } = useTranslation();
  const { autoSelect, filterType, name, namespace } = props;

  const { setFieldValue, setFieldTouched } = useFormikContext<FormikValues>();
  const [, { touched }] = useField(name);

  const [resources, loaded, error] = useK8sWatchResource<PipelineResourceKind[]>({
    isList: true,
    namespace,
    kind: referenceForModel(PipelineResourceModel),
  });

  const availableResources: PipelineResourceKind[] = resources.filter(
    (resource) => resource.spec.type === filterType,
  );

  const canAutoSelect = autoSelect && !touched && loaded && !error;
  React.useEffect(() => {
    if (canAutoSelect) {
      if (availableResources.length === 0) {
        setFieldValue(name, CREATE_PIPELINE_RESOURCE);
      } else {
        setFieldValue(name, availableResources[0].metadata.name);
      }
      setFieldTouched(name);
    }
  }, [canAutoSelect, name, availableResources, setFieldTouched, setFieldValue]);

  const options: FormSelectFieldOption<string>[] = [
    {
      value: '',
      label: t('pipelines-plugin~Select Pipeline resource'),
      isPlaceholder: true,
      isDisabled: true,
    },
    {
      label: t('pipelines-plugin~Create Pipeline resource'),
      value: CREATE_PIPELINE_RESOURCE,
    },
    ...availableResources.map(
      (resource): FormSelectFieldOption => {
        const resourceName = resource.metadata.name;
        const url = _.find(resource.spec.params, ['name', 'url'])?.value || '';
        const label = url.trim().length > 0 ? `${url} (${resourceName})` : resourceName;

        return { label, value: resourceName };
      },
    ),
  ];

  if (!loaded) {
    return <LoadingInline />;
  }

  return (
    <FormSelectField
      name={name}
      className="odc-pipeline-resource-dropdown"
      options={options}
      isDisabled={loaded && availableResources.length === 0}
    />
  );
};

export default PipelineResourceDropdown;
