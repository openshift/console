export const getAutoscaleWindow = (autoscaleValue: string) => {
  const windowRegEx = /^[0-9]+|[a-zA-Z]*/g;
  return autoscaleValue?.match(windowRegEx);
};
