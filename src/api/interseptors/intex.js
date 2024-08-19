import axios from "axios";

function setInterceptor(instance) {
  instance.interceptors.request.use(async function (config) {
    return config;
  });
  instance.interceptors.response.use(
    function (response) {
      return response.data;
    },
    async function (error) {
      return Promise.reject(error);
    }
  );
  return instance;
}

function createInstance() {
  const instance = axios.create({
    baseURL: `${process.env.REACT_APP_SERVER_URL}`,
  });

  return setInterceptor(instance);
}

export const instance = createInstance();
