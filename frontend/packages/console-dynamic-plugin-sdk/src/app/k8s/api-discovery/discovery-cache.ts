const SDK_API_DISCOVERY_RESOURCES_LOCAL_STORAGE_KEY = 'sdk/api-discovery-resources';

export const cacheResources = (resources) => {
  try {
    localStorage.setItem(SDK_API_DISCOVERY_RESOURCES_LOCAL_STORAGE_KEY, JSON.stringify(resources));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Error caching API resources in localStorage', e);
    throw new Error(e);
  }
};

export const getCachedResources = async () => {
  const resourcesJSON = localStorage.getItem(SDK_API_DISCOVERY_RESOURCES_LOCAL_STORAGE_KEY);
  if (!resourcesJSON) {
    throw new Error(
      `No API resources found in localStorage for key ${SDK_API_DISCOVERY_RESOURCES_LOCAL_STORAGE_KEY}`,
    );
  }

  // Clear cached resources after load as a safeguard. If there's any errors
  // with the content that prevents the console from working, the bad data
  // will not be loaded when the user refreshes the console. The cache will
  // be refreshed when discovery completes.
  localStorage.removeItem(SDK_API_DISCOVERY_RESOURCES_LOCAL_STORAGE_KEY);

  const resources = JSON.parse(resourcesJSON);
  // eslint-disable-next-line no-console
  console.log('Loaded cached API resources from localStorage');
  return resources;
};
