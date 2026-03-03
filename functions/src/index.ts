import { initializeApp } from 'firebase-admin/app';
import { onCall } from 'firebase-functions/v2/https';

initializeApp();

const region = 'us-central1';

export const appStatus = onCall({ region }, async () => {
  return {
    billingMode: 'pix-manual',
    message: 'Integração Stripe desativada temporariamente.',
  };
});
