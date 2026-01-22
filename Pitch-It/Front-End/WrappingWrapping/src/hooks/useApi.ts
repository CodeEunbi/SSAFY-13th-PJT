// hooks/useApi.ts

import { useEffect, useState } from 'react';
import apiController from '../api/apiController';
import type { AxiosRequestConfig } from 'axios';
import type { ApiResponse, UseApiReturn } from '../types/interfaces/api';

export const useApi = <T = any>(
  config: AxiosRequestConfig,
): UseApiReturn<T> => {
  const [data, setData] = useState<T | null>(null); // 실제 데이터
  const [response, setResponse] = useState<ApiResponse<T> | null>(null); // 전체 응답
  const [loading, setLoading] = useState(true); // 로딩 여부
  const [error, setError] = useState<string | null>(null); // 에러 여부

  const execute = async () => {
    try {
      setLoading(true); // 로딩 시작
      setError(null); // 이전 에러 제거

      // API 호출
      const axiosResponse = await apiController(config);
      const apiResponse: ApiResponse<T> = axiosResponse.data;

      setResponse(apiResponse); // 전체 응답 저장

      if (apiResponse.isSuccess) {
        setData(apiResponse.result); // 성공 시 데이터 저장
      } else {
        setError(apiResponse.message); // 에러 시 메시지 저장
      }
    } catch (error: any) {
      setError('네트워크 오류'); // 네트워크 에러
      // console.error('API 에러:', error);
    } finally {
      setLoading(false); // 로딩 완료
    }
  };

  useEffect(() => {
    execute();
  }, []);

  return {
    data, // 실제 데이터
    response, // 전체 응답
    loading, // 로딩 스피너 표시용
    error, // 에러 메시지 표시용
  };
};
