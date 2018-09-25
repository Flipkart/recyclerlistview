/**
 * Created by ananya.chandra on 14/09/18.
 */

import * as React from "react";
import {View} from "react-native";
import RecyclerListView, {RecyclerListViewState, RecyclerListViewProps} from "./RecyclerListView";
import { ScrollEvent } from "./scrollcomponent/BaseScrollView";
import StickyObject, {StickyObjectProps, StickyObjectState} from "./sticky/StickyObject";
import StickyHeader from "./sticky/StickyHeader";
import StickyFooter from "./sticky/StickyFooter";

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
    private _stickyFooterRef: StickyObject<StickyObjectProps, StickyObjectState> | null = null;
    private _rowRenderer: ((type: string | number, data: any, index: number) => JSX.Element | JSX.Element[] | null) | null = null;

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
                {this.props.stickyHeaderIndices ? (
                    <StickyHeader ref={(stickyHeaderRef: any) => {
                    this._stickyHeaderRef = stickyHeaderRef as (StickyObject<StickyObjectProps, StickyObjectState> | null);
                }}
                              rowRenderer={this._rowRenderer}
                              stickyIndices={this.props.stickyHeaderIndices}
                              recyclerRef={this._recyclerRef}/>
                ) : null}
                {this.props.stickyFooterIndices ? (
                    <StickyFooter ref={(stickyFooterRef: any) => {
                    this._stickyFooterRef = stickyFooterRef as (StickyObject<StickyObjectProps, StickyObjectState> | null);
                }}
                              rowRenderer={this._rowRenderer}
                              stickyIndices={this.props.stickyFooterIndices}
                              recyclerRef={this._recyclerRef}/>
                ) : null}
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
        if (this._stickyHeaderRef) {
            this._stickyHeaderRef.onVisibleIndicesChanged(all, now, notNow);
        }
        if (this._stickyFooterRef) {
            this._stickyFooterRef.onVisibleIndicesChanged(all, now, notNow);
        }

        //TODO Ananya: Hack to rerender to get recyclerRef. To be solved.
        this.topStickyViewVisible(false);
    }

    private _onScroll(rawEvent: ScrollEvent, offsetX: number, offsetY: number): void {
        if (this._stickyHeaderRef) {
            this._stickyHeaderRef.onScroll(offsetY);
        }
        if (this._stickyFooterRef) {
            this._stickyFooterRef.onScroll(offsetY);
        }
    }
}