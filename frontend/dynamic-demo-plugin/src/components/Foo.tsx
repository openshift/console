import * as React from 'react';

const Foo: React.FC<{ label: string }> = ({ label }) => <h2>Hello {label} Component!</h2>;

export default Foo;
