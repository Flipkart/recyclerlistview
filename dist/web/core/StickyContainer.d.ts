/**
 * Created by ananya.chandra on 14/09/18.
 */
import * as React from "react";
import { StyleProp, ViewStyle } from "react-native";
import { RecyclerListViewProps } from "./RecyclerListView";
export interface StickyContainerProps {
    children: RecyclerChild;
    stickyHeaderIndices?: number[];
    stickyFooterIndices?: number[];
    overrideRowRenderer?: (type: string | number | undefined, data: any, index: number, extendedState?: object) => JSX.Element | JSX.Element[] | null;
    style?: StyleProp<ViewStyle>;
}
export interface RecyclerChild extends React.ReactElement<RecyclerListViewProps> {
    ref: (recyclerRef: any) => {};
    props: RecyclerListViewProps;
}
export default class StickyContainer<P extends StickyContainerProps> extends React.Component<P> {
    static propTypes: {};
    private _recyclerRef;
    private _dataProvider;
    private _layoutProvider;
    private _extendedState;
    private _rowRenderer;
    private _distanceFromWindow;
    private _stickyHeaderRef;
    private _stickyFooterRef;
    private _visibleIndicesAll;
    constructor(props: P, context?: any);
    componentWillReceiveProps(newProps: P): void;
    render(): JSX.Element;
    private _getRecyclerRef;
    private _getStickyHeaderRef;
    private _getStickyFooterRef;
    private _onVisibleIndicesChanged;
    private _callStickyObjectsOnVisibleIndicesChanged;
    private _onScroll;
    private _assertChildType;
    private _isChildRecyclerInstance;
    private _getLayoutForIndex;
    private _getDataForIndex;
    private _getLayoutTypeForIndex;
    private _getExtendedState;
    private _getRowRenderer;
    private _getRLVRenderedSize;
    private _getContentDimension;
    private _getDistanceFromWindow;
    private _initParams;
}
