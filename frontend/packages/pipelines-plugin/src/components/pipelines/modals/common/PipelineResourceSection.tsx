import * as React from 'react';
import { FieldArray, useField } from 'formik';
import { capitalize } from 'lodash';
import { useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import PipelineResourceDropdownField from './PipelineResourceDropdownField';
import { PipelineModalFormResource } from './types';

type ResourceSectionType = {
  formikIndex: number;
  resource: PipelineModalFormResource;
};
type ResourceSection = {
  cluster?: ResourceSectionType[];
  git?: ResourceSectionType[];
  image?: ResourceSectionType[];
  storage?: ResourceSectionType[];
};

const reduceToSections = (
  acc: ResourceSection,
  resource: PipelineModalFormResource,
  formikIndex: number,
) => {
  const resourceType = resource.data.type;

  if (!resourceType) {
    return acc;
  }

  return {
    ...acc,
    [resourceType]: [...(acc[resourceType] || []), { formikIndex, resource }],
  };
};

const PipelineResourceSection: React.FC = () => {
  const { t } = useTranslation();
  const [{ value: resources }] = useField<PipelineModalFormResource[]>('resources');

  const sections: ResourceSection = resources.reduce(reduceToSections, {} as ResourceSection);
  const types = Object.keys(sections);

  return (
    <>
      {types.map((type) => (
        <FieldArray
          name={type}
          key={type}
          render={() => {
            const section = sections[type];

            return (
              <FormSection
                title={t('pipelines-plugin~{{type}} resources', { type: capitalize(type) })}
                fullWidth
              >
                {section.map((sectionData: ResourceSectionType) => {
                  const { formikIndex, resource } = sectionData;

                  return (
                    <PipelineResourceDropdownField
                      key={resource.name}
                      name={`resources.${formikIndex}`}
                      filterType={type}
                      label={resource.name}
                    />
                  );
                })}
              </FormSection>
            );
          }}
        />
      ))}
    </>
  );
};

export default PipelineResourceSection;
