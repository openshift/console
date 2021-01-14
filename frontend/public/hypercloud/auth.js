export const getAccessToken = function() {
  return sessionStorage.getItem('accessToken');
};

export const getId = function() {
  return sessionStorage.getItem('id');
};

export const setAccessToken = function(at) {
  sessionStorage.setItem('accessToken', at);
  return;
};

export const setId = function(id) {
  sessionStorage.setItem('id', id);
  return;
};

// 로그아웃 시 사용
export const resetLoginState = function() {
  sessionStorage.clear();
  return;
};
