/**
 * Created by ananya.chandra on 20/09/18.
 */

import * as React from "react";
import {Animated, StyleProp, ViewStyle} from "react-native";
import {Layout} from "../layoutmanager/LayoutManager";
import RecyclerListView, {RecyclerListViewProps, RecyclerListViewState} from "../RecyclerListView";

export enum StickyType {
    HEADER,
    FOOTER,
}
export interface StickyObjectProps {
    rowRenderer: ((type: string | number, data: any, index: number) => JSX.Element | JSX.Element[] | null) | null;
    stickyIndices: number[];
    recyclerRef: RecyclerListView<RecyclerListViewProps, RecyclerListViewState> | null;

}
export interface StickyObjectState {
    visible: boolean;
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

    private _stickyViewOffset: Animated.Value = new Animated.Value(0);
    private _currentIndice: number = 0;
    private _currentStickyIndice: number = 0;
    private _previousStickyIndice: number = 0;
    private _nextStickyIndice: number = 0;
    private _firstCompute: boolean = true;

    constructor(props: P, context?: any) {
        super(props, context);

        this.initStickyParams();
        this.state = {
            visible: this.initialVisibility,
        } as S;
    }

    public render(): JSX.Element | null {
        return (
            <Animated.View style={[{position: "absolute", transform: [{translateY: this._stickyViewOffset}]}, this.containerPosition]}>
                {this.state.visible ?
                    this.props.rowRenderer ? this.props.rowRenderer(this.props.stickyIndices[this._currentIndice], null, 0) : null
                    : null}
            </Animated.View>
        );
    }

    public onVisibleIndicesChanged(all: number[], now: number[], notNow: number[]): void {
        if (this._firstCompute) {
            this._computeLayouts(this.props.recyclerRef);
            this._firstCompute = false;
        }
        //TODO Ananya: Use hashmaps
        if (all.indexOf(this._currentStickyIndice) >= 0 && all.indexOf(this._currentStickyIndice - this.stickyTypeMultiplier) === -1) {
            this._stickyViewVisible(true);
        } else if (all.indexOf(this._currentStickyIndice) >= 0 && all.indexOf(this._currentStickyIndice - this.stickyTypeMultiplier) >= 0) {
            this._stickyViewVisible(false);
        }
    }

    public onScroll(offsetY: number): void {
        if (this.props.recyclerRef) {
            if (this._previousStickyIndice) {
                if (this.currentY && this.currentHeight) {
                    let currentYd: number;
                    let screenHeight: number | null;
                    let scrollY: number | null;
                    if (this.stickyType === StickyType.HEADER) {
                        currentYd = this.currentY;
                        scrollY = offsetY;
                    } else {
                        currentYd = -1 * (this.currentY + this.currentHeight);
                        screenHeight = this.props.recyclerRef.getScrollableHeight();
                        scrollY = screenHeight ? -1 * (offsetY + screenHeight) : null;
                    }
                    if (this.previousHeight && scrollY && scrollY < currentYd) {
                        if (scrollY > currentYd - this.previousHeight) {
                            this._currentIndice -= this.stickyTypeMultiplier;
                            const translate = (scrollY - currentYd + this.previousHeight) * (-1 * this.stickyTypeMultiplier);
                            this._stickyViewOffset.setValue(translate);
                            this._computeLayouts(this.props.recyclerRef);
                            this._stickyViewVisible(true);
                        }
                    }
                }
            }
            if (this._nextStickyIndice) {
                if (this.nextY && this.nextHeight) {
                    let nextYd: number;
                    let screenHeight: number | null;
                    let scrollY: number | null;
                    if (this.stickyType === StickyType.HEADER) {
                        nextYd = this.nextY;
                        scrollY = offsetY;
                    } else {
                        nextYd = -1 * (this.nextY + this.nextHeight);
                        screenHeight = this.props.recyclerRef.getScrollableHeight();
                        scrollY = screenHeight ? -1 * (offsetY + screenHeight) : null;
                    }
                    if (this.currentHeight && nextYd && scrollY && scrollY + this.currentHeight > nextYd) {
                        if (scrollY <= nextYd) {
                            const translate = (scrollY - nextYd + this.currentHeight) * (-1 * this.stickyTypeMultiplier);
                            this._stickyViewOffset.setValue(translate);
                        } else if (scrollY > nextYd) {
                            this._currentIndice += this.stickyTypeMultiplier;
                            this._stickyViewOffset.setValue(0);
                            this._computeLayouts(this.props.recyclerRef);
                            this._stickyViewVisible(true);
                        }
                    }
                }
            }
        }
    }

    protected abstract initStickyParams(): void;

    private _stickyViewVisible(_visible: boolean): void {
        this.setState({
            visible: _visible,
        });
    }

    private _computeLayouts(recyclerRef: RecyclerListView<RecyclerListViewProps, RecyclerListViewState> | null): void {
        if (recyclerRef) {
            this._currentStickyIndice = this.props.stickyIndices[this._currentIndice];
            this._previousStickyIndice = this.props.stickyIndices[this._currentIndice - this.stickyTypeMultiplier];
            this._nextStickyIndice = this.props.stickyIndices[this._currentIndice + this.stickyTypeMultiplier];
            if (this._currentStickyIndice) {
                this.currentLayout = recyclerRef.getLayout(this._currentStickyIndice);
                this.currentY = this.currentLayout ? this.currentLayout.y : undefined;
                this.currentHeight = this.currentLayout ? this.currentLayout.height : undefined;
            }
            if (this._previousStickyIndice) {
                this.previousLayout = recyclerRef.getLayout(this._previousStickyIndice);
                this.previousHeight = this.previousLayout ? this.previousLayout.height : undefined;
            }
            if (this._nextStickyIndice) {
                this.nextLayout = recyclerRef.getLayout(this._nextStickyIndice);
                this.nextY = this.nextLayout ? this.nextLayout.y : undefined;
                this.nextHeight = this.nextLayout ? this.nextLayout.height : undefined;
            }
        }
    }
}
