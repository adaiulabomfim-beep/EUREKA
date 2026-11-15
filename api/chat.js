import { handleChatRequest } from '../server.js';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

export default async function handler(req, res) {
  return handleChatRequest(req, res, { allowAnyPath: true });
}
