import * as React from 'react';
import { Alert, Button } from '@patternfly/react-core';
import { shallow, ShallowWrapper } from 'enzyme';
import { safeDump } from 'js-yaml';
import * as _ from 'lodash';
import { CreateYAML } from '@console/internal/components/create-yaml';
import { BreadCrumbs } from '@console/internal/components/utils';
import { Firehose } from '@console/internal/components/utils/firehose';
import { CustomResourceDefinitionModel } from '@console/internal/models';
import * as k8s from '@console/internal/module/k8s';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { referenceForProvidedAPI } from '..';
import {
  testClusterServiceVersion,
  testResourceInstance,
  testModel,
  testCRD,
} from '../../../mocks';
import { ClusterServiceVersionModel } from '../../models';
import { CreateOperandPage, CreateOperand, CreateOperandProps } from './create-operand';
import { OperandForm, OperandFormProps } from './operand-form';
import { OperandYAML, OperandYAMLProps } from './operand-yaml';
import Spy = jasmine.Spy;

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

xdescribe('[https://issues.redhat.com/browse/CONSOLE-2137] CreateOperand', () => {
  let wrapper: ShallowWrapper<CreateOperandProps>;

  beforeEach(() => {
    const match = {
      params: { appName: 'app', ns: 'default', plural: k8s.referenceFor(testResourceInstance) },
      isExact: true,
      url: '',
      path: '',
    };
    wrapper = shallow(
      <CreateOperand
        initialEditorType={EditorType.YAML}
        model={testModel}
        clusterServiceVersion={{ data: testClusterServiceVersion, loaded: true, loadError: null }}
        customResourceDefinition={{ data: testCRD, loaded: true, loadError: null }}
        loaded
        match={match}
      />,
    );
  });

  it('renders breadcrumb links for given ClusterServiceVersion', () => {
    expect(wrapper.find(BreadCrumbs).props().breadcrumbs).toEqual([
      {
        name: testClusterServiceVersion.spec.displayName,
        path: window.location.pathname.replace('/~new', ''),
      },
      { name: `Create ${testModel.label}`, path: window.location.pathname },
    ]);
  });

  it('renders YAML editor by default', () => {
    expect(
      wrapper
        .find(Button)
        .childAt(0)
        .text(),
    ).toEqual('Edit Form');
    expect(wrapper.find(OperandYAML).exists()).toBe(true);
    expect(wrapper.find(OperandForm).exists()).toBe(false);
  });

  it('passes correct YAML to YAML editor', () => {
    const data = _.cloneDeep(testClusterServiceVersion);
    const testResourceInstanceYAML = safeDump(testResourceInstance);
    data.metadata.annotations = { 'alm-examples': JSON.stringify([testResourceInstance]) };
    wrapper = wrapper.setProps({ clusterServiceVersion: { data, loaded: true, loadError: null } });

    expect(wrapper.find(OperandYAML).props().initialYAML).toEqual(testResourceInstanceYAML);
  });

  it('switches to form component when button is clicked', () => {
    wrapper.find(Button).simulate('click');

    expect(
      wrapper
        .find(Button)
        .childAt(0)
        .text(),
    ).toEqual('Edit YAML');
    expect(wrapper.find(OperandYAML).exists()).toBe(false);
    expect(wrapper.find(OperandForm).exists()).toBe(true);
  });
});

describe('CreateOperandPage', () => {
  const match = {
    params: { appName: 'app', ns: 'default', plural: k8s.referenceFor(testResourceInstance) },
    isExact: true,
    url: '',
    path: '',
  };

  it('renders a <Firehose> for the correct resources', () => {
    const wrapper = shallow(<CreateOperandPage.WrappedComponent match={match} model={testModel} />);

    expect(wrapper.find(Firehose).props().resources).toEqual([
      {
        kind: k8s.referenceForModel(ClusterServiceVersionModel),
        name: match.params.appName,
        namespace: match.params.ns,
        isList: false,
        prop: 'clusterServiceVersion',
      },
      {
        kind: CustomResourceDefinitionModel.kind,
        name: k8s.nameForModel(testModel),
        isList: false,
        prop: 'customResourceDefinition',
        optional: true,
      },
    ]);
  });
});

xdescribe('[https://issues.redhat.com/browse/CONSOLE-2136] CreateOperandForm', () => {
  let wrapper: ShallowWrapper<OperandFormProps>;

  const spyAndExpect = (spy: Spy) => (returnValue: any) =>
    new Promise((resolve) =>
      spy.and.callFake((...args) => {
        resolve(args);
        return returnValue;
      }),
    );

  beforeEach(() => {
    wrapper = shallow(
      <OperandForm
        match={{ params: { ns: 'default' } }}
        model={testModel}
        providedAPI={testClusterServiceVersion.spec.customresourcedefinitions.owned[0]}
        csv={testClusterServiceVersion}
        schema={testCRD.spec.versions[0].schema.openAPIV3Schema}
      />,
    );
  });

  it('renders form', () => {
    expect(
      referenceForProvidedAPI(testClusterServiceVersion.spec.customresourcedefinitions.owned[0]),
    ).toEqual(k8s.referenceForModel(testModel));

    expect(wrapper.find('form').exists()).toBe(true);
  });

  it('renders input component for each field', () => {
    wrapper.find('.co-dynamic-form__form-group').forEach((formGroup) => {
      const descriptor = testClusterServiceVersion.spec.customresourcedefinitions.owned[0].specDescriptors.find(
        (d) => d.displayName === formGroup.find('.form-label').text(),
      );

      expect(descriptor).toBeDefined();
    });
  });

  it('renders alert to use YAML editor for full control over all operand fields', () => {
    expect(wrapper.find(Alert).props().title).toEqual(
      'Note: Some fields may not be represented in this form. Please select "Edit YAML" for full control of object creation.',
    );
    expect(wrapper.find(Alert).props().variant).toEqual('info');
  });

  it('calls `k8sCreate` to create new operand if form is valid', (done) => {
    spyAndExpect(spyOn(k8s, 'k8sCreate'))(Promise.resolve({}))
      .then(([model, obj]: [k8s.K8sKind, k8s.K8sResourceKind]) => {
        expect(model).toEqual(testModel);
        expect(obj.apiVersion).toEqual(k8s.apiVersionForModel(testModel));
        expect(obj.kind).toEqual(testModel.kind);
        expect(obj.metadata.name).toEqual('example');
        expect(obj.metadata.namespace).toEqual('default');
        done();
      })
      .catch((err) => fail(err));

    wrapper.find({ type: 'submit' }).simulate('click', new Event('click'));
  });

  it('displays errors if calling `k8sCreate` fails', (done) => {
    const error = { message: 'Failed to create' } as k8s.Status;
    /* eslint-disable-next-line prefer-promise-reject-errors */
    spyAndExpect(spyOn(k8s, 'k8sCreate'))(Promise.reject({ json: error }))
      .then(
        () => new Promise<void>((resolve) => setTimeout(() => resolve(), 10)),
      )
      .then(() => {
        expect(
          wrapper
            .find(Alert)
            .at(0)
            .props().title,
        ).toEqual(error.message);
        done();
      })
      .catch((err) => fail(err));

    wrapper.find({ type: 'submit' }).simulate('click', new Event('click'));
  });
});

describe(OperandYAML.displayName, () => {
  let wrapper: ShallowWrapper<OperandYAMLProps>;

  beforeEach(() => {
    wrapper = shallow(
      <OperandYAML
        match={{
          isExact: true,
          url: '',
          path: '',
          params: {
            ns: 'default',
            appName: 'example',
            plural: k8s.referenceFor(testResourceInstance),
          },
        }}
      />,
    );
  });

  it('renders `CreateYAML` component with correct props', () => {
    expect(wrapper.find(CreateYAML).props().hideHeader).toBe(true);
  });
});
