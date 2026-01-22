// src/api/room.ts

import apiController from './apiController';

interface CreateRoomPayload {
  name: string;
  date: string;
}

export const createRoom = async (payload: CreateRoomPayload) => {
  const config = {
    method: 'POST' as const,
    url: '/api/v1/rooms',
    data: payload,
  };

  return await apiController(config);
};
