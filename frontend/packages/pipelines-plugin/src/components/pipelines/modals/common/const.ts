import { PipelineResourceType } from '../../const';

export const CREATE_PIPELINE_RESOURCE = '#CREATE_PIPELINE_RESOURCE#';

export const initialResourceFormValues = {
  [PipelineResourceType.git]: {
    params: {
      url: '',
      revision: '',
    },
  },
  [PipelineResourceType.image]: {
    params: {
      url: '',
    },
  },
  [PipelineResourceType.storage]: {
    params: {
      type: '',
      location: '',
      dir: '',
    },
  },
  [PipelineResourceType.cluster]: {
    params: {
      name: '',
      url: '',
      username: '',
      password: '',
      insecure: '',
    },
    secrets: {
      cadata: '',
      token: '',
    },
  },
};
