/**
 * Created by ananya.chandra on 14/09/18.
 */

import * as React from "react";
import {ToastAndroid, View, Animated} from "react-native";
import RecyclerListView, {RecyclerListViewState, RecyclerListViewProps} from "./RecyclerListView";
import { ScrollEvent } from "./scrollcomponent/BaseScrollView";
import {Layout, LayoutManager} from "./layoutmanager/LayoutManager";

export interface StickyContainerProps {
    children: any;
    stickyHeaderIndices: number[];
    stickyFooterIndices: number[];
    stickyView?: JSX.Element;
}
export interface StickyContainerState {
    topVisible: boolean;
    bottomVisible: boolean;
    headerTentativeSliding: boolean;
}
export default class StickyContainer<P extends StickyContainerProps, S extends StickyContainerState> extends React.Component<P, S> {
    private _recyclerRef: RecyclerListView<RecyclerListViewProps, RecyclerListViewState> | null = null;
    private _rowRenderer: ((type: string | number, data: any, index: number) => JSX.Element | JSX.Element[] | null) | null = null;
    private _topStickyViewOffset: Animated.Value = new Animated.Value(0);
    private _currentStickyHeaderIndice: number = 0;
    private _currentStickyFooterIndice: number = 0;

    constructor(props: P, context?: any) {
        super(props, context);
        this._onVisibleIndexesChanged = this._onVisibleIndexesChanged.bind(this);
        this._onScroll = this._onScroll.bind(this);

        this.state = {
            topVisible: false,
            bottomVisible: !!this.props.stickyFooterIndices,
            headerTentativeSliding: false,
        } as S;
    }

    public render(): JSX.Element {
        const recycler = React.cloneElement(this.props.children, {
            ref: this._getRecyclerRef,
            onVisibleIndexesChanged: this._onVisibleIndexesChanged,
            onScroll: this._onScroll,
        });
        if (this._recyclerRef) {
            this._rowRenderer = this._recyclerRef.props.rowRenderer;
        }
        return (
            <View style={{flex: 1}}>
                {recycler}
                {this.state.topVisible ?
                    <Animated.View style={{position: "absolute", top: 0, transform: [{translateY: this._topStickyViewOffset}]}}>
                        {this._rowRenderer ? this._rowRenderer(this.props.stickyHeaderIndices[this._currentStickyHeaderIndice], null, 0) : null}
                    </Animated.View> : null}
                {this.state.bottomVisible ?
                    <View style={{position: "absolute", bottom: 0}}>
                        {this._rowRenderer ? this._rowRenderer(this.props.stickyFooterIndices[this._currentStickyFooterIndice], null, 0) : null}
                    </View> : null}
            </View>
        );
    }

    public bottomStickyViewVisible(visible: boolean): void {
        this.setState({
            bottomVisible: visible,
        });
    }

    public topStickyViewVisible(visible: boolean, tentativeSliding?: boolean): void {
        this.setState({
            topVisible: visible,
            headerTentativeSliding: tentativeSliding ? tentativeSliding : false,
        });
    }

    private _getRecyclerRef = (recycler: any) => { this._recyclerRef = recycler as (RecyclerListView<RecyclerListViewProps, RecyclerListViewState> | null); };

    private _onVisibleIndexesChanged(all: number[], now: number[], notNow: number[]): void {
        if (this.props.stickyHeaderIndices) {
            const stickyHeaderIndice: number = this.props.stickyHeaderIndices[this._currentStickyHeaderIndice];
            if (all.indexOf(stickyHeaderIndice) >= 0 && all.indexOf(stickyHeaderIndice - 1) === -1) {
                this.topStickyViewVisible(true);
            } else if (all.indexOf(stickyHeaderIndice) >= 0 && all.indexOf(stickyHeaderIndice - 1) >= 0) {
                this.topStickyViewVisible(false);
            }
        }
        if (this.props.stickyFooterIndices) {
            const stickyFooterIndice: number = this.props.stickyFooterIndices[this._currentStickyFooterIndice];
            if (all.indexOf(stickyFooterIndice) >= 0 && all.indexOf(stickyFooterIndice + 1) === -1) {
                this.bottomStickyViewVisible(true);
            } else if (all.indexOf(stickyFooterIndice) >= 0 && all.indexOf(stickyFooterIndice + 1) >= 0) {
                this.bottomStickyViewVisible(false);
            }
        }
    }

    private _onScroll(rawEvent: ScrollEvent, offsetX: number, offsetY: number): void {
        if (this._recyclerRef) {
            const currentStickyHeaderIndice = this.props.stickyHeaderIndices[this._currentStickyHeaderIndice];
            const previousStickyHeaderIndice = this.props.stickyHeaderIndices[this._currentStickyHeaderIndice - 1];
            const nextStickyHeaderIndice = this.props.stickyHeaderIndices[this._currentStickyHeaderIndice + 1];
            if (previousStickyHeaderIndice || this.state.headerTentativeSliding) {
                const previousLayout: Layout | undefined = this._recyclerRef.getLayout(previousStickyHeaderIndice);
                const previousHeight: number | null = previousLayout ? previousLayout.height : null;
                const currentLayout: Layout | undefined = this._recyclerRef.getLayout(currentStickyHeaderIndice);
                const currentY: number | null = currentLayout ? currentLayout.y : null;
                if (currentY && previousHeight && offsetY < currentY) {
                    if (offsetY > currentY - previousHeight) {
                        this._currentStickyHeaderIndice -= 1;
                        const y = offsetY + previousHeight - currentY;
                        this._topStickyViewOffset.setValue(-1 * y);
                        this.topStickyViewVisible(true, true);
                    }
                }
            }
            if (nextStickyHeaderIndice) {
                const nextLayout: Layout | undefined = this._recyclerRef.getLayout(nextStickyHeaderIndice);
                const nextY: number | null = nextLayout ? nextLayout.y : null;
                const currentLayout: Layout | undefined = this._recyclerRef.getLayout(currentStickyHeaderIndice);
                const currentHeight: number | null = currentLayout ? currentLayout.height : null;
                if (nextY && currentHeight && offsetY > nextY - currentHeight) {
                    if (offsetY <= nextY) {
                        const y = offsetY + currentHeight - nextY;
                        this._topStickyViewOffset.setValue(-1 * y);
                    }
                    if (offsetY > nextY) {
                        this._currentStickyHeaderIndice += 1;
                        this._topStickyViewOffset.setValue(0);
                        this.topStickyViewVisible(true);
                    }
                }
            }
        }
    }
}
