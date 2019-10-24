import * as React from 'react';
import { FieldArray } from 'formik';
import * as _ from 'lodash';
import FormSection from '../../import/section/FormSection';
import { PipelineResource } from '../../../utils/pipeline-augment';
import PipelineResourceDropdownField from './PipelineResourceDropdownField';

export interface ResourceProps {
  types?: string[];
  git?: PipelineResource[];
  image?: PipelineResource[];
  cluster?: PipelineResource[];
  storage?: PipelineResource[];
}
export interface ResourceSectionProps {
  resources: ResourceProps;
}

const PipelineResourceSection: React.FC<ResourceSectionProps> = ({ resources }) => {
  return (
    resources.types.length > 0 && (
      <>
        {resources.types.map((type) => (
          <FieldArray
            name={type}
            key={type}
            render={() =>
              resources[type].length > 0 && (
                <FormSection title={`${_.capitalize(type)} Resources`} fullWidth>
                  <div className="form-group">
                    {resources[type].map((resource, resIndex) => (
                      // eslint-disable-next-line react/no-array-index-key
                      <div className="form-group" key={`resource-${resIndex}-name`}>
                        <PipelineResourceDropdownField
                          name={`resources.${resource.index}.resourceRef.name`}
                          label={resource.name}
                          fullWidth
                          required
                          filterType={type}
                        />
                      </div>
                    ))}
                  </div>
                </FormSection>
              )
            }
          />
        ))}
      </>
    )
  );
};

export default PipelineResourceSection;
