// src/hooks/useVideoTracks.ts

import { useMemo } from 'react';
import { LocalVideoTrack } from 'livekit-client';
import type { TrackInfo, VideoTrackInfo } from '../types/interfaces/rooms';

interface UseVideoTracksProps {
  currentPresenter: string | null;
  myKey: string;
  localTrack: LocalVideoTrack | null;
  remoteTracks: TrackInfo[];
}

export const useVideoTracks = ({
  currentPresenter,
  myKey,
  localTrack,
  remoteTracks,
}: UseVideoTracksProps) => {
  const isMyTurn = useMemo(
    () => myKey === currentPresenter,
    [myKey, currentPresenter],
  );

  const presenterVideoTrack = useMemo(() => {
    if (isMyTurn) {
      return { type: 'local' as const, track: localTrack };
    }

    const presenterTrack = remoteTracks.find(
      (t) =>
        t.participantIdentity === currentPresenter &&
        t.trackPublication.kind === 'video',
    );

    return presenterTrack
      ? {
          type: 'remote' as const,
          track: presenterTrack.trackPublication.videoTrack || null,
        }
      : null;
  }, [isMyTurn, currentPresenter, localTrack, remoteTracks]);

  const otherVideoTracks = useMemo(() => {
    const tracks: VideoTrackInfo[] = [];

    if (!isMyTurn && localTrack) {
      tracks.push({
        type: 'local',
        track: localTrack,
        participantIdentity: myKey,
        trackSid: 'local',
      });
    }

    const remoteVideoTracks = remoteTracks.filter(
      (t) =>
        t.trackPublication.kind === 'video' &&
        t.participantIdentity !== currentPresenter,
    );

    remoteVideoTracks.forEach((t) => {
      tracks.push({
        type: 'remote',
        track: t.trackPublication.videoTrack || null,
        participantIdentity: t.participantIdentity,
        trackSid: t.trackPublication.trackSid,
      });
    });

    return tracks;
  }, [isMyTurn, currentPresenter, localTrack, remoteTracks, myKey]);

  return {
    isMyTurn,
    presenterVideoTrack,
    otherVideoTracks,
  };
};
