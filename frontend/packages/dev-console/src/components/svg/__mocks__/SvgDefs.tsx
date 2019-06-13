import * as React from 'react';
import { SvgDefsProps } from '../SvgDefs';

// This mock simply renders the `defs` in place.
const SvgDefsMock: React.FC<SvgDefsProps> = ({ id, children }) => <defs id={id}>{children}</defs>;

export default SvgDefsMock;
