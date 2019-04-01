import axios, {AxiosPromise} from 'axios';
import {IApiDriverResponse} from "@/asdf/api/IApiDriverResponse";
import {IApiDriver} from "@/asdf/api/IApiDriver";

export class ApiResponse implements IApiDriverResponse {
    private readonly Success: boolean;
    private readonly Data: Dictionary<any>;
    public Error: { [key: string]: any, Code: string, Text: string } = {Code: '', Text: ''};
    public FieldErrors: Dictionary<any> = {};

    constructor(response: { [key: string]: any }) {
        this.Success = response.data.success || false;
        this.Data = {};
        if (typeof response.data.data !== "undefined") this.Data = response.data.data;
        if (typeof response.data.error !== "undefined") {
            Object.keys(response.data.error).forEach(key => this.Error[key.snakeCaseToCamelCase()] = response.data.error[key]);
        }
        if (typeof response.data['field-errors'] !== "undefined") {
            Object.keys(response.data['field-errors']).forEach(key => this.FieldErrors[key.snakeCaseToCamelCase()] = response.data['field-errors'][key]);
        }
    }

    /**
     * Returns true if the server indicated that the requests has been successful, false otherwise
     * @constructor
     */
    public IsSuccessful() {return this.Success}

    /**
     * Determines if the server returned data with the specified name
     * @param d
     * @constructor
     */
    public HasData(d: string): boolean {return typeof this.Data[d] !== "undefined";}

    /**
     * Gets the value sent by the server with the specified name
     * @param d
     * @constructor
     */
    public GetData(d: string): any | undefined {return this.Data[d] || undefined}

    GetFieldErrors(): Dictionary<any> {
        return this.FieldErrors
    }


}

export default class Api implements IApiDriver {
    private _token: string | undefined = undefined
    private _base_endpoint: string = '';
    private _version: string = '';

    constructor(endpoint: string, version: string) {
        this.SetBaseEndpoint(endpoint)
            .SetVersion(version);
    }

    SetToken(token: string): this {
        this._token = token;
        return this;
    }

    SetBaseEndpoint(endpoint: string): this {
        this._base_endpoint = endpoint;
        return this;
    }

    SetVersion(version: string): this {
        this._version = version;
        return this;
    }

    private get EndpointRoot(): string {return [this._base_endpoint, this._version].join('/');}

    private GetEndpointUrl(endpoint: string) {return [this.EndpointRoot, endpoint].join('/');}

    /**
     * The handler to be called when the server returns an error
     */
    private _onErrorHandler?: (r: ApiResponse) => void;

    private HasErrorHandler(): boolean {return typeof this._onErrorHandler !== "undefined"}

    private CallErrorHandler(r: ApiResponse): void {
        // @ts-ignore
        if (this.HasErrorHandler()) this._onErrorHandler(r)
    }

    private _onUploadHandler?: (event: ProgressEvent) => void;

    private HasUploadHandler(): boolean {return typeof this._onUploadHandler !== "undefined"}

    public GetUploadHandler(): ((e: ProgressEvent) => void) | undefined {
        return this._onUploadHandler;
    }

    public SetUploadHandler(h: (e: ProgressEvent) => void): this {
        this._onUploadHandler = h;
        return this;
    }

    public RemoveUploadHandler(): this {
        this._onUploadHandler = undefined;
        return this;
    }

    /**
     * Gets the headers for the request
     * @constructor
     */
    private GetHeaders(): Dictionary<string> {
        let headers: Dictionary<any> = {};
        if (this._token !== undefined) headers.Token = this._token;
        return headers;
    }

    /**
     * Handles errors and transforms the axios response into an ApiResponse
     * @param p
     * @constructor
     */
    private HandlePromise(p: AxiosPromise<ApiResponse>): Promise<IApiDriverResponse> {
        return p
            .then((r: Dictionary<any>) => {
                const response = new ApiResponse(r);
                if (!response.IsSuccessful() && this.HasErrorHandler()) this.CallErrorHandler(response);
                return response;
            })
            .catch(() => {
                let response = new ApiResponse({data: {success: false, error: {code: 'E-SERVER-ERROR', text: 'Server error'}}});
                if (this.HasErrorHandler()) this.CallErrorHandler(response);
                return response;
            });
    }

    /**
     * Executes a GET request
     * @param endpoint
     * @param data
     * @constructor
     */
    public Get(endpoint: string, data?: Dictionary<any>): Promise<IApiDriverResponse> {
        return this.HandlePromise(axios.get(this.GetEndpointUrl(endpoint), {headers: this.GetHeaders(), params: data}));
    }

    /**
     * Executes a POST request
     * @param endpoint
     * @param data
     * @constructor
     */
    public Post(endpoint: string, data?: Dictionary<any>): Promise<IApiDriverResponse> {
        return this.HandlePromise(axios.post(this.GetEndpointUrl(endpoint), data, {headers: this.GetHeaders()}));
    }

    /**
     * Executes a PATCH request
     * @param endpoint
     * @param data
     * @constructor
     */
    public Patch(endpoint: string, data?: Dictionary<any>): Promise<IApiDriverResponse> {
        return this.HandlePromise(axios.patch(this.GetEndpointUrl(endpoint), data, {headers: this.GetHeaders()}))
    }

    /**
     * Executes a DELETE request
     * @param endpoint
     * @param data
     * @constructor
     */
    public Delete(endpoint: string, data?: Dictionary<any>): Promise<IApiDriverResponse> {
        return this.HandlePromise(axios.delete(this.GetEndpointUrl(endpoint), {headers: this.GetHeaders(), data: data}));
    }

    /**
     * Executes a DELETE request
     * @param endpoint
     * @param file
     * @param data
     * @constructor
     */
    public Upload(endpoint: string, file: File, data?: Dictionary<any>): Promise<IApiDriverResponse> {
        let formData = new FormData();
        formData.append('file', file);
        if (data) Object.keys(data).forEach(k => formData.append(k, data[k]));

        return this.HandlePromise(axios.post(this.GetEndpointUrl(endpoint), formData, {onUploadProgress: this.GetUploadHandler(), headers: this.GetHeaders()}));
    }


}