export const Messages: {[key: string]: string} = {
    ERROR_LISTVIEW_VALIDATION : "missing datasource or layout provider, cannot proceed without it",
    WARN_SCROLL_TO_INDEX: "scrollTo was called before RecyclerListView was measured, please wait for the mount to finish",
    WARN_NO_DATA: "You have mounted RecyclerListView with an empty data provider (Size in 0). Please mount only if there is atleast one item " +
                  "to ensure optimal performance and to avoid unexpected behavior",
};
