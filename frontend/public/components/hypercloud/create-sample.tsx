import * as _ from 'lodash-es';
import * as React from 'react';
import { match as RMatch } from 'react-router';
import { useFormContext, Controller } from 'react-hook-form';
import { WithCommonForm } from './form/create-form';
import { SelectorInput } from '../utils';
// import {RadioGroup} from './utils/radio'
import { Section } from './utils/section';

const defaultValues = {
  // requestDo에 넣어줄 형식으로 defaultValues 작성
  metadata: {
    name: 'test-name',
  },
  spec: {
    resources: 'cpu',
  },
};

const sampleFormFactory = params => {
  return WithCommonForm(CreateSampleComponent, params, defaultValues);
};

const CreateSampleComponent: React.FC<SampleFormProps> = props => {
  const { control } = useFormContext();
  // const resources = [ // RadioGroup 컴포넌트에 넣어줄 items
  //   {
  //     title: 'Cpu',
  //     value: 'cpu'
  //   },
  //   {
  //     title: 'Gpu',
  //     value: 'gpu'
  //   },
  //   {
  //     title: 'Memory',
  //     value: 'memory'
  //   }
  // ];

  return (
    <div>
      <div className="form-group">
        <Section label="Labels" id="label" description="이것은 Label입니다.">
          <div className="modal-body__field">
            <Controller name="metadata.labels" id="label" labelClassName="co-text-sample" as={SelectorInput} control={control} tags={[]} />
          </div>
        </Section>
      </div>
      {/* <div className="form-group"> 
        <Section label="Radio Group">
          <RadioGroup 
            name="spec.resources" // RequestDO 실제로 들어갈 path (필수)
            items={resources} // [{title: '', value: ''}] (필수)
            inline={true} // inline속성 먹일거면 true, 아니면 빼면 됨 (선택)
          />
        </Section>
      </div> */}
    </div>
  );
};

export const CreateSample: React.FC<CreateSampleProps> = props => {
  const formComponent = sampleFormFactory(props.match.params);
  const SampleFormComponent = formComponent;
  return <SampleFormComponent fixed={{}} explanation="" titleVerb="Create" onSubmitCallback={onSubmitCallback} isCreate={true} />;
};

export const onSubmitCallback = data => {
  let labels = SelectorInput.objectify(data.metadata.labels);
  delete data.metadata.labels;
  data = _.defaultsDeep(data, { metadata: { labels: labels } });
  return data;
};

type CreateSampleProps = {
  match: RMatch<{
    params?: string;
  }>;
  fixed: object;
  explanation: string;
  titleVerb: string;
  saveButtonText?: string;
  isCreate: boolean;
};

type SampleFormProps = {
  onChange: Function;
  stringData: {
    [key: string]: string;
  };
  isCreate: boolean;
};
