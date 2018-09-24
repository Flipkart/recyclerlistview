/**
 * Created by ananya.chandra on 14/09/18.
 */

import * as React from "react";
import {ToastAndroid, View, Animated} from "react-native";
import RecyclerListView, {RecyclerListViewState, RecyclerListViewProps} from "./RecyclerListView";
import { ScrollEvent } from "./scrollcomponent/BaseScrollView";
import {Layout, LayoutManager} from "./layoutmanager/LayoutManager";
import StickyObject, {StickyObjectProps, StickyObjectState, StickyType} from "./sticky/StickyObject";

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
    private _stickyHeaderRef: StickyObject<StickyObjectProps, StickyObjectState> | null = null;
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
                <StickyObject ref={(stickyHeaderRef: any) => {
                    this._stickyHeaderRef = stickyHeaderRef as (StickyObject<StickyObjectProps, StickyObjectState> | null);
                }}
                              type={StickyType.HEADER}
                              rowRenderer={this._rowRenderer}
                              stickyHeaderIndices={this.props.stickyHeaderIndices}
                              stickyFooterIndices={this.props.stickyFooterIndices}
                              recyclerRef={this._recyclerRef}/>
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
        //TODO Ananya: Use hashmaps
        if (this._stickyHeaderRef) {
            this._stickyHeaderRef.onVisibleIndicesChanged(all);
        }

        //TODO Ananya: Hack to rerender to get recyclerRef. To be solved.
        this.topStickyViewVisible(false);
    }

    private _onScroll(rawEvent: ScrollEvent, offsetX: number, offsetY: number): void {
        if (this._stickyHeaderRef) {
            this._stickyHeaderRef.onScroll(offsetY);
        }
    }
}
