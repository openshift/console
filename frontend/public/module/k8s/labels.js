export const linkEncode = labels => {
  var result = _.map(_.keys(labels), function(key) {
    return `${key}%3D${labels[key]}`;
  });
  return result.join(',');
};
