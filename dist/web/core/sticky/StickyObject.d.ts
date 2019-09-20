/**
 * Created by ananya.chandra on 20/09/18.
 */
import * as React from "react";
import { StyleProp, ViewStyle } from "react-native";
import { Layout } from "../layoutmanager/LayoutManager";
import { Dimension } from "../dependencies/LayoutProvider";
export declare enum StickyType {
    HEADER = 0,
    FOOTER = 1
}
export interface StickyObjectProps {
    stickyIndices: number[] | undefined;
    getLayoutForIndex: (index: number) => Layout | undefined;
    getDataForIndex: (index: number) => any;
    getLayoutTypeForIndex: (index: number) => string | number;
    getExtendedState: () => object | undefined;
    getRLVRenderedSize: () => Dimension | undefined;
    getContentDimension: () => Dimension | undefined;
    getRowRenderer: () => ((type: string | number, data: any, index: number, extendedState?: object) => JSX.Element | JSX.Element[] | null);
    getDistanceFromWindow: () => number;
    overrideRowRenderer?: (type: string | number | undefined, data: any, index: number, extendedState?: object) => JSX.Element | JSX.Element[] | null;
}
export interface StickyObjectState {
    visible: boolean;
}
export default abstract class StickyObject<P extends StickyObjectProps, S extends StickyObjectState> extends React.Component<P, S> {
    protected stickyType: StickyType;
    protected stickyTypeMultiplier: number;
    protected stickyVisiblity: boolean;
    protected containerPosition: StyleProp<ViewStyle>;
    protected currentIndex: number;
    protected currentStickyIndex: number;
    protected visibleIndices: number[];
    protected bounceScrolling: boolean;
    private _previousLayout;
    private _previousHeight;
    private _nextLayout;
    private _nextY;
    private _nextHeight;
    private _currentLayout;
    private _currentY;
    private _currentHeight;
    private _nextYd;
    private _currentYd;
    private _scrollableHeight;
    private _scrollableWidth;
    private _windowBound;
    private _stickyViewOffset;
    private _previousStickyIndex;
    private _nextStickyIndex;
    private _firstCompute;
    private _smallestVisibleIndex;
    private _largestVisibleIndex;
    private _offsetY;
    constructor(props: P, context?: any);
    componentWillReceiveProps(newProps: StickyObjectProps): void;
    render(): JSX.Element | null;
    onVisibleIndicesChanged(all: number[]): void;
    onScroll(offsetY: number): void;
    protected abstract hasReachedBoundary(offsetY: number, distanceFromWindow: number, windowBound?: number): boolean;
    protected abstract initStickyParams(): void;
    protected abstract calculateVisibleStickyIndex(stickyIndices: number[] | undefined, smallestVisibleIndex: number, largestVisibleIndex: number, offsetY: number, distanceFromWindow: number, windowBound?: number): void;
    protected abstract getNextYd(_nextY: number, nextHeight: number): number;
    protected abstract getCurrentYd(currentY: number, currentHeight: number): number;
    protected abstract getScrollY(offsetY: number, scrollableHeight?: number): number | undefined;
    protected stickyViewVisible(_visible: boolean): void;
    protected boundaryProcessing(offsetY: number, distanceFromWindow: number, windowBound?: number): void;
    private _initParams;
    private _computeLayouts;
    private _setSmallestAndLargestVisibleIndices;
    private _renderSticky;
}
