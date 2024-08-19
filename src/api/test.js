import { instance } from "./interseptors/intex";

export const test = async () => {
  try {
    const res = await instance.get(`${process.env.REACT_APP_SERVER_URL}/test`);
    return res;
  } catch (error) {
    console.error("test 에러 ", error.response);
    return error.message;
  }
};
