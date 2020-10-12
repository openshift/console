import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { TextColumnField } from '@console/shared';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { AsyncComponent } from '@console/internal/components/utils/async';
import ContainerSourceSection from '../ContainerSourceSection';

type ContainerSourceSectionProps = React.ComponentProps<typeof ContainerSourceSection>;

jest.mock('formik', () => ({
  useField: jest.fn(() => [{}, {}]),
  useFormikContext: jest.fn(() => ({
    setFieldValue: jest.fn(),
    setFieldTouched: jest.fn(),
    validateForm: jest.fn(),
    values: {
      type: 'ContainerSource',
      data: {
        ContainerSource: {
          template: {
            spec: {
              containers: [
                {
                  args: [],
                },
              ],
            },
          },
        },
      },
    },
  })),
}));
describe('ContainerSourceSection', () => {
  const title = 'Container Source';
  let wrapper: ShallowWrapper<ContainerSourceSectionProps>;
  beforeEach(() => {
    wrapper = shallow(<ContainerSourceSection title={title} />);
  });

  it('should render ContainerSource FormSection', () => {
    expect(wrapper.find(FormSection)).toHaveLength(1);
    expect(wrapper.find(FormSection).props().title).toBe('Container Source');
  });

  it('should render Container image and name input fields', () => {
    const imageInputField = wrapper.find('[data-test-id="container-image-field"]');
    const nameInputField = wrapper.find('[data-test-id="container-name-field"]');
    expect(imageInputField).toHaveLength(1);
    expect(nameInputField).toHaveLength(1);
  });

  it('should render Container args field', () => {
    const argsField = wrapper.find(TextColumnField);
    expect(argsField).toHaveLength(1);
  });

  it('should render environment variables section', () => {
    const nameValueEditorField = wrapper.find(AsyncComponent);
    expect(nameValueEditorField).toHaveLength(1);
    expect(nameValueEditorField.props().nameString).toBe('Name');
    expect(nameValueEditorField.props().valueString).toBe('Value');
  });
});
