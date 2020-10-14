import { Package } from '../codegen/plugin-resolver';

export const getTemplatePackage = ({
  name = 'test',
  version = '0.0.0',
  _path = `/test/packages/${name}-pkg`,
} = {}): Package =>
  Object.freeze({
    name,
    version,
    readme: '',
    _id: `${name}@${version}`,
    _path,
  });
