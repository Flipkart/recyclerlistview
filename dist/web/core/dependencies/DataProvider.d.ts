/***
 * You can create a new instance or inherit and override default methods
 * Allows access to data and size. Clone with rows creates a new data provider and let listview know where to calculate row layout from.
 */
export default class DataProvider {
    rowHasChanged: (r1: any, r2: any) => boolean;
    getStableId: (index: number) => string;
    private _firstIndexToProcess;
    private _size;
    private _data;
    private _hasStableIds;
    private _requiresDataChangeHandling;
    constructor(rowHasChanged: (r1: any, r2: any) => boolean, getStableId?: (index: number) => string);
    getDataForIndex(index: number): any;
    getAllData(): any[];
    getSize(): number;
    hasStableIds(): boolean;
    requiresDataChangeHandling(): boolean;
    getFirstIndexToProcessInternal(): number;
    cloneWithRows(newData: any[], firstModifiedIndex?: number): DataProvider;
}
