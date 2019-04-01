import {IApiDriver} from "@/asdf/api/IApiDriver";
import IFactory from "@/asdf/IFactory";
import {IApiDriverResponse} from "@/asdf/api/IApiDriverResponse";
import Repository from "@/asdf/Repository";

export default abstract class Model {
    [key: string]: any;

    public $is_model = true;
    public $Errors: Dictionary<any> = {};

    /**
     * The factories used to create model instances for relations
     */
    public $factories: Dictionary<IFactory<Model>> = {};

    //region Abstract methods
    /**
     * Returns the model name for the current model;
     * The model name is used to automatically load data after the model is saved
     * @constructor
     */
    public abstract GetModelName(): string;

    /**
     * Determines if the model is a new instance.
     * Usually checks if Id > 0
     * @constructor
     */
    public abstract IsNew(): boolean;

    /**
     * Gets the api driver to be used by this model
     * @constructor
     */
    public abstract GetApiDriver(): IApiDriver;

    public abstract GetDateColumns(): string[];

    public abstract GetFileColumns(): string[];

    public abstract GetCreateApiUrl(): string;

    public abstract GetEditApiUrl(): string;

    //endregion

    public constructor(data?: Dictionary<any>) {
    }

    /**
     * Loads the information to the model
     * snake_case keys are transformed to CamelCase ( eg: user_id in data becomes UserId in the model )
     * @param data
     * @constructor
     */
    public Load(data: Dictionary<any>) {
        let property_value: any
            , passed_value: any
            , dates = this.GetDateColumns();

        Object.keys(data).forEach((key: string) => {
            passed_value = data[key];
            key = key.snakeCaseToCamelCase();
            property_value = this.GetPropertyValue(key);

            //todo null values are ignored. maybe that's not a good thing!!
            if (passed_value === null) return;

            if (Object.isRepository(property_value)) {
                this.HandleRepository(key, property_value, passed_value);
                return;
            } else if (Object.isModel(property_value)) {
                this.HandleModel(key, passed_value);
                return;
            }

            if (dates.contains(key)) passed_value = Date.fromUsDateString(passed_value);


            this.SetPropertyValue(key, passed_value);
        })
    }

    private HandleRepository(key: string, property_value: Repository<Model>, passed_value: any) {
        if (!Array.isArray(passed_value)) {
            console.warn('Repository for field', key, ' did not receive an array :', passed_value);

            return;
        }
        property_value.ResetItems();
        passed_value.forEach((k: Dictionary<any>) => property_value.AddItemFromData(k));
    }

    private HandleModel(key: string, passed_value: any) {
        if (!this.HasFactory(key)) {
            console.warn('Model', this.GetModelName(), ' does not have a factory for field', key, ' and the field received an object as a value:', passed_value);

            return;
        }
        this.SetPropertyValue(key, this.InvokeFactory(key, passed_value));
    }

    //region Original Attributes
    /**
     * Original attributes are the initial values of the model.
     * For a new model they're the default values and for a loaded value they're the passed values
     * After the model is saved the original attributes are updated to the new values
     */
    private $originalValues: Dictionary<any> = {};

    /**
     * Loads the original values for the model.
     * Methods and properties that start with an $ are ignored
     * @constructor
     */
    protected LoadOriginalValues() {
        this.$originalValues = {};
        this.GetOwnPropertyNames().forEach((key: string) => this.SetOriginalValue(key, this.GetPropertyValue(key)));
    }

    /**
     * Sets the original value for the specified property
     * @param prop
     * @param value
     * @constructor
     */
    private SetOriginalValue(prop: string, value: any) {
        this.$originalValues[prop] = value;
        return this;
    }

    /**
     * Returns the original value of a property.
     * @param prop
     * @constructor
     */
    private GetOriginalValue(prop: string): any | undefined {return this.$originalValues[prop] || undefined;}

    //endregion

    //region Utility - Attributes
    /**
     * Gets own property names.
     * Methods, properties starting with $(dollar-sign) and other models are not included
     * @constructor
     */
    public GetOwnPropertyNames(): string[] {
        let result: string[] = [];
        let dates = this.GetDateColumns();
        Object.keys(this).forEach((key: string) => {
            if (dates.indexOf(key) === -1 && (key.startsWith('$') || Object.isModel(this[key]))) return;
            result.push(key);
        });
        return result;
    }

    /**
     * Gets the property value
     * @param prop
     * @constructor
     */
    private GetPropertyValue(prop: string): any | undefined { return this[prop] || undefined }

    /**
     * Determines if a property has changed
     * @param prop
     * @constructor
     */
    public HasPropertyChanged(prop: string): boolean {
        return this.GetPropertyValue(prop) !== this.GetOriginalValue(prop)
    }

    /**
     * Sets models property to the specified value.
     * *Note* Also updates the original value for that value
     * @param prop
     * @param value
     * @constructor
     */
    private SetPropertyValue(prop: string, value: any): this {
        this.$Errors[prop] = '';
        this[prop] = value;
        return this;
    }

    /**
     * Get the changed attributes with their changed values
     * @constructor
     */
    public GetChangedAttributes(): Dictionary<any> {
        let result: Dictionary<any> = {},
            dates: string[] = this.GetDateColumns();
        this.GetOwnPropertyNames().forEach((key: string) => {
            if (this.HasPropertyChanged(key)) {
                if (dates.contains(key)) result[key.camelCaseToSnakeCase()] = <Date>(this.GetPropertyValue(key)).toDateString();
                else result[key.camelCaseToSnakeCase()] = this.GetPropertyValue(key);
            }
        });
        return result;
    }

    //endregion

    //region Relation factories
    /**
     * Checks if there are any factories for the field
     * @param field
     * @constructor
     */
    public HasFactory(field: string) {return typeof this.$factories[field] !== "undefined"}

    /**
     * Invokes the related factory for the field and returns the result
     * @param field
     * @param data
     * @constructor
     */
    public InvokeFactory(field: string, data: Dictionary<any>): Model {
        return this.$factories[field].FromData(data);
    }

    //endregion

    //region Api stuff
    public Save(extra?: Dictionary<any>): Promise<IApiDriverResponse> {
        let driver = this.GetApiDriver();

        let url: string = this.IsNew() ? this.GetCreateApiUrl() : this.GetEditApiUrl();
        Object.keys(this).forEach(key => {url = url.replace(`{${key}}`, this[key])});

        const params = {...this.GetChangedAttributes(), ...extra};


        let promise: Promise<IApiDriverResponse> =
            this.IsNew()
                ? driver.Post(url, params)
                : driver.Patch(url, params);

        return promise.then((r: IApiDriverResponse) => {
            if (r.IsSuccessful()) {
                this.Load(r.GetData(this.GetModelName()));
                this.LoadOriginalValues();
            }
            return r;
        })
    }

    public GetInfo() {
        let driver = this.GetApiDriver();

        let url: string = this.GetEditApiUrl();
        Object.keys(this).forEach(key => {url = url.replace(`{${key}}`, this[key])});

        return driver.Get(url).then((r: IApiDriverResponse) => {
            if (r.IsSuccessful()) {
                this.Load(r.GetData(this.GetModelName()));
                this.LoadOriginalValues();
            }
            return r;
        })
    }

    //endregion

    //region Errors
    public SetErrors(errors: Dictionary<any>) {
        this.$Errors = errors;
        return this;
    }

    //endregion
}