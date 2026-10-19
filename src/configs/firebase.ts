// Public web app configuration supplied by the project owner; no Admin credentials.
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCndIn8rs3vJSjh4JHg8My1DpC7SYlZ0C0',
  authDomain: 'visionaid-firebase-5cccb.firebaseapp.com',
  projectId: 'visionaid-firebase-5cccb',
  messagingSenderId: '459963506411',
  appId: '1:459963506411:web:aae50c821040e5d9b7e8ae',
};
export const vapidKey =
  import.meta.env.VITE_FIREBASE_VAPID_KEY ||
  'BIXQR0X_lnq8yTXs-qiwLKoUc3YTo2bdY8B2QR_njwndBSVg9Y_TeBA2eyNZNGCIYvgBSX2tCZG3UawNk0hFxaA';
