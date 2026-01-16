import axios from "axios";
import Swal from "sweetalert2";
import theme from "../../theme";

const instance = axios.create({
  baseURL: process.env.REACT_APP_SERVER_URL,
});

instance.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);

instance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response && error.response.status === 429) {
      Swal.fire({
        icon: "warning",
        title: "요청이 너무 많습니다",
        text: error.response.data || "잠시 후 다시 시도해주세요.",
        confirmButtonColor: theme.color.primary,
        confirmButtonText: "확인",
      });
    }
    return Promise.reject(error);
  }
);

export { instance };
