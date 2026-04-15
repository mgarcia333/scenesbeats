import { useEffect, useCallback } from 'react';
import { socket } from '../App';

export const useSocket = (eventHandlers, dependencies = []) => {
  useEffect(() => {
    const subscriptions = [];

    Object.entries(eventHandlers).forEach(([event, handler]) => {
      socket.on(event, handler);
      subscriptions.push({ event, handler });
    });

    return () => {
      subscriptions.forEach(({ event, handler }) => {
        socket.off(event, handler);
      });
    };
  }, dependencies);
};

export const emitEvent = (event, data) => {
  socket.emit(event, data);
};

export const joinRoom = (room) => socket.emit('join_room', room);
export const leaveRoom = (room) => socket.emit('leave_room', room);

export default socket;