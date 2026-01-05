import type { ComponentProps } from 'react';
import { screen } from '@testing-library/react';
import { useField } from 'formik';
import * as _ from 'lodash';
import { coFetchJSON } from '@console/internal/co-fetch';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { useEditorType } from '@console/shared/src/components/synced-editor/useEditorType';
import { formikFormProps } from '@console/shared/src/test-utils/formik-props-utils';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { HelmActionType } from '../../../types/helm-types';
import HelmInstallUpgradeForm, {
  HelmInstallUpgradeFormData,
} from '../install-upgrade/HelmInstallUpgradeForm';

// Mock the barrel import from @console/shared
jest.mock('@console/shared', () => ({
  ...jest.requireActual('@console/shared'),
  CodeEditorField: () => 'CodeEditorField',
  DynamicFormField: () => 'DynamicFormField',
  FlexForm: ({ children }: any) => children,
}));

// Mock HelmChartVersionDropdown
jest.mock('../install-upgrade/HelmChartVersionDropdown', () => ({
  __esModule: true,
  default: () => 'HelmChartVersionDropdown',
}));

jest.mock('@openshift-console/plugin-shared/src/hooks/useResizeObserver', () => ({
  useResizeObserver: jest.fn(),
}));

// Mock FormSection
jest.mock('@console/dev-console/src/components/import/section/FormSection', () => ({
  __esModule: true,
  default: ({ children }: any) => children,
}));

jest.mock('@console/shared/src/components/synced-editor/useEditorType', () => ({
  useEditorType: jest.fn(),
}));

jest.mock('formik', () => ({
  useField: jest.fn(() => [{ value: 'form' }, {}]),
  useFormikContext: jest.fn(() => ({
    values: {},
    setFieldValue: jest.fn(),
  })),
}));

const mockUseEditorType = useEditorType as jest.Mock;
const mockUseField = useField as jest.Mock;

// For internal used Dropdowns
jest.mock('@console/shared/src/hooks/useUserSettingsCompatibility', () => ({
  useUserSettingsCompatibility: () => ['', () => {}],
}));

jest.mock('@console/shared/src/hooks/useUserSettings', () => ({
  useUserSettings: jest.fn(),
}));

jest.mock(
  '@console/app/src/components/user-preferences/synced-editor/usePreferredCreateEditMethod',
  () => ({
    usePreferredCreateEditMethod: jest.fn(),
  }),
);

const formValues: HelmInstallUpgradeFormData = {
  releaseName: 'helm-release',
  chartName: 'helm-release',
  chartRepoName: 'helm-repo',
  chartVersion: '0.3',
  chartReadme: 'some-readme',
  appVersion: '0.3',
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
  type: HelmActionType.Create,
  title: 'Create Helm Release',
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
  chartError: null,
};

const props: ComponentProps<typeof HelmInstallUpgradeForm> = {
  ...componentProps,
  ...formikFormProps,
  initialValues: formValues,
  values: formValues,
  namespace: 'xyz',
};

describe('HelmInstallUpgradeForm', () => {
  it('should render successfully without errors', () => {
    mockUseEditorType.mockReturnValue([EditorType.Form, jest.fn(), true]);
    mockUseField.mockReturnValue([{ value: EditorType.Form }, {}]);
    renderWithProviders(<HelmInstallUpgradeForm {...props} />);
    expect(screen.getByText(/Create Helm Release/)).toBeTruthy();
  });

  it('should render FormHeader with correct title for the form', () => {
    mockUseEditorType.mockReturnValue([EditorType.Form, jest.fn(), true]);
    renderWithProviders(<HelmInstallUpgradeForm {...props} />);
    expect(screen.getByText(helmConfig.title)).toBeTruthy();
  });

  it('should render FormHeader with form help text', () => {
    mockUseEditorType.mockReturnValue([EditorType.Form, jest.fn(), true]);
    renderWithProviders(<HelmInstallUpgradeForm {...props} />);
    expect(screen.getByText(/Mock form help text/)).toBeTruthy();
  });

  it('should render FormHeader with yaml help text', () => {
    const newProps = _.cloneDeep(props);
    newProps.values.editorType = EditorType.YAML;
    mockUseField.mockReturnValue([{ value: EditorType.YAML }, {}]);
    mockUseEditorType.mockReturnValue([EditorType.YAML, jest.fn(), true]);
    renderWithProviders(<HelmInstallUpgradeForm {...newProps} />);
    expect(screen.getByText(/Mock yaml help text/)).toBeTruthy();
  });

  it('should not render form helm text if there are no chart values', () => {
    const newProps = _.cloneDeep(props);
    newProps.chartHasValues = false;
    renderWithProviders(<HelmInstallUpgradeForm {...newProps} />);
    expect(screen.queryByText(helmConfig.subTitle.form)).toBeFalsy();
  });

  it('should not render readme button in help text if there is no readme', () => {
    const newProps = _.cloneDeep(props);
    newProps.values.chartReadme = null;
    renderWithProviders(<HelmInstallUpgradeForm {...newProps} />);
    expect(screen.queryByText(/readme/i)).toBeFalsy();
  });

  it('should have the release name field disabled in the Helm Upgrade Form', () => {
    const newProps = _.cloneDeep(props);
    newProps.helmActionConfig.type = HelmActionType.Upgrade;
    renderWithProviders(<HelmInstallUpgradeForm {...newProps} />);

    const releaseNameInput = screen.getByTestId('release-name');
    expect(releaseNameInput).toBeTruthy();
    expect(releaseNameInput).toHaveAttribute('disabled');
  });

  it('should show error alert when chart is not reachable', () => {
    const newProps = _.cloneDeep(props);
    newProps.chartError = new Error('Chart not reachable');
    renderWithProviders(<HelmInstallUpgradeForm {...newProps} />);

    expect(
      screen.getByText(/The Helm Chart is currently unavailable. Error: Chart not reachable/i),
    ).toBeTruthy();
  });

  it('should disable release name field and Install button if chart is not reachable', () => {
    const newProps = _.cloneDeep(props);
    newProps.chartError = new Error('Chart not reachable');
    renderWithProviders(<HelmInstallUpgradeForm {...newProps} />);

    const releaseNameInput = screen.getByTestId('release-name');
    expect(releaseNameInput).toBeTruthy();
    expect(releaseNameInput).toHaveAttribute('disabled');

    const installButton = screen.getByTestId('save-changes');
    expect(installButton).toBeTruthy();
    expect(installButton).toHaveAttribute('disabled');
  });

  it('should not show form editor if chart is not reachable', () => {
    const newProps = _.cloneDeep(props);
    newProps.chartError = new Error('Chart not reachable');
    renderWithProviders(<HelmInstallUpgradeForm {...newProps} />);

    // Form editor should not be present when chart has error
    expect(screen.queryByTestId('synced-editor-field')).toBeFalsy();
  });
});
