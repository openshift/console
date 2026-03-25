import { render, screen } from '@testing-library/react';
import type { ImageTag } from '@console/dev-console/src/utils/imagestream-utils';
import { formikFormProps } from '@console/shared/src/test-utils/formik-props-utils';
import UploadJarForm from '../UploadJarForm';

jest.mock('@patternfly/react-core', () => ({
  Alert: (props) =>
    `Alert variant=${props.variant} title="${props.title}" isInline=${props.isInline}`,
}));

jest.mock('@console/shared/src/components/form-utils', () => ({
  FlexForm: (props) => props.children,
  FormBody: (props) => props.children,
  FormFooter: () => 'FormFooter',
}));

jest.mock('../section/JarSection', () => ({
  __esModule: true,
  default: () => 'Jar Section',
}));

jest.mock('../../section/IconSection', () => ({
  __esModule: true,
  default: () => 'Icon Section',
}));

jest.mock('../../builder/BuilderImageTagSelector', () => ({
  __esModule: true,
  default: (props) => `BuilderImageTagSelector showImageInfo=${props.showImageInfo}`,
}));

jest.mock('../../app/AppSection', () => ({
  __esModule: true,
  default: () => 'AppSection',
}));

jest.mock('../../advanced/AdvancedSection', () => ({
  __esModule: true,
  default: () => 'AdvancedSection',
}));

jest.mock('../../NamespaceSection', () => ({
  __esModule: true,
  default: () => 'Namespace Section',
}));

jest.mock('../../section/FormSection', () => ({
  __esModule: true,
  default: (props) => props.children,
}));

jest.mock('../../section/ResourceSection', () => ({
  __esModule: true,
  default: () => 'Resource Section',
}));

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@console/internal/components/utils', () => ({
  usePreventDataLossLock: jest.fn(),
}));

describe('UploadJarForm', () => {
  const tagData: ImageTag = {
    name: 'openjdk-11-el7',
    generation: 2,
    annotations: {},
  };

  const defaultProps = {
    ...formikFormProps,
    values: {
      image: { tag: tagData },
      project: { name: 'test-project' },
    },
    namespace: 'my-app',
    projects: {
      loaded: true,
      data: [],
      loadError: null,
    },
    builderImage: {
      description: 'Build and run Java applications using Maven and OpenJDK 11.',
      displayName: 'Red Hat OpenJDK',
      iconUrl: 'static/assets/openjdk.svg',
      imageStreamNamespace: 'openshift',
      name: 'java',
      obj: {},
      title: 'Java',
      recentTag: tagData,
      tags: [tagData],
    },
  };

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should render form components', () => {
    render(<UploadJarForm {...defaultProps} />);

    expect(screen.getByText(/Jar Section/)).toBeInTheDocument();
    expect(screen.getByText(/Icon Section/)).toBeInTheDocument();
    expect(screen.getByText(/BuilderImageTagSelector showImageInfo=false/)).toBeInTheDocument();
    expect(screen.getByText(/AppSection/)).toBeInTheDocument();
    expect(screen.getByText(/AdvancedSection/)).toBeInTheDocument();
    expect(screen.getByText(/Namespace Section/)).toBeInTheDocument();
    expect(screen.getByText(/Resource Section/)).toBeInTheDocument();
    expect(screen.getByText(/FormFooter/)).toBeInTheDocument();
  });

  it('should not render BuilderImageTagSelector if builderImage is not present and show alert', () => {
    const updatedProps = {
      ...formikFormProps,
      values: {
        image: { tag: tagData },
        project: { name: 'test-project' },
      },
      namespace: 'my-app',
      projects: {
        loaded: true,
        data: [],
        loadError: null,
      },
    };

    render(<UploadJarForm {...updatedProps} />);

    expect(screen.getByText(/Jar Section/)).toBeInTheDocument();
    expect(screen.getByText(/Icon Section/)).toBeInTheDocument();
    expect(screen.getByText(/AppSection/)).toBeInTheDocument();
    expect(screen.getByText(/AdvancedSection/)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Alert variant=warning title=".*Unable to detect the Builder Image.*" isInline=true/,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/BuilderImageTagSelector/)).not.toBeInTheDocument();
  });
});
