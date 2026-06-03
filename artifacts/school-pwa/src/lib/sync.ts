export const syncChannel = new BroadcastChannel('schoolpro_sync');

export function broadcastSync(type: string, payload: any) {
  syncChannel.postMessage({ type, payload, timestamp: Date.now() });
}

export function useSyncChannel(onMessage: (msg: any) => void) {
  // Use in components or contexts to listen to updates
  if (typeof window !== 'undefined') {
    syncChannel.onmessage = (event) => {
      onMessage(event.data);
    };
  }
}
