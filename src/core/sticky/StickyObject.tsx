/**
 * Created by ananya.chandra on 20/09/18.
 */

import * as React from "react";
import {Animated, StyleProp, ViewStyle} from "react-native";
import {Layout} from "../layoutmanager/LayoutManager";
import RecyclerListView, {RecyclerListViewProps, RecyclerListViewState} from "../RecyclerListView";
import {Dimension} from "../dependencies/LayoutProvider";

export enum StickyType {
    HEADER,
    FOOTER,
}
export interface StickyObjectProps {
    stickyIndices: number[] | undefined;
    overrideRowRenderer?: (type: string | number | undefined, data: any, index: number, extendedState?: object) => JSX.Element | JSX.Element[] | null;
}
export interface StickyObjectState {
    visible: boolean;
}
export default abstract class StickyObject<P extends StickyObjectProps, S extends StickyObjectState> extends React.Component<P, S> {
    protected stickyType: StickyType = StickyType.HEADER;
    protected stickyTypeMultiplier: number = 1;
    protected stickyVisiblity: boolean = false;
    protected containerPosition: StyleProp<ViewStyle>;
    protected currentIndex: number = 0;
    protected currentStickyIndex: number = 0;

    private _previousLayout: Layout | undefined;
    private _previousHeight: number | undefined;
    private _nextLayout: Layout | undefined;
    private _nextY: number | undefined;
    private _nextHeight: number | undefined;
    private _currentLayout: Layout | undefined;
    private _currentY: number | undefined;
    private _currentHeight: number | undefined;

    private _nextYd: number | undefined;
    private _currentYd: number | undefined;
    private _scrollableHeight: number | null = null;
    private _scrollableWidth: number | null = null;

    private _stickyViewOffset: Animated.Value = new Animated.Value(0);
    private _stickyData: any | null = null;
    private _stickyLayoutType: string | number = "";
    private _previousStickyIndex: number = 0;
    private _nextStickyIndex: number = 0;
    private _firstCompute: boolean = true;
    private _smallestVisibleIndex: number = 0;
    private _largestVisibleIndex: number = 0;

    private _recyclerRef: RecyclerListView<RecyclerListViewProps, RecyclerListViewState> | null = null;
    private _rowRenderer: ((type: string | number, data: any, index: number, extendedState?: object) => JSX.Element | JSX.Element[] | null) | null = null;

    constructor(props: P, context?: any) {
        super(props, context);
        this.state = {
            visible: this.stickyVisiblity,
        } as S;
    }

    public componentWillReceiveProps(newProps: StickyObjectProps): void {
        this._computeLayouts(newProps.stickyIndices);
    }

    public render(): JSX.Element | null {
        return (
            <Animated.View style={[
                {position: "absolute", width: this._scrollableWidth, transform: [{translateY: this._stickyViewOffset}]},
                this.containerPosition,
            ]}>
                {this.state.visible ?
                    this._renderSticky()
                : null}
            </Animated.View>
        );
    }

    public onVisibleIndicesChanged(all: number[], now: number[], notNow: number[],
                                   recyclerRef: RecyclerListView<RecyclerListViewProps, RecyclerListViewState> | null): void {
        if (this._firstCompute) {
            this.initStickyParams();
            this._initParams(recyclerRef);
            this._firstCompute = false;
        }
        this._setSmallestAndLargestVisibleIndices(all);
        this.calculateVisibleStickyIndex(
            this.props.stickyIndices, this._smallestVisibleIndex, this._largestVisibleIndex,
        );
        this._computeLayouts();
        this._stickyViewVisible(this.stickyVisiblity);
    }

    public onScroll(offsetY: number): void {
        if (this._recyclerRef) {
            if (this._previousStickyIndex) {
                const scrollY: number | null = this.getScrollY(offsetY, this._scrollableHeight);
                if (this._previousHeight && this._currentYd && scrollY && scrollY < this._currentYd) {
                    if (scrollY > this._currentYd - this._previousHeight) {
                        this.currentIndex -= this.stickyTypeMultiplier;
                        const translate = (scrollY - this._currentYd + this._previousHeight) * (-1 * this.stickyTypeMultiplier);
                        this._stickyViewOffset.setValue(translate);
                        this._computeLayouts();
                        this._stickyViewVisible(true);
                    }
                } else {
                    this._stickyViewOffset.setValue(0);
                }
            }
            if (this._nextStickyIndex) {
                const scrollY: number | null = this.getScrollY(offsetY, this._scrollableHeight);
                if (this._currentHeight && this._nextYd && scrollY && scrollY + this._currentHeight > this._nextYd) {
                    if (scrollY <= this._nextYd) {
                        const translate = (scrollY - this._nextYd + this._currentHeight) * (-1 * this.stickyTypeMultiplier);
                        this._stickyViewOffset.setValue(translate);
                    } else if (scrollY > this._nextYd) {
                        this.currentIndex += this.stickyTypeMultiplier;
                        this._stickyViewOffset.setValue(0);
                        this._computeLayouts();
                        this._stickyViewVisible(true);
                    }
                } else {
                    this._stickyViewOffset.setValue(0);
                }
            }
        }
    }

    protected abstract initStickyParams(): void;
    protected abstract calculateVisibleStickyIndex(
        stickyIndices: number[] | undefined, smallestVisibleIndex: number, largestVisibleIndex: number,
    ): void;
    protected abstract getNextYd(_nextY: number, nextHeight: number): number;
    protected abstract getCurrentYd(currentY: number, currentHeight: number): number;
    protected abstract getScrollY(offsetY: number, scrollableHeight: number | null): number | null;

    private _stickyViewVisible(_visible: boolean): void {
        this.setState({
            visible: _visible,
        });
    }

    private _initParams(recyclerRef: RecyclerListView<RecyclerListViewProps, RecyclerListViewState> | null): void {
        if (recyclerRef) {
            this._recyclerRef = recyclerRef;
            this._rowRenderer = recyclerRef.props.rowRenderer;
            const dimension: Dimension | null = recyclerRef ? recyclerRef.getRenderedSize() : null;
            if (dimension) {
                this._scrollableHeight = dimension.height;
                this._scrollableWidth = dimension.width;
            }
        }
    }

    private _computeLayouts(newStickyIndices?: number[]): void {
        const stickyIndices: number[] | undefined = newStickyIndices ? newStickyIndices : this.props.stickyIndices;
        if (stickyIndices && this._recyclerRef) {
            this.currentStickyIndex = stickyIndices[this.currentIndex];
            this._stickyData = this._recyclerRef.props.dataProvider.getDataForIndex(this.currentStickyIndex);
            this._stickyLayoutType = this._recyclerRef.props.layoutProvider.getLayoutTypeForIndex(this.currentStickyIndex);
            this._previousStickyIndex = stickyIndices[this.currentIndex - this.stickyTypeMultiplier];
            this._nextStickyIndex = stickyIndices[this.currentIndex + this.stickyTypeMultiplier];
            if (this.currentStickyIndex) {
                this._currentLayout = this._recyclerRef.getLayout(this.currentStickyIndex);
                this._currentY = this._currentLayout ? this._currentLayout.y : undefined;
                this._currentHeight = this._currentLayout ? this._currentLayout.height : undefined;
                this._currentYd = this._currentY && this._currentHeight ? this.getCurrentYd(this._currentY, this._currentHeight) : undefined;
            }
            if (this._previousStickyIndex) {
                this._previousLayout = this._recyclerRef.getLayout(this._previousStickyIndex);
                this._previousHeight = this._previousLayout ? this._previousLayout.height : undefined;
            }
            if (this._nextStickyIndex) {
                this._nextLayout = this._recyclerRef.getLayout(this._nextStickyIndex);
                this._nextY = this._nextLayout ? this._nextLayout.y : undefined;
                this._nextHeight = this._nextLayout ? this._nextLayout.height : undefined;
                this._nextYd = this._nextY && this._nextHeight ? this.getNextYd(this._nextY, this._nextHeight) : undefined;
            }
        }
    }

    private _setSmallestAndLargestVisibleIndices(indicesArray: number[]): void {
        this._smallestVisibleIndex = indicesArray[0];
        this._largestVisibleIndex = indicesArray[indicesArray.length - 1];
    }

    private _renderSticky(): JSX.Element | JSX.Element[] | null {
        const extendedState: object | undefined = this._recyclerRef ? this._recyclerRef.props.extendedState : undefined;
        if (this.props.overrideRowRenderer) {
            return this.props.overrideRowRenderer(this._stickyLayoutType, this._stickyData, this.currentStickyIndex, extendedState);
        } else if (this._rowRenderer) {
            return this._rowRenderer(this._stickyLayoutType, this._stickyData, this.currentStickyIndex, extendedState);
        } else {
            return null;
        }
    }
}
