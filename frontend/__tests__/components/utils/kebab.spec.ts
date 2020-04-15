import { extendKebabOptions } from '../../../public/components/utils';
import { NamespaceModel } from '../../../public/models';
import { testNamespace } from '../../../__mocks__/k8sResourcesMocks';

const Foo = { label: 'Foo' };
const Bar = { label: 'Bar' };
const Qux = { label: 'Qux' };
const Ext1 = { label: 'Ext1' };
const Ext2 = { label: 'Ext2' };
const Ext3 = { label: 'Ext3' };
const Ext4 = { label: 'Ext4' };

describe('extendKebabOptions', () => {
  it('adds new options at the right position', () => {
    expect(
      extendKebabOptions(
        [Foo, Bar, Qux],
        [
          {
            type: 'Resource/Actions',
            properties: {
              getResourceActions: () => [() => Ext1, () => Ext2],
              mergeBefore: 'Bar',
            },
          },
          {
            type: 'Resource/Actions',
            properties: {
              getResourceActions: () => [() => Ext3, () => Ext4],
              mergeBefore: 'NonExistent',
            },
          },
        ],
        NamespaceModel,
        testNamespace,
      ),
    ).toEqual([Foo, Ext1, Ext2, Bar, Qux, Ext3, Ext4]);
  });

  it('does not modify the original options object', () => {
    const options = [Foo, Bar];
    const result = extendKebabOptions(
      options,
      [
        {
          type: 'Resource/Actions',
          properties: {
            getResourceActions: () => [() => Ext1, () => Ext2],
            mergeBefore: 'Bar',
          },
        },
      ],
      NamespaceModel,
      testNamespace,
    );
    expect(options).toEqual([Foo, Bar]);
    expect(result).not.toBe(options);
  });
});
