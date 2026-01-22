// src/hooks/usePresentationOrder.ts

import { useEffect, useState } from 'react';
import { useRoomStore } from '../stores/useRoomStore';
import apiController from '../api/apiController';

export const usePresentationOrder = (roomId: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // store에서 필터링된 순서 가져오기
  const { presentationOrder: order, setFullPresentationOrder } = useRoomStore();

  useEffect(() => {
    if (!roomId) return;

    const fetchOrder = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiController({
          method: 'GET' as const,
          url: `/reservations/order/${roomId}`,
        });

        console.log('발표 순서:', response.data);

        // 서버에서 받은 전체 순서를 store에 저장
        const orderData = response.data.result.order.map(String);
        setFullPresentationOrder(orderData);
      } catch (error) {
        console.error('발표 순서 가져오기 실패:', error);
        setError('발표 순서를 가져오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [roomId, setFullPresentationOrder]);

  // 필터링된 순서를 반환
  return { order, loading, error };
};
