import Model from "@/asdf/Model";
import IFactory from "@/asdf/IFactory";

export default abstract class Factory<T extends Model> implements IFactory<T>{
    public abstract Make(): T;

    public abstract FromData(data: Dictionary<any>): T;
}