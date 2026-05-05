import type { ComponentProps, ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { formikFormProps } from '@console/shared/src/test-utils/formik-props-utils';
import KnatifyForm from '../KnatifyForm';

jest.mock('@console/dev-console/src/components/import/advanced/AdvancedSection', () => ({
  __esModule: true,
  default: jest
    .requireActual('@console/knative-plugin/src/__tests__/rtl-stub-components')
    .createKnativeTextStub('mock-AdvancedSection'),
}));

jest.mock('@console/dev-console/src/components/import/app/AppSection', () => ({
  __esModule: true,
  default: jest
    .requireActual('@console/knative-plugin/src/__tests__/rtl-stub-components')
    .createKnativeTextStub('mock-AppSection'),
}));

jest.mock('@console/dev-console/src/components/import/image-search/ImageSearchSection', () => ({
  __esModule: true,
  default: jest
    .requireActual('@console/knative-plugin/src/__tests__/rtl-stub-components')
    .createKnativeTextStub('mock-ImageSearchSection'),
}));

jest.mock('@console/dev-console/src/components/import/section/IconSection', () => ({
  __esModule: true,
  default: jest
    .requireActual('@console/knative-plugin/src/__tests__/rtl-stub-components')
    .createKnativeTextStub('mock-IconSection'),
}));

jest.mock('@console/shared/src/components/form-utils', () => ({
  FormFooter: jest
    .requireActual('@console/knative-plugin/src/__tests__/rtl-stub-components')
    .createKnativeTextStub('mock-FormFooter'),
  FlexForm: ({ children }: { children?: ReactNode }) => children ?? null,
  FormBody: ({ children }: { children?: ReactNode }) => children ?? null,
}));

jest.mock('@console/internal/components/utils', () => ({
  usePreventDataLossLock: jest.fn(),
}));

jest.mock('react-i18next');

let knatifyFormProps: ComponentProps<typeof KnatifyForm>;

describe('KnatifyForm', () => {
  beforeEach(() => {
    knatifyFormProps = {
      ...formikFormProps,
      projects: {
        loaded: true,
        data: [],
      },
    };
  });

  it('should render ImageSearchSection, IconSection, AppSection, AdvancedSection and FormFooter', () => {
    render(<KnatifyForm {...knatifyFormProps} />);
    expect(screen.getByText('mock-ImageSearchSection')).toBeVisible();
    expect(screen.getByText('mock-IconSection')).toBeVisible();
    expect(screen.getByText('mock-AppSection')).toBeVisible();
    expect(screen.getByText('mock-AdvancedSection')).toBeVisible();
    expect(screen.getByText('mock-FormFooter')).toBeVisible();
  });
});
