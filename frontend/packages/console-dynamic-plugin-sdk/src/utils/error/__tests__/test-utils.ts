type AnyConstructor = new (...args) => any;
export const checkProtoChain = (Contructor: AnyConstructor, ...chain: AnyConstructor[]) => {
  const error = new Contructor();
  expect(error).toBeInstanceOf(Contructor);
  chain.forEach((type) => expect(error).toBeInstanceOf(type));
};

type CheckedProperties = {
  [key: string]: any;
  name: string;
  message: string;
};
export const checkProperties = (error: any, properties: CheckedProperties) => {
  Object.keys(properties).forEach((property) =>
    expect(error[property]).toEqual(properties[property]),
  );
  const stackPattern = properties.message
    ? `${properties.name}: ${properties.message}`
    : new RegExp(`^${properties.name}\\b`);
  expect(error.stack).toMatch(stackPattern);
};
