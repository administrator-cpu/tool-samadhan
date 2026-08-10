import { v2 as translate } from '@google-cloud/translate';
import pLimit from 'p-limit';
import { env } from '../../config/environment.js';
import { logger } from '../../lib/logger.js';

// Limit concurrent requests to 20 to prevent 429 Too Many Requests
const limit = pLimit(20);

export interface ITranslationProvider {
  translate(text: string, targetLanguage: string): Promise<string>;
}

export class GoogleTranslationProvider implements ITranslationProvider {
  private client: translate.Translate;

  constructor() {
    const options: any = {
      projectId: env.googleProjectId,
    };

    // Always use the provided credentials string as an API key
    if (env.googleTranslateApiKey) {
      options.key = env.googleTranslateApiKey;
    }

    this.client = new translate.Translate(options);
  }

  async translate(text: string, targetLanguage: string): Promise<string> {
    try {
      const [translation] = await this.client.translate(text, targetLanguage);
      return translation;
    } catch (error) {
      logger.error('Google Translation API failed', error);
      throw error;
    }
  }
}

export class TranslationFactory {
  private static provider: ITranslationProvider | null = null;

  static getProvider(): ITranslationProvider {
    if (!this.provider) {
      // In the future, you can read from env to switch providers dynamically
      // const providerStr = process.env.TRANSLATION_PROVIDER;
      // if (providerStr === 'AWS') return new AWSTranslationProvider();
      
      this.provider = new GoogleTranslationProvider();
    }
    return this.provider;
  }

  /**
   * Safe wrapper that handles rate limiting for concurrent requests.
   */
  static async translateSafely(text: string, targetLanguage: string): Promise<string> {
    if (!text || text.trim() === '') return text;
    
    return limit(async () => {
      const provider = this.getProvider();
      return provider.translate(text, targetLanguage);
    });
  }
}
