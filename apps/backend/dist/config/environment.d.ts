export declare const env: {
    port: number;
    nodeEnv: string;
    postgres: {
        user: string;
        password: string;
        host: string;
        database: string;
        port: number;
        poolMax: number;
    };
    redis: {
        host: string;
        port: number;
        password: string;
    };
    jwt: {
        secret: string;
        refreshSecret: string;
        expiresIn: string;
        refreshExpiresIn: string;
    };
    cors: {
        origin: string;
    };
    emailjs: {
        serviceId: string;
        templateId: string;
        publicKey: string;
        privateKey: string;
        helpdeskEmail: string;
    };
};
export declare const isProd: boolean;
//# sourceMappingURL=environment.d.ts.map