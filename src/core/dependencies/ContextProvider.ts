/***
 * Context provider is useful in cases where your view gets destroyed and you want to maintain scroll position when recyclerlistview is recreated e.g,
 * back navigation in android when previous fragments onDestroyView has already been called. Since recyclerlistview only renders visible items you
 * can instantly jump to any location.
 *
 * Use this interface and implement the given methods to preserve context.
 */
export default abstract class ContextProvider {
    //Should be of string type, anything which is unique in global scope of your application
    public abstract getUniqueKey(): string;

    //Let recycler view save a value, you can use apis like session storage/async storage here
    public abstract save(key: string, value: string | number): void;

    //Get value for a key
    public abstract get(key: string): string | number;

    //Remove key value pair
    public abstract remove(key: string): void;
}
