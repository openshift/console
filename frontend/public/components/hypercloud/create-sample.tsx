import * as _ from 'lodash-es';
import * as React from 'react';
import { match as RMatch } from 'react-router';
import { useFormContext, Controller } from 'react-hook-form';
import { WithCommonForm } from './form/create-form';
import { SelectorInput } from '../utils';
import { RadioGroup } from './utils/radio';
import { Section } from './utils/section';
import { InputSelectBox } from './utils/inputSelectBox';
import { KeyValueListEditor } from './utils/key-value-list-editor';

const defaultValues = {
  // requestDo에 넣어줄 형식으로 defaultValues 작성
  metadata: {
    name: 'test-name',
    keyvaluelist: [{ key: "A", value: "aaa" }, { key: "B", value: "bbb" }, { key: "C", value: "ccc" }, { key: "D", value: "ddd" }, { key: "E", value: "eee" }]
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
  const resources = [
    // RadioGroup 컴포넌트에 넣어줄 items
    {
      title: 'Cpu',
      value: 'cpu',
    },
    {
      title: 'Gpu',
      value: 'gpu',
    },
    {
      title: 'Memory',
      value: 'memory',
    },
  ];
  const dropdownUnits = {
    Mi: 'MiB',
    Gi: 'GiB',
    Ti: 'TiB',
  };

  return (
    <div>
      <Section label="Labels" id="label" description="이것은 Label입니다.">
        <Controller name="metadata.labels" id="label" labelClassName="co-text-sample" as={SelectorInput} control={control} tags={[]} />
      </Section>
      <Section id="resources" label="Radio Group">
        <RadioGroup
          name="spec.resources" // 서버에 보낼 데이터에서의 path (필수)
          items={resources} // [{title: '', value: ''}] (필수)
          inline={false} // inline속성 먹일거면 true, 아니면 빼면 됨 (선택)
        />
      </Section>
      <Section id="cpu" label="Input Selectbox">
        <InputSelectBox textName="spec.cpu" id="cpu" dropdownName="spec.cpuRange" selectedKey="Mi" items={dropdownUnits} />
      </Section>
      <Section id="section" label="Grid Section" isRequired={true}>
        {/* sample로 각각다른 3개 node 넣어봄. 1,2,3,4 개 일 경우 다 정상동작 하는 것 확인.*/}
        <Section id="label" label="Label (for Section)">
          <Controller name="metadata.section.label" id="label" labelClassName="co-text-sample" as={SelectorInput} control={control} tags={[]} />
        </Section>
        <Section id="cpu" label="Input Selectbox (for Section)">
          <InputSelectBox textName="spec.section.cpu" id="cpu" dropdownName="spec.section.cpuRange" selectedKey="Mi" items={dropdownUnits} />
        </Section>
        <Section id="resources" label="Radio Group (for Section)">
          <RadioGroup
            name="spec.section.resources" // 서버에 보낼 데이터에서의 path (필수)
            items={resources} // [{title: '', value: ''}] (필수)
            inline={false} // inline속성 먹일거면 true, 아니면 빼면 됨 (선택)
          />
        </Section>
      </Section>
      <Section id="list" label="Key Value List">
        <KeyValueListEditor
          name="metadata.keyvaluelist" // 서버에 보낼 데이터에서의 path (필수)
          disableReorder={false} // 순서바꾸기 제공여부 설정. 기본값은 false (선택)
        />
      </Section>
    </div>
  );
};

export const CreateSample: React.FC<CreateSampleProps> = props => {
  const formComponent = sampleFormFactory(props.match.params);
  const SampleFormComponent = formComponent;
  return <SampleFormComponent fixed={{}} explanation="" titleVerb="Create" onSubmitCallback={onSubmitCallback} isCreate={true} />;
};

export const onSubmitCallback = data => {
  // submit하기 전에 data를 가공해야 할 경우
  let labels = SelectorInput.objectify(data.metadata.labels);
  delete data.metadata.labels;
  data = _.defaultsDeep(data, { metadata: { labels: labels } });
  return data;
};

type CreateSampleProps = {
  match: RMatch<{
    type?: string;
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
