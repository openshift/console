// Encode a labels object hash into a URL query string.
export const urlEncode = labels => {
  var result = _.map(_.keys(labels), function(key) {
    return `${key}=${labels[key]}`;
  });
  return result.join(',');
};

export const linkEncode = labels => {
  var result = _.map(_.keys(labels), function(key) {
    return `${key}%3D${labels[key]}`;
  });
  return result.join(',');
};

// Decode a URL query string into a labels object hash.
export const urlDecode = query => {
  if (!query) {
    return {};
  }
  return _.reduce(query.split(','), function(prev, val) {
    var parts;
    if (!val) {
      return prev;
    }
    parts = val.split('=');
    if (_.isEmpty(parts) || parts.length !== 2) {
      return prev;
    }
    prev[parts[0]] = parts[1];
    return prev;
  }, {});
};
