import Model from "@/asdf/Model";

export default interface IFactory<T extends Model> {
    Make(): T;

    FromData(data: Dictionary<any>): T;
}