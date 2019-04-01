interface String {
    /**
     * Converst snake_case to CamelCase
     */
    snakeCaseToCamelCase(): string;

    /**
     * Converts CamelCase to snake_case
     */
    camelCaseToSnakeCase(): string;

    /**
     * Determines if the string starts with the passed value
     * @param s
     */
    startsWith(s: string): boolean;
}

String.prototype.snakeCaseToCamelCase = function (this: string): string {
    let str = this.replace(/_\w/g, m => m[1].toUpperCase());
    str = str[0].toUpperCase() + str.slice(1);
    return str;
};

String.prototype.camelCaseToSnakeCase = function (this: string): string {
    return this.replace(/\.?([A-Z]+)/g, function (x, y) {
        return "_" + y.toLowerCase()
    }).replace(/^_/, "")
};

String.prototype.startsWith = function (this: string, s: string) {
    return this.indexOf(s) === 0;
};