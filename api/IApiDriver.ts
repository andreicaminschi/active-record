import {IApiDriverResponse} from "@/asdf/api/IApiDriverResponse";

export interface IApiDriver {
    SetToken(token: string): this;

    SetBaseEndpoint(endpoint: string): this;

    SetVersion(version: string): this;

    /**
     * Executes a GET request
     * @param endpoint
     * @param data
     * @constructor
     */
    Get(endpoint: string, data?: Dictionary<any>): Promise<IApiDriverResponse>;

    /**
     * Executes a POST request
     * @param endpoint
     * @param data
     * @constructor
     */
    Post(endpoint: string, data?: Dictionary<any>): Promise<IApiDriverResponse>;

    /**
     * Executes a PATCH request
     * @param endpoint
     * @param data
     * @constructor
     */
    Patch(endpoint: string, data?: Dictionary<any>): Promise<IApiDriverResponse>;

    /**
     * Executes a DELETE request
     * @param endpoint
     * @param data
     * @constructor
     */
    Delete(endpoint: string, data?: Dictionary<any>): Promise<IApiDriverResponse>;

    /**
     * Executes a DELETE request
     * @param endpoint
     * @param file
     * @param data
     * @constructor
     */
    Upload(endpoint: string, file: File, data?: Dictionary<any>): Promise<IApiDriverResponse>;

    /**
     * Gets the upload handler, if any
     * @constructor
     */
    GetUploadHandler(): ((e: ProgressEvent) => void) | undefined;

    /**
     * Sets the upload handler
     * @param h
     * @constructor
     */
    SetUploadHandler(h: (e: ProgressEvent) => void): this;

    /**
     * Removes the upload handler
     * @constructor
     */
    RemoveUploadHandler(): this;
}