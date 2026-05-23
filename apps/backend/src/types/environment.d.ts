declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV?: 'development' | 'production' | 'test';
      PORT?: string;
      
      POSTGRES_USER?: string;
      POSTGRES_PASSWORD?: string;
      POSTGRES_HOST?: string;
      POSTGRES_DB?: string;
      POSTGRES_PORT?: string;
      PG_POOL_MAX?: string;

      REDIS_HOST?: string;
      REDIS_PORT?: string;
      REDIS_PASSWORD?: string;

      JWT_SECRET?: string;
      JWT_REFRESH_SECRET?: string;
      JWT_EXPIRES_IN?: string;
      JWT_REFRESH_EXPIRES_IN?: string;

      CORS_ORIGIN?: string;
      FRONTEND_URL?: string;

      EMAILJS_SERVICE_ID?: string;
      EMAILJS_TEMPLATE_ID?: string;
      EMAILJS_PUBLIC_KEY?: string;
      EMAILJS_PRIVATE_KEY?: string;

      HELPDESK_EMAIL?: string;
    }
  }
}

export {};
