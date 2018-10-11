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
    children: any; //TODO Ananya: Resolve any
    stickyHeaderIndices: number[];
    stickyFooterIndices: number[];
    stickyView?: JSX.Element;
}
export interface StickyContainerState {
    topVisible: boolean;
}
export default class StickyContainer<P extends StickyContainerProps, S extends StickyContainerState> extends React.Component<P, S> {
    private _recyclerRef: RecyclerListView<RecyclerListViewProps, RecyclerListViewState> | null = null;
    private _stickyHeaderRef: StickyObject<StickyObjectProps, StickyObjectState> | null = null;
    private _stickyFooterRef: StickyObject<StickyObjectProps, StickyObjectState> | null = null;

    constructor(props: P, context?: any) {
        super(props, context);
        this._onVisibleIndicesChanged = this._onVisibleIndicesChanged.bind(this);
        this._onScroll = this._onScroll.bind(this);

        this.state = {
            topVisible: false,
        } as S;
    }

    public render(): JSX.Element {
        const recycler = React.cloneElement(this.props.children, {
            ref: this._getRecyclerRef,
            onVisibleIndicesChanged: this._onVisibleIndicesChanged,
            onScroll: this._onScroll,
        });
        return (
            <View style={{flex: 1}}>
                {recycler}
                {this.props.stickyHeaderIndices ? (
                    <StickyHeader ref={(stickyHeaderRef: any) => {
                    this._stickyHeaderRef = stickyHeaderRef as (StickyObject<StickyObjectProps, StickyObjectState> | null);
                }}
                              stickyIndices={this.props.stickyHeaderIndices}/>
                ) : null}
                {this.props.stickyFooterIndices ? (
                    <StickyFooter ref={(stickyFooterRef: any) => {
                    this._stickyFooterRef = stickyFooterRef as (StickyObject<StickyObjectProps, StickyObjectState> | null);
                }}
                              stickyIndices={this.props.stickyFooterIndices}/>
                ) : null}
            </View>
        );
    }

    private _getRecyclerRef = (recycler: any) => {
        //TODO Ananya: Add proxy
        this._recyclerRef = recycler as (RecyclerListView<RecyclerListViewProps, RecyclerListViewState> | null);
    }

    private _onVisibleIndicesChanged(all: number[], now: number[], notNow: number[]): void {
        //TODO Ananya: Resolve any
        if (this.props.children
                && (this.props.children as RecyclerListView<RecyclerListViewProps, RecyclerListViewState>).props
                && (this.props.children as RecyclerListView<RecyclerListViewProps, RecyclerListViewState>).props.onVisibleIndicesChanged) {
            (this.props.children as any).props.onVisibleIndicesChanged(all, now, notNow);
        }
        if (this._stickyHeaderRef) {
            this._stickyHeaderRef.onVisibleIndicesChanged(all, now, notNow, this._recyclerRef);
        }
        if (this._stickyFooterRef) {
            this._stickyFooterRef.onVisibleIndicesChanged(all, now, notNow, this._recyclerRef);
        }
    }

    private _onScroll(rawEvent: ScrollEvent, offsetX: number, offsetY: number): void {
        //TODO Ananya: Resolve any
        if (this.props.children && (this.props.children as RecyclerListView<RecyclerListViewProps, RecyclerListViewState>).props.onScroll) {
            (this.props.children as any).props.onScroll(rawEvent, offsetX, offsetY);
        }
        if (this._stickyHeaderRef) {
            this._stickyHeaderRef.onScroll(offsetY);
        }
        if (this._stickyFooterRef) {
            this._stickyFooterRef.onScroll(offsetY);
        }
    }
}
