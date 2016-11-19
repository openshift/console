import React from 'react';

export const RadioInput = ({value, title, desc, onChange, checked, children}) => {
  const id = `modal-radio--${value}`;
  return <div>
    <input value={value} key={id} checked={checked} onChange={onChange} type="radio" id={id} />
    <label htmlFor={id}>{title}</label>
    {desc && <p className="co-m-radio-desc text-muted">{desc}</p> }
    {children}
  </div>;
};
RadioInput.propTypes = {
  checked: React.PropTypes.bool,
  children: React.PropTypes.node,
  desc: React.PropTypes.node,
  title: React.PropTypes.node.isRequired,
  onChange: React.PropTypes.func.isRequired,
  value: React.PropTypes.string.isRequired
};
