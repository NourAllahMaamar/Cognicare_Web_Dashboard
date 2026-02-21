// API Configuration
// Use relative path in dev so Vite proxy handles it (avoids CORS); full URL for production build
const isDev = import.meta.env.DEV;
export const API_BASE_URL = isDev ? '/api/v1' : 'https://cognicare-mobile-h4ct.onrender.com/api/v1';
// export const API_BASE_URL = 'http://localhost:3000/api/v1';  // local backend

