import axios from 'axios';
import type {
  AxiosInstance,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import {
  ApiResponse,
  TokenResponse,
  API_BASE_URL,
} from '../types/interfaces/api';
import navigationService from '../utils/MyNavigation';
import { AuthUtils } from '../utils/authUtils';

// Axios 인스턴스 생성
const apiController: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// 요청 인터셉터 추가하기
apiController.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const accessToken: string | null = AuthUtils.getAccessToken();

    // 토큰이 존재할 경우 헤더에 추가
    if (accessToken !== null && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  async (error: AxiosError): Promise<never> => {
    // 요청 오류가 발생했을 때 작업 수행
    // console.error('Request error:', error);
    return Promise.reject(error);
  },
);

// 응답 인터셉터 추가하기
apiController.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => {
    // 2xx 성공
    return response;
  },
  async (error: AxiosError): Promise<AxiosResponse | never> => {
    // 에러 응답이 존재하는지 확인
    if (!error.response) {
      return Promise.reject(error);
    }

    const { config, status } = error.response;
    // console.log('Error response:', error.response);

    if (status === 401) {
      // 401 토큰 만료

      const refreshToken: string | null = AuthUtils.getRefreshToken();

      if (!refreshToken) {
        // 리프레시 토큰이 없으면 로그인 페이지로 이동
        AuthUtils.clearAuth();
        navigationService.goToLogin();
        return Promise.reject(error.response);
      }

      try {
        const response: AxiosResponse<ApiResponse<TokenResponse>> =
          await apiController.post('/auth/google/reissue', {
            refreshToken: refreshToken,
          });

        const { result } = response.data;

        AuthUtils.setTokens(result);

        // 원래 요청 재시도
        if (config) {
          return await apiController(config);
        }
      } catch (reissueError) {
        // 토큰 재발급 실패 시 로그인 페이지로 이동
        AuthUtils.clearAuth();
        navigationService.goToLogin();
        return Promise.reject(reissueError);
      }
    } else if (status === 403) {
      // 토큰 없이 main 진입
      navigationService.goToLogin();
      return Promise.reject(error.response);
    }

    return Promise.reject(error.response);
  },
);

export default apiController;
