export interface IApiDriverResponse {
    /**
     * Returns true if the server indicated that the requests has been successful, false otherwise
     * @constructor
     */
    IsSuccessful(): boolean;

    /**
     * Determines if the server returned data with the specified name
     * @param d
     * @constructor
     */
    HasData(d: string): boolean;

    /**
     * Gets the value sent by the server with the specified name
     * @param d
     * @constructor
     */
    GetData(d: string): any | undefined;

    GetFieldErrors(): Dictionary<any>;
}