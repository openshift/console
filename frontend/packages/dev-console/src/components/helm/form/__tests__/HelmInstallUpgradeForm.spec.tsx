import * as React from 'react';
import * as _ from 'lodash';
import { shallow } from 'enzyme';
import { InputField, SyncedEditorField, FormHeader } from '@console/shared';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import HelmInstallUpgradeForm from '../HelmInstallUpgradeForm';
import { HelmActionType } from '../../helm-types';
import { coFetchJSON } from '@console/internal/co-fetch';
import { formikFormProps } from '@console/shared/src/test-utils/formik-props-utils';

const formValues = {
  releaseName: 'helm-release',
  chartName: 'helm-release',
  chartVersion: '0.3',
  chartReadme: 'some-readme',
  yamlData: 'chart-yaml-values',
  formData: {
    test: 'data',
  },
  formSchema: {
    type: 'object',
    required: ['test'],
    properties: {
      test: {
        type: 'string',
      },
    },
  },
  editorType: EditorType.Form,
};

const helmConfig = {
  type: HelmActionType.Install,
  title: 'Install Helm Chart',
  subTitle: {
    form: 'Mock form help text',
    yaml: 'Mock yaml help text',
  },
  helmReleaseApi: `/api/helm/chart?url=mock-chart-url`,
  fetch: coFetchJSON.post,
  redirectURL: 'mock-redirect-url',
};

const componentProps = {
  chartHasValues: true,
  helmActionConfig: helmConfig,
  onVersionChange: jest.fn(),
  chartMetaDescription: <p>Some chart meta</p>,
};

const props: React.ComponentProps<typeof HelmInstallUpgradeForm> = {
  ...componentProps,
  ...formikFormProps,
  values: formValues,
};

describe('HelmInstallUpgradeForm', () => {
  it('should render the SyncedEditorField  component', () => {
    const wrapper = shallow(<HelmInstallUpgradeForm {...props} />);
    expect(wrapper.find(SyncedEditorField).exists()).toBe(true);
  });

  it('should render FormHeader with correct title for the form', () => {
    const wrapper = shallow(<HelmInstallUpgradeForm {...props} />);
    const header = wrapper.find(FormHeader);
    expect(header.exists()).toBe(true);
    expect(header.props().title).toBe(helmConfig.title);
  });

  it('should render FormHeader with form help text', () => {
    const wrapper = shallow(<HelmInstallUpgradeForm {...props} />);
    const header = wrapper.find(FormHeader);
    const helpText = header.props().helpText as any;
    expect(header.exists()).toBe(true);
    expect(helpText.props.children[0].props.children).toContain(helmConfig.subTitle.form);
  });

  it('should render FormHeader with yaml help text', () => {
    const newProps = _.cloneDeep(props);
    newProps.values.editorType = EditorType.YAML;
    const wrapper = shallow(<HelmInstallUpgradeForm {...newProps} />);
    const header = wrapper.find(FormHeader);
    const helpText = header.props().helpText as any;
    expect(header.exists()).toBe(true);
    expect(helpText.props.children[0].props.children).toContain(helmConfig.subTitle.yaml);
  });

  it('should not render form helm text if there are no chart values', () => {
    const newProps = _.cloneDeep(props);
    newProps.chartHasValues = false;
    const wrapper = shallow(<HelmInstallUpgradeForm {...newProps} />);
    const header = wrapper.find(FormHeader);
    const helpText = header.props().helpText as any;
    expect(header.exists()).toBe(true);
    expect(helpText.props.children[0]).toBeFalsy();
    expect(helpText.props.children[1]).toBeTruthy();
  });

  it('should not render readme button in help text if there is no readme', () => {
    const newProps = _.cloneDeep(props);
    newProps.values.chartReadme = null;
    const wrapper = shallow(<HelmInstallUpgradeForm {...newProps} />);
    const header = wrapper.find(FormHeader);
    const helpText = header.props().helpText as any;
    expect(header.exists()).toBe(true);
    expect(helpText.props.children[0]).toBeTruthy();
    expect(helpText.props.children[1]).toBeFalsy();
  });

  it('should disable form editor if there is no formSchema', () => {
    const newProps = _.cloneDeep(props);
    newProps.values.formSchema = null;
    const wrapper = shallow(<HelmInstallUpgradeForm {...newProps} />);
    const editor = wrapper.find(SyncedEditorField);
    expect(editor.exists()).toBe(true);
    expect(editor.props().formContext.isDisabled).toBe(true);
  });

  it('should have the Release Name field disabled in the Helm Upgrade Form', () => {
    const newProps = _.cloneDeep(props);
    newProps.helmActionConfig.type = HelmActionType.Upgrade;
    const wrapper = shallow(<HelmInstallUpgradeForm {...newProps} />);
    expect(wrapper.find(InputField).props().label).toBe('Release Name');
    expect(wrapper.find(InputField).props().isDisabled).toBe(true);
  });
});
