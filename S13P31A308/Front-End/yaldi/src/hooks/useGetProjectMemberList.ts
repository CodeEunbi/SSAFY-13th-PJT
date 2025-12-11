// 프로젝트에 참여중인 팀원 목록을 반환하는 훅.
// /api/v1/projects/{projectKey}/members 로 get 요청.

import React from "react";
import type { getProjectMemberListResponseItem } from "../types/project";
import { apiController } from "../apis/apiController";

export const useGetProjectMemberList = (projectKey: number) => {
  const [data, setData] = React.useState<getProjectMemberListResponseItem[] | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadResults = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await apiController({
          url: `/api/v1/projects/${encodeURIComponent(projectKey)}/members`,
          method: 'get',
        });
        console.log("프로젝트 멤버 데이터 불러오기 완료", response);
        setData(response.data.result);
      } catch (err) {
        console.log("Err:", err);
        setError("프로젝트 멤버 목록을 불러오는 데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    if (projectKey) {
      loadResults();
    } else {
      setData(null);
    }
  }, [projectKey]);

  return {
    isLoading,
    data,
    error
  } as const;
};
