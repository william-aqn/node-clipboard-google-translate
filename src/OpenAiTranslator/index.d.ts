import { langCode, langCodeWithAuto } from '@translate-tools/core/types/Translator';
import { BaseTranslator, TranslatorOptions } from '@translate-tools/core/util/BaseTranslator';
export type OpenAiTranslatorOptions = {
  apiKey: string;
  prompt: string;
};
export declare class OpenAiTranslator extends BaseTranslator<OpenAiTranslatorOptions> {
  static readonly translatorName = "OpenAiTranslator";
  static isRequiredKey: () => boolean;
  static isSupportedAutoFrom: () => boolean;
  static getSupportedLanguages(): langCode[];
  private readonly apiEndpoint;
  constructor(options: TranslatorOptions<OpenAiTranslatorOptions>);
  getLengthLimit(): number;
  getRequestsTimeout(): number;
  checkLimitExceeding(text: string | string[]): number;
  translate(text: string, from: langCodeWithAuto, to: langCode): Promise<any>;
  translateBatch(text: string[], from: langCodeWithAuto, to: langCode): Promise<any[]>;
}