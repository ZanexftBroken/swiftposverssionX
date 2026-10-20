
// Offline queue: stores pending Firestore writes when offline
// Replays them when connection is restored

const QUEUE_KEY = "swiftpos_offline_queue";

export interface QueuedOperation {
  id: string;
  type: "addDoc" | "setDoc" | "updateDoc";
  collection: string;
  docId?: string;
  data: Record<string, any>;
  timestamp: number;
}

export function enqueueOperation(op: Omit<QueuedOperation, "id" | "timestamp">) {
  const queue = getQueue();
  const entry: QueuedOperation = {
    ...op,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };
  queue.push(entry);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  return entry.id;
}

export function getQueue(): QueuedOperation[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function clearQueue() {
  localStorage.removeItem(QUEUE_KEY);
}

export function removeFromQueue(id: string) {
  const queue = getQueue().filter((op) => op.id !== id);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function getQueueLength(): number {
  return getQueue().length;
}
