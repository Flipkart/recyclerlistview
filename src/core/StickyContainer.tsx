/**
 * Created by ananya.chandra on 14/09/18.
 */

import * as React from "react";
import * as PropTypes from "prop-types";
import {View} from "react-native";
import RecyclerListView, {RecyclerListViewState, RecyclerListViewProps} from "./RecyclerListView";
import { ScrollEvent } from "./scrollcomponent/BaseScrollView";
import StickyObject, {StickyObjectProps, StickyObjectState} from "./sticky/StickyObject";
import StickyHeader from "./sticky/StickyHeader";
import StickyFooter from "./sticky/StickyFooter";
import CustomError from "./exceptions/CustomError";
import RecyclerListViewExceptions from "./exceptions/RecyclerListViewExceptions";

export interface StickyContainerProps {
    children: RecyclerChild;
    stickyHeaderIndices: number[];
    stickyFooterIndices: number[];
}
export interface StickyContainerState {
    topVisible: boolean;
}
export interface RecyclerChild extends React.ReactElement<RecyclerListViewProps> {
    ref: (recyclerRef: any) => {};
    props: RecyclerListViewProps;
}
export default class StickyContainer<P extends StickyContainerProps, S extends StickyContainerState> extends React.Component<P, S> {
    public static propTypes = {};
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
        //TODO Ananya: Throw exception if more than one child and if not instance of RLV
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
        this._recyclerRef = recycler as (RecyclerListView<RecyclerListViewProps, RecyclerListViewState> | null);
        if (this.props.children.ref && typeof this.props.children.ref === "function") {
            (this.props.children).ref(recycler);
        } else {
            throw new CustomError(RecyclerListViewExceptions.refNotAsFunctionException);
        }
    }

    private _onVisibleIndicesChanged(all: number[], now: number[], notNow: number[]): void {
        if (this.props.children && this.props.children.props && this.props.children.props.onVisibleIndicesChanged) {
            this.props.children.props.onVisibleIndicesChanged(all, now, notNow);
        }
        if (this._stickyHeaderRef) {
            this._stickyHeaderRef.onVisibleIndicesChanged(all, now, notNow, this._recyclerRef);
        }
        if (this._stickyFooterRef) {
            this._stickyFooterRef.onVisibleIndicesChanged(all, now, notNow, this._recyclerRef);
        }
    }

    private _onScroll(rawEvent: ScrollEvent, offsetX: number, offsetY: number): void {
        if (this.props.children && this.props.children.props.onScroll) {
            (this.props.children as any).props.onScroll(rawEvent, offsetX, offsetY);
        }
        if (this._stickyHeaderRef) {
            this._stickyHeaderRef.onScroll(offsetY);
        }
        if (this._stickyFooterRef) {
            this._stickyFooterRef.onScroll(offsetY);
        }
    }

    // private assertChildType() {
    //
    // }
}

StickyContainer.propTypes = {

    // Provide an array of indices whose corresponding items need to be stuck to the top of the recyclerView once the items scroll off the top.
    // Every subsequent sticky index view will push the previous sticky view off the top to take its place.
    // Note: Array indices need to be in ascending sort order.
    stickyHeaderIndices: PropTypes.arrayOf(PropTypes.number),

    // Works same as sticky headers, but for views to be stuck at the bottom of the recyclerView.
    // Note: Array indices need to be in ascending sort order.
    stickyFooterIndices: PropTypes.arrayOf(PropTypes.number),
};
