interface ObjectConstructor {

    /**
     * Determines if the parameter is an object
     * @param o
     */
    isObject(o: any): boolean;

    /**
     * Determines if the object contains a specific method
     * @param o
     * @param m
     */
    hasMethod(o: any, m: string): boolean;

    /**
     * Determines if the object contains a specific property
     * @param o
     * @param p
     */
    hasProperty(o: any, p: string): boolean;

    /**
     * Determines if the object is a model
     * @param o
     */
    isModel(o: any): boolean;

    /**
     * Determines if the object is a model
     * @param o
     */
    isRepository(o: any): boolean;
}

Object.isObject = function (o: any) { return typeof o === "object";};

Object.hasMethod = function (o: any, m: string) { return Object.isObject(o) && typeof o[m] === "function";};

Object.hasProperty = function (o: any, p: string) { return Object.isObject(o) && typeof o[p] === "undefined";};

Object.isModel = function (o: any) { return Object.isObject(o) && Object.keys(o).indexOf('$is_model') !== -1;};

Object.isRepository = function (o: any) { return Object.isObject(o) && Object.keys(o).indexOf('$is_repository') !== -1;};