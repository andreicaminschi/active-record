import Model from "@/asdf/Model";
import {IApiDriver} from "@/asdf/api/IApiDriver";
import Factory from "@/asdf/Factory";
import {IApiDriverResponse} from "@/asdf/api/IApiDriverResponse";

export default abstract class Repository<T extends Model> {
    public $is_repository = true;

    //region Abstract methods
    public abstract GetApiDriver(): IApiDriver;

    public abstract GetApiEndpoint(): string;

    public abstract GetFactory(): Factory<T>;

    public abstract GetResponseFieldName(): string;

    //endregion

    private Filters: Dictionary<any> = {};

    //region Filter methods
    public WhereEquals(field: string, value: any) {
        if (value) this.Filters[field] = value;
        return this;
    }

    public WhereNotEquals(field: string, value: any) {
        if (value) this.Filters[`${field}-NOTEQ`] = value;
        return this;
    }

    public WhereGreaterThan(field: string, value: any) {
        if (value) this.Filters[`${field}-GT`] = value;
        return this;
    }

    public WhereGreaterThanOrEquals(field: string, value: any) {
        if (value) this.Filters[`${field}-GTE`] = value;
        return this;
    }

    public WhereLessThan(field: string, value: any) {
        if (value) this.Filters[`${field}-LTE`] = value;
        return this;
    }

    public WhereLessThanOrEquals(field: string, value: any) {
        if (value) this.Filters[`${field}-LTE`] = value;
        return this;
    }

    public WhereIsNull(field: string) {
        this.Filters[`${field}-ISNULL`] = 'null';
        return this;
    }

    public WhereIsNotNull(field: string) {
        this.Filters[`${field}-ISNOTNULL`] = 'null';
        return this;
    }

    public WhereBetween(field: string, value: any[]) {
        this.Filters[`${field}-BETWEEN`] = value.join(',');
        return this;
    }

    public WhereNotBetween(field: string, value: any[]) {
        this.Filters[`${field}-NOTBETWEEN`] = value.join(',');
        return this;
    }

    public WhereIn(field: string, value: any[]) {
        this.Filters[`${field}-IN`] = value.join(',');
        return this;
    }

    public WhereNotIn(field: string, value: any[]) {
        this.Filters[`${field}-NOTIN`] = value.join(',');
        return this;
    }

    public WhereStartsWith(field: string, value: string) {
        this.Filters[`${field}-STARTSWITH`] = value;
        return this;
    }

    public WhereEndsWith(field: string, value: string) {
        this.Filters[`${field}-ENDSWITH`] = value;
        return this;
    }

    public WhereContains(field: string, value: string) {
        this.Filters[`${field}-CONTAINS`] = value;
        return this;
    }

    //endregion
    public GetFilters() {return this.Filters;}

    public ResetFilters() {this.Filters = {}}

    constructor(count: number = 0) {
        if (count > 0) {
            this.SetItemsCount(count)
        }
    }

    public SetItemsCount(count: number) {
        let factory = this.GetFactory();
        for (let i = 0; i < count; i++) this.Items.push(factory.Make())
    }

    public Items: T[] = [];

    public AddItem(item: T) {
        this.Items.push(item);
        return this;
    }

    public AddItemFromData(data: Dictionary<any>) {
        this.Items.push(this.GetFactory().FromData(data));
        return this;
    }

    public ResetItems() {
        this.Items = [];
    }

    public Loading: boolean = false;

    public Get(): Promise<T[]> {
        let filters = this.GetFilters();
        this.ResetFilters();
        this.Loading = true;
        return this.GetApiDriver().Get(this.GetApiEndpoint(), filters)
            .then((r: IApiDriverResponse) => {
                let result: T[] = [];
                this.Items = [];
                this.Loading = false;
                if (!r.IsSuccessful() || !r.HasData(this.GetResponseFieldName())) return result;
                let value,
                    data: Dictionary<any> = r.GetData(this.GetResponseFieldName());

                Object.keys(data).forEach((key) => {
                    value = data[key];

                    // result.push(this.GetFactory().FromData(value));
                    // this.Items.push(this.GetFactory().FromData(value));

                    let record = this.GetFactory().FromData(value);
                    result.push(record);
                    this.Items.push(record);
                });

                return result;
            })
    }

}