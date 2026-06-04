import 'server-only';

type Client = {
  id: string;
  enqueue: (data: string) => void;
};

const globalForSSE = global as unknown as {
  sseClients: Client[];
};

if (!globalForSSE.sseClients) {
  globalForSSE.sseClients = [];
}

export const sseClients = globalForSSE.sseClients;

export function addSseClient(client: Client) {
  sseClients.push(client);
}

export function removeSseClient(id: string) {
  const index = sseClients.findIndex(c => c.id === id);
  if (index !== -1) {
    sseClients.splice(index, 1);
  }
}

export function broadcastSse(event: string, data: any) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach(c => {
    try {
      c.enqueue(payload);
    } catch {
      // Client probably disconnected, will be cleaned up on close/abort
    }
  });
}
