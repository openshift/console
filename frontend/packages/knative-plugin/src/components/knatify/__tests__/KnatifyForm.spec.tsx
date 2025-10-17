import * as React from 'react';
import { render } from '@testing-library/react';
import { formikFormProps } from '@console/shared/src/test-utils/formik-props-utils';
import KnatifyForm from '../KnatifyForm';

jest.mock('@console/dev-console/src/components/import/advanced/AdvancedSection', () => ({
  __esModule: true,
  default: 'AdvancedSection',
}));

jest.mock('@console/dev-console/src/components/import/app/AppSection', () => ({
  __esModule: true,
  default: 'AppSection',
}));

jest.mock('@console/dev-console/src/components/import/image-search/ImageSearchSection', () => ({
  __esModule: true,
  default: 'ImageSearchSection',
}));

jest.mock('@console/dev-console/src/components/import/section/IconSection', () => ({
  __esModule: true,
  default: 'IconSection',
}));

jest.mock('@console/shared/src/components/form-utils', () => ({
  FormFooter: 'FormFooter',
  FlexForm: 'FlexForm',
  FormBody: 'FormBody',
}));

jest.mock('@console/internal/components/utils', () => ({
  usePreventDataLossLock: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

let knatifyFormProps: React.ComponentProps<typeof KnatifyForm>;

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
    const { container } = render(<KnatifyForm {...knatifyFormProps} />);
    expect(container.querySelector('ImageSearchSection')).toBeInTheDocument();
    expect(container.querySelector('IconSection')).toBeInTheDocument();
    expect(container.querySelector('AppSection')).toBeInTheDocument();
    expect(container.querySelector('AdvancedSection')).toBeInTheDocument();
    expect(container.querySelector('FormFooter')).toBeInTheDocument();
  });
});
