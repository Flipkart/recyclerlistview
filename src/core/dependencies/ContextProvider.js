/***
 * Context provider is useful in cases where your view gets destroyed and you want to maintain scroll position when recyclerlistview is recreated e.g,
 * back navigation in android when previous fragments onDestroyView has already been called. Since recyclerlistview only renders visible items you
 * can instantly jump to any location.
 *
 * Extend this class and implement the given methods to preserve context.
 */
export default class ContextProvider {
    //Should be of string type, anything which is unique in global scope of your application
    getUniqueKey() {

    }

    //Let recycler view save a value, you can use apis like session storage/async storage here
    save(key, value) {

    }

    //Get value for a key
    get(key) {

    }

    //Remove key value pair
    remove(key) {

    }
}