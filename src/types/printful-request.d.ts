declare module 'printful-request' {
  export class PrintfulClient {
    constructor(apiKey: string);
    get(endpoint: string): Promise<any>;
    post(endpoint: string, data: any): Promise<any>;
    put(endpoint: string, data: any): Promise<any>;
    delete(endpoint: string): Promise<any>;
  }
}
