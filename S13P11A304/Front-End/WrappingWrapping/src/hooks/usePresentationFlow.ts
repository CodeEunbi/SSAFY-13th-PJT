// src/hooks/usePresentationFlow.ts
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useRoomStore } from '../stores/useRoomStore';

// TODO: 시간 수정 필요 10분: 60 * 10 * 1000
const REQUIREMENT_DISPLAY_TIME = 60 * 10 * 1000; // 10분
const PRESENTATION_TIME = 30 * 10 * 1000; // 5분
const PRESENTER_PREPARATION_TIME = 5 * 1000; // 5초 준비 시간

export const usePresentationFlow = () => {
  const [showRequirements, setShowRequirements] = useState(true);
  const [currentPresenterIndex, setCurrentPresenterIndex] = useState(0);
  const [presentationStartTime, setPresentationStartTime] = useState<
    number | null
  >(null);
  const [isPreparationPhase, setIsPreparationPhase] = useState(false);
  const [preparationEndTime, setPreparationEndTime] = useState<string | null>(
    null,
  );

  // 마지막 발표자의 발표 완료 상태 추가
  const [allPresentationsComplete, setAllPresentationsComplete] =
    useState(false);

  const startTimeRef = useRef<number>(Date.now());
  const presentationTimerRef = useRef<number | null>(null);

  // store에서 필터링된 발표 순서 가져오기
  const { presentationOrder: order } = useRoomStore();

  const currentPresenter = useMemo(() => {
    if (order.length === 0 || allPresentationsComplete) return null;
    return order[currentPresenterIndex];
  }, [order, currentPresenterIndex, allPresentationsComplete]);

  const requirementEndTime = useMemo(
    () =>
      new Date(startTimeRef.current + REQUIREMENT_DISPLAY_TIME).toISOString(),
    [],
  );

  const presentationEndTime = useMemo(() => {
    if (!presentationStartTime) return null;
    return new Date(presentationStartTime + PRESENTATION_TIME).toISOString();
  }, [presentationStartTime]);

  const isLastPresenter = useMemo(
    () => currentPresenterIndex >= order.length - 1,
    [currentPresenterIndex, order.length],
  );

  const skipToVideo = useCallback(() => {
    setShowRequirements(false);
    setIsPreparationPhase(true);
    const endTime = Date.now() + PRESENTER_PREPARATION_TIME;
    setPreparationEndTime(new Date(endTime).toISOString());
  }, []);

  const handleRequirementExpire = useCallback(() => {
    setShowRequirements(false);
    setIsPreparationPhase(true);
    const endTime = Date.now() + PRESENTER_PREPARATION_TIME;
    setPreparationEndTime(new Date(endTime).toISOString());
  }, []);

  const handlePreparationComplete = useCallback(() => {
    setIsPreparationPhase(false);
    setPreparationEndTime(null);
    const startTime = Date.now();
    setPresentationStartTime(startTime);

    // 발표 시간 종료 타이머 설정
    if (presentationTimerRef.current) {
      clearTimeout(presentationTimerRef.current);
    }

    presentationTimerRef.current = window.setTimeout(() => {
      presentationTimerRef.current = null;
      handlePresentationExpire();
    }, PRESENTATION_TIME);
  }, []);

  const handlePresentationExpire = useCallback(() => {
    if (presentationTimerRef.current) {
      clearTimeout(presentationTimerRef.current);
      presentationTimerRef.current = null;
    }

    setPresentationStartTime(null);

    if (isLastPresenter) {
      // 마지막 발표자면 모든 발표 완료 → 질의응답 단계로 전환
      setAllPresentationsComplete(true);
      console.log('🎉 모든 발표가 완료되었습니다. 질의응답 단계로 전환합니다.');
    } else {
      // 다음 발표자로 이동
      setCurrentPresenterIndex((prev) => prev + 1);
      setIsPreparationPhase(true);
      const endTime = Date.now() + PRESENTER_PREPARATION_TIME;
      setPreparationEndTime(new Date(endTime).toISOString());
    }
  }, [isLastPresenter]);

  const nextPresenter = useCallback(() => {
    if (presentationTimerRef.current) {
      clearTimeout(presentationTimerRef.current);
      presentationTimerRef.current = null;
    }

    setPresentationStartTime(null);

    if (!isLastPresenter) {
      setCurrentPresenterIndex((prev) => prev + 1);
      setIsPreparationPhase(true);
      const endTime = Date.now() + PRESENTER_PREPARATION_TIME;
      setPreparationEndTime(new Date(endTime).toISOString());
    }
  }, [isLastPresenter]);

  // 발표 순서가 변경될 때 인덱스 초기화
  useEffect(() => {
    if (order.length > 0 && currentPresenterIndex >= order.length) {
      setCurrentPresenterIndex(0);
      console.log('📋 발표 순서 변경으로 인덱스 초기화');
    }
  }, [order.length, currentPresenterIndex]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (presentationTimerRef.current) {
        clearTimeout(presentationTimerRef.current);
      }
    };
  }, []);

  return {
    showRequirements,
    currentPresenterIndex,
    currentPresenter,
    requirementEndTime,
    presentationEndTime,
    isLastPresenter,
    isPreparationPhase,
    preparationEndTime,
    allPresentationsComplete,
    skipToVideo,
    handleRequirementExpire,
    handlePreparationComplete,
    handlePresentationExpire,
    nextPresenter,
  };
};
