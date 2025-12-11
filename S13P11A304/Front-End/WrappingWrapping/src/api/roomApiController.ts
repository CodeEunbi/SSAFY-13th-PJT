import axios from 'axios';

import type {
  AxiosInstance,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';

export const roomApiController: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_APP_SERVER_URL || 'https://pitch-it.co.kr',
});

// 요청 인터셉터
roomApiController.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    return config;
  },
  async (error: AxiosError): Promise<never> => {
    return Promise.reject(error);
  },
);

// 응답 인터셉터
roomApiController.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => {
    return response;
  },
  async (error: AxiosError): Promise<AxiosResponse | never> => {
    if (!error.response) {
      return Promise.reject(error);
    }

    return Promise.reject(error);
  },
);

export default roomApiController;
