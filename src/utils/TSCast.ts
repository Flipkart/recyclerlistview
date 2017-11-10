export default class TSCast {
    public static cast<T>(object: any): T {
        return object as T;
    }
}
