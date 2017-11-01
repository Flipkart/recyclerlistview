import { Exception } from "./CustomError";

const RecyclerListViewExceptions: {[key: string]: Exception} = {
    layoutException: {
        type: "LayoutException",
        message: "RecyclerListView needs to have a bounded size. Currently height or, width is 0"
    },
    itemBoundsException: {
        type: "ItemBoundsException",
        message: "Dimensions cannot be undefined or null, check if LayoutProvider returns irregular values"
    },
    itemTypeNullException: {
        type: "ItemTypeNullException",
        message: "RecyclerListView items always require a type, check if LayoutProvider returns irregular values"
    },
    unresolvedDependenciesException: {
        type: "UnresolvedDependenciesException",
        message: "missing datasource or layout provider, cannot proceed without it"
    },
    platformNotDetectedException: {
        type: "PlatformNotDetectedException",
        message: "Unable to detect the running platform, if you're trying to run recyclerlistview " +
        "in browser make sure process.env.RLV_ENV is set to browser in webpack config"
    }
}
export default RecyclerListViewExceptions;