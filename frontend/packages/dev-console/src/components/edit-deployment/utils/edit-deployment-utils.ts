export const getContainerNames = (containers: { [key: string]: any }[]) => {
  return (
    containers?.reduce((acc, container) => {
      return {
        ...acc,
        [container.name]: container.name,
      };
    }, {}) ?? []
  );
};
