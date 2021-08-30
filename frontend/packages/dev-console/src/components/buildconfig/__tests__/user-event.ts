// TODO: ODC-6264 Replace this workaround with a working version of @testing-library/user-event
// The user-event library crashs when calling type/click on our @console/shared or PatternFly fields.
import { fireEvent } from '@testing-library/react';

function click(element: Element) {
  fireEvent.click(element);
}

// selection and special keys like {backspace} are not supported.
function type(element: Element, text: string) {
  if (element.nodeName.toLowerCase() === 'input') {
    if (!element.getAttribute('type') || element.getAttribute('type') === 'text') {
      const oldValue = element.getAttribute('value') ?? '';

      fireEvent.focusIn(element);
      fireEvent.click(element);
      for (let i = 0; i < text.length; i++) {
        const keyEventData = { key: text.substr(i, 1), code: text.substr(i, 1) };
        fireEvent.keyUp(element, { target: keyEventData });
        fireEvent.keyDown(element, { target: keyEventData });
        fireEvent.keyPress(element, { target: keyEventData });
      }
      fireEvent.change(element, { target: { value: oldValue + text } });
      fireEvent.focusOut(element);
    } else {
      throw new Error(`Unsupported input type "${element.getAttribute('type')}"`);
    }
  } else if (element.nodeName.toLowerCase() === 'textarea') {
    const oldValue = element.getAttribute('value') ?? '';

    fireEvent.focusIn(element);
    fireEvent.click(element);
    for (let i = 0; i < text.length; i++) {
      const keyEventData = { key: text.substr(i, 1), code: text.substr(i, 1) };
      fireEvent.keyUp(element, { target: keyEventData });
      fireEvent.keyDown(element, { target: keyEventData });
      fireEvent.keyPress(element, { target: keyEventData });
    }
    fireEvent.change(element, { target: { value: oldValue + text } });
    fireEvent.focusOut(element);
  } else {
    throw new Error(`Unsupported node type "${element.nodeName}"`);
  }
}

function clear(element: Element) {
  if (element.nodeName.toLowerCase() === 'input') {
    if (!element.getAttribute('type') || element.getAttribute('type') === 'text') {
      fireEvent.focusIn(element);
      fireEvent.click(element);
      fireEvent.change(element, { target: { value: '' } });
      fireEvent.focusOut(element);
    } else {
      throw new Error(`Unsupported input type "${element.getAttribute('type')}"`);
    }
  } else {
    throw new Error(`Unsupported node type "${element.nodeName}"`);
  }
}

const userEvent = {
  click,
  type,
  clear,
};

export default userEvent;
