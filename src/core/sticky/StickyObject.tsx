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
    stickyIndices: number[];
}
export interface StickyObjectState {
    visible: boolean;
}
export interface VisibleIndices {
    [key: number]: boolean;
}
export default abstract class StickyObject<P extends StickyObjectProps, S extends StickyObjectState> extends React.Component<P, S> {
    protected stickyType: StickyType = StickyType.HEADER;
    protected stickyTypeMultiplier: number = 1;
    protected initialVisibility: boolean = false;
    protected containerPosition: StyleProp<ViewStyle>;

    protected previousLayout: Layout | undefined;
    protected previousHeight: number | undefined;
    protected nextLayout: Layout | undefined;
    protected nextY: number | undefined;
    protected nextHeight: number | undefined;
    protected currentLayout: Layout | undefined;
    protected currentY: number | undefined;
    protected currentHeight: number | undefined;

    protected nextYd: number | undefined;
    protected currentYd: number | undefined;
    private _scrollableHeight: number | null = null;
    private _scrollableWidth: number | null = null;

    private _stickyViewOffset: Animated.Value = new Animated.Value(0);
    private _currentIndice: number = 0;
    private _currentStickyIndice: number = 0;
    private _stickyData: any | null = null;
    private _previousStickyIndice: number = 0;
    private _nextStickyIndice: number = 0;
    private _firstCompute: boolean = true;
    private _visibleIndices: VisibleIndices = {};

    private _recyclerRef: RecyclerListView<RecyclerListViewProps, RecyclerListViewState> | null = null;
    private _rowRenderer: ((type: string | number, data: any, index: number) => JSX.Element | JSX.Element[] | null) | null = null;

    constructor(props: P, context?: any) {
        super(props, context);
        this.state = {
            visible: this.initialVisibility,
        } as S;
    }

    public render(): JSX.Element | null {
        return (
            <Animated.View style={[
                {position: "absolute", width: this._scrollableWidth, transform: [{translateY: this._stickyViewOffset}]},
                this.containerPosition,
            ]}>
                {this.state.visible ?
                    this._rowRenderer ? this._rowRenderer("", this._stickyData, this._currentStickyIndice) : null
                    : null}
            </Animated.View>
        );
    }

    public onVisibleIndicesChanged(all: number[], now: number[], notNow: number[],
                                   recyclerRef: RecyclerListView<RecyclerListViewProps, RecyclerListViewState> | null): void {
        if (this._firstCompute) {
            this._setVisibleIndices(all, true);
            this.initStickyParams();
            this._initParams(recyclerRef);
            this.isInitiallyVisible(this._visibleIndices, this._currentStickyIndice);
            if (this.initialVisibility) {
                this._stickyViewVisible(true);
            }
            this._firstCompute = false;
        } else {
            this._setVisibleIndices(now, true);
            this._setVisibleIndices(notNow, false);
            if (this._visibleIndices[this._currentStickyIndice]) {
                this._stickyViewVisible(!this._visibleIndices[this._currentStickyIndice - this.stickyTypeMultiplier]);
            }
        }
    }

    public onScroll(offsetY: number): void {
        if (this._recyclerRef) {
            if (this._previousStickyIndice) {
                if (this.currentY && this.currentHeight) {
                    const scrollY: number | null = this.getScrollY(offsetY, this._scrollableHeight);
                    if (this.previousHeight && this.currentYd && scrollY && scrollY < this.currentYd) {
                        if (scrollY > this.currentYd - this.previousHeight) {
                            this._currentIndice -= this.stickyTypeMultiplier;
                            const translate = (scrollY - this.currentYd + this.previousHeight) * (-1 * this.stickyTypeMultiplier);
                            this._stickyViewOffset.setValue(translate);
                            this._computeLayouts(this._recyclerRef);
                            this._stickyViewVisible(true);
                        }
                    }
                }
            }
            if (this._nextStickyIndice) {
                if (this.nextY && this.nextHeight) {
                    const scrollY: number | null = this.getScrollY(offsetY, this._scrollableHeight);
                    if (this.currentHeight && this.nextYd && scrollY && scrollY + this.currentHeight > this.nextYd) {
                        if (scrollY <= this.nextYd) {
                            const translate = (scrollY - this.nextYd + this.currentHeight) * (-1 * this.stickyTypeMultiplier);
                            this._stickyViewOffset.setValue(translate);
                        } else if (scrollY > this.nextYd) {
                            this._currentIndice += this.stickyTypeMultiplier;
                            this._stickyViewOffset.setValue(0);
                            this._computeLayouts(this._recyclerRef);
                            this._stickyViewVisible(true);
                        }
                    }
                }
            }
        }
    }

    protected abstract initStickyParams(): void;
    protected abstract isInitiallyVisible(visibleIndices: VisibleIndices, currentIndice: number): void;
    protected abstract getNextYd(nextY: number, nextHeight: number): number;
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
            const dimension: Dimension | null = recyclerRef ? recyclerRef.getLayoutDimension() : null;
            if (dimension) {
                this._scrollableHeight = dimension.height;
                this._scrollableWidth = dimension.width;
            }
            this._computeLayouts(recyclerRef);
        }
    }

    private _computeLayouts(recyclerRef: RecyclerListView<RecyclerListViewProps, RecyclerListViewState> | null): void {
        if (recyclerRef) {
            this._currentStickyIndice = this.props.stickyIndices[this._currentIndice];
            this._stickyData = this._recyclerRef && this._recyclerRef.props.dataProvider ?
                this._recyclerRef.props.dataProvider.getDataForIndex(this._currentStickyIndice)
                : null;
            this._previousStickyIndice = this.props.stickyIndices[this._currentIndice - this.stickyTypeMultiplier];
            this._nextStickyIndice = this.props.stickyIndices[this._currentIndice + this.stickyTypeMultiplier];
            if (this._currentStickyIndice) {
                this.currentLayout = recyclerRef.getLayout(this._currentStickyIndice);
                this.currentY = this.currentLayout ? this.currentLayout.y : undefined;
                this.currentHeight = this.currentLayout ? this.currentLayout.height : undefined;
                this.currentYd = this.currentY && this.currentHeight ? this.getCurrentYd(this.currentY, this.currentHeight) : undefined;
            }
            if (this._previousStickyIndice) {
                this.previousLayout = recyclerRef.getLayout(this._previousStickyIndice);
                this.previousHeight = this.previousLayout ? this.previousLayout.height : undefined;
            }
            if (this._nextStickyIndice) {
                this.nextLayout = recyclerRef.getLayout(this._nextStickyIndice);
                this.nextY = this.nextLayout ? this.nextLayout.y : undefined;
                this.nextHeight = this.nextLayout ? this.nextLayout.height : undefined;
                this.nextYd = this.nextY && this.nextHeight ? this.getNextYd(this.nextY, this.nextHeight) : undefined;
            }
        }
    }

    private _setVisibleIndices(indicesArray: number[], setValue: boolean): void {
        for (const index of indicesArray) {
            this._visibleIndices[index] = setValue;
        }
    }
}
