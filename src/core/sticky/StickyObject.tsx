/**
 * Created by ananya.chandra on 20/09/18.
 */

import * as React from "react";
import { Animated, StyleProp, ViewStyle } from "react-native";
import { Layout } from "../layoutmanager/LayoutManager";
import { Dimension } from "../dependencies/LayoutProvider";
import RecyclerListViewExceptions from "../exceptions/RecyclerListViewExceptions";
import CustomError from "../exceptions/CustomError";
import { ComponentCompat } from "../../utils/ComponentCompat";
import { WindowCorrection } from "../ViewabilityTracker";

export enum StickyType {
    HEADER,
    FOOTER,
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
    overrideRowRenderer?: (type: string | number | undefined, data: any, index: number, extendedState?: object) => JSX.Element | JSX.Element[] | null;
    renderContainer?: ((rowContent: JSX.Element, index: number, extendState?: object) => JSX.Element | null);
    getWindowCorrection?: () => WindowCorrection;
}

export default abstract class StickyObject<P extends StickyObjectProps> extends ComponentCompat<P> {

    protected stickyType: StickyType = StickyType.HEADER;
    protected stickyTypeMultiplier: number = 1;
    protected stickyVisiblity: boolean = false;
    protected containerPosition: StyleProp<ViewStyle>;
    protected currentIndex: number = 0;
    protected currentStickyIndex: number = 0;
    protected visibleIndices: number[] = [];
    protected bounceScrolling: boolean = false;

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
    private _scrollableHeight: number | undefined;
    private _scrollableWidth: number | undefined;
    private _windowBound: number | undefined;

    private _stickyViewOffset: Animated.Value = new Animated.Value(0);
    private _previousStickyIndex: number = 0;
    private _nextStickyIndex: number = 0;
    private _firstCompute: boolean = true;
    private _smallestVisibleIndex: number = 0;
    private _largestVisibleIndex: number = 0;
    private _offsetY: number = 0;
    private _windowCorrection: WindowCorrection = {
        startCorrection: 0, endCorrection: 0, windowShift: 0,
    };

    constructor(props: P, context?: any) {
        super(props, context);
    }

    public componentWillReceivePropsCompat(newProps: StickyObjectProps): void {
        this._updateDimensionParams();
        this.calculateVisibleStickyIndex(newProps.stickyIndices, this._smallestVisibleIndex, this._largestVisibleIndex,
            this._offsetY, this._windowBound);
        this._computeLayouts(newProps.stickyIndices);
        this.stickyViewVisible(this.stickyVisiblity, false);
    }

    public renderCompat(): JSX.Element | null {
        // Add the container style if renderContainer is undefined

        const containerStyle = [{ transform: [{ translateY: this._stickyViewOffset }] },
            (!this.props.renderContainer && [{ position: "absolute", width: this._scrollableWidth }, this.containerPosition])];

        const content = (
            <Animated.View style={containerStyle}>
                {this.stickyVisiblity ? this._renderSticky() : null}
            </Animated.View>
        );

        if (this.props.renderContainer) {
            const _extendedState: any = this.props.getExtendedState();
            return this.props.renderContainer(content, this.currentStickyIndex, _extendedState);
        } else {
            return (content);
        }
    }

    public onVisibleIndicesChanged(all: number[]): void {
        if (this._firstCompute) {
            this.initStickyParams();
            this._offsetY = this._getAdjustedOffsetY(this._offsetY);
            this._firstCompute = false;
        }
        this._updateDimensionParams();
        this._setSmallestAndLargestVisibleIndices(all);
        this.calculateVisibleStickyIndex(this.props.stickyIndices, this._smallestVisibleIndex, this._largestVisibleIndex,
            this._offsetY, this._windowBound);
        this._computeLayouts();
        this.stickyViewVisible(this.stickyVisiblity);
    }

    public onScroll(offsetY: number): void {
        offsetY = this._getAdjustedOffsetY(offsetY);
        this._offsetY = offsetY;
        this._updateDimensionParams();
        this.boundaryProcessing(offsetY, this._windowBound);
        if (this._previousStickyIndex !== undefined) {
            if (this._previousStickyIndex * this.stickyTypeMultiplier >= this.currentStickyIndex * this.stickyTypeMultiplier) {
                throw new CustomError(RecyclerListViewExceptions.stickyIndicesArraySortError);
            }
            const scrollY: number | undefined = this.getScrollY(offsetY, this._scrollableHeight);
            if (this._previousHeight && this._currentYd && scrollY && scrollY < this._currentYd) {
                if (scrollY > this._currentYd - this._previousHeight) {
                    this.currentIndex -= this.stickyTypeMultiplier;
                    const translate = (scrollY - this._currentYd + this._previousHeight) * (-1 * this.stickyTypeMultiplier);
                    this._stickyViewOffset.setValue(translate);
                    this._computeLayouts();
                    this.stickyViewVisible(true);
                }
            } else {
                this._stickyViewOffset.setValue(0);
            }
        }
        if (this._nextStickyIndex !== undefined) {
            if (this._nextStickyIndex * this.stickyTypeMultiplier <= this.currentStickyIndex * this.stickyTypeMultiplier) {
                throw new CustomError(RecyclerListViewExceptions.stickyIndicesArraySortError);
            }
            const scrollY: number | undefined = this.getScrollY(offsetY, this._scrollableHeight);
            if (this._currentHeight && this._nextYd && scrollY && scrollY + this._currentHeight > this._nextYd) {
                if (scrollY <= this._nextYd) {
                    const translate = (scrollY - this._nextYd + this._currentHeight) * (-1 * this.stickyTypeMultiplier);
                    this._stickyViewOffset.setValue(translate);
                } else if (scrollY > this._nextYd) {
                    this.currentIndex += this.stickyTypeMultiplier;
                    this._stickyViewOffset.setValue(0);
                    this._computeLayouts();
                    this.stickyViewVisible(true);
                }
            } else {
                this._stickyViewOffset.setValue(0);
            }
        }
    }

    protected abstract hasReachedBoundary(offsetY: number, windowBound?: number): boolean;
    protected abstract initStickyParams(): void;
    protected abstract calculateVisibleStickyIndex(
        stickyIndices: number[] | undefined, smallestVisibleIndex: number, largestVisibleIndex: number, offsetY: number, windowBound?: number): void;
    protected abstract getNextYd(_nextY: number, nextHeight: number): number;
    protected abstract getCurrentYd(currentY: number, currentHeight: number): number;
    protected abstract getScrollY(offsetY: number, scrollableHeight?: number): number | undefined;

    protected stickyViewVisible(_visible: boolean, shouldTriggerRender: boolean = true): void {
        this.stickyVisiblity = _visible;
        if (shouldTriggerRender) {
            this.setState({});
        }
    }

    protected getWindowCorrection(props: StickyObjectProps): WindowCorrection {
        return (props.getWindowCorrection && props.getWindowCorrection()) || this._windowCorrection;
    }

    protected boundaryProcessing(offsetY: number, windowBound?: number): void {
        const hasReachedBoundary: boolean = this.hasReachedBoundary(offsetY, windowBound);
        if (this.bounceScrolling !== hasReachedBoundary) {
            this.bounceScrolling = hasReachedBoundary;
            if (this.bounceScrolling) {
                this.stickyViewVisible(false);
            } else {
                this.onVisibleIndicesChanged(this.visibleIndices);
            }
        }
    }

    private _updateDimensionParams(): void {
        const rlvDimension: Dimension | undefined = this.props.getRLVRenderedSize();
        if (rlvDimension) {
            this._scrollableHeight = rlvDimension.height;
            this._scrollableWidth = rlvDimension.width;
        }
        const contentDimension: Dimension | undefined = this.props.getContentDimension();
        if (contentDimension && this._scrollableHeight) {
            this._windowBound = contentDimension.height - this._scrollableHeight;
        }
    }

    private _computeLayouts(newStickyIndices?: number[]): void {
        const stickyIndices: number[] | undefined = newStickyIndices ? newStickyIndices : this.props.stickyIndices;
        if (stickyIndices) {
            this.currentStickyIndex = stickyIndices[this.currentIndex];
            this._previousStickyIndex = stickyIndices[this.currentIndex - this.stickyTypeMultiplier];
            this._nextStickyIndex = stickyIndices[this.currentIndex + this.stickyTypeMultiplier];
            if (this.currentStickyIndex !== undefined) {
                this._currentLayout = this.props.getLayoutForIndex(this.currentStickyIndex);
                this._currentY = this._currentLayout ? this._currentLayout.y : undefined;
                this._currentHeight = this._currentLayout ? this._currentLayout.height : undefined;
                this._currentYd = this._currentY && this._currentHeight ? this.getCurrentYd(this._currentY, this._currentHeight) : undefined;
            }
            if (this._previousStickyIndex !== undefined) {
                this._previousLayout = this.props.getLayoutForIndex(this._previousStickyIndex);
                this._previousHeight = this._previousLayout ? this._previousLayout.height : undefined;
            }
            if (this._nextStickyIndex !== undefined) {
                this._nextLayout = this.props.getLayoutForIndex(this._nextStickyIndex);
                this._nextY = this._nextLayout ? this._nextLayout.y : undefined;
                this._nextHeight = this._nextLayout ? this._nextLayout.height : undefined;
                this._nextYd = this._nextY && this._nextHeight ? this.getNextYd(this._nextY, this._nextHeight) : undefined;
            }
        }
    }

    private _setSmallestAndLargestVisibleIndices(indicesArray: number[]): void {
        this.visibleIndices = indicesArray;
        this._smallestVisibleIndex = indicesArray[0];
        this._largestVisibleIndex = indicesArray[indicesArray.length - 1];
    }

    private _renderSticky(): JSX.Element | JSX.Element[] | null {
        const _stickyData: any = this.props.getDataForIndex(this.currentStickyIndex);
        const _stickyLayoutType: string | number = this.props.getLayoutTypeForIndex(this.currentStickyIndex);
        const _extendedState: object | undefined = this.props.getExtendedState();
        const _rowRenderer: ((type: string | number, data: any, index: number, extendedState?: object)
            => JSX.Element | JSX.Element[] | null) = this.props.getRowRenderer();
        if (this.props.overrideRowRenderer) {
            return this.props.overrideRowRenderer(_stickyLayoutType, _stickyData, this.currentStickyIndex, _extendedState);
        } else {
            return _rowRenderer(_stickyLayoutType, _stickyData, this.currentStickyIndex, _extendedState);
        }
    }

    private _getAdjustedOffsetY(offsetY: number): number {
        return offsetY + this.getWindowCorrection(this.props).windowShift;
    }
}
