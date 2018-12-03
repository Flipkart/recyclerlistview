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
    stickyHeaderIndices: number[] | undefined; //TODO Ananya: make optional
    stickyFooterIndices: number[] | undefined; //TODO Ananya: make optional
    overrideRowRenderer?: (type: string | number | undefined, data: any, index: number, extendedState?: object) => JSX.Element | JSX.Element[] | null;
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

    public componentWillReceiveProps(newProps: StickyContainerProps): void {
        if (this._stickyHeaderRef) {
            this._stickyHeaderRef.computeLayouts(newProps.stickyHeaderIndices);
        }
        if (this._stickyFooterRef) {
            this._stickyFooterRef.computeLayouts(newProps.stickyFooterIndices);
        }
    }

    public render(): JSX.Element {
        console.log("VisibleIndices", "Container Render", this.props.stickyFooterIndices);  //tslint:disable-line
        this._assertChildType();
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
                                  stickyIndices={this.props.stickyHeaderIndices}
                                  overrideRowRenderer={this.props.overrideRowRenderer}/>
                ) : null}
                {this.props.stickyFooterIndices ? (
                    <StickyFooter ref={(stickyFooterRef: any) => {
                        this._stickyFooterRef = stickyFooterRef as (StickyObject<StickyObjectProps, StickyObjectState> | null);
                    }}
                                  stickyIndices={this.props.stickyFooterIndices}
                                  overrideRowRenderer={this.props.overrideRowRenderer}/>
                ) : null}
            </View>
        );
    }

    private _getRecyclerRef = (recycler: any) => {
        this._recyclerRef = recycler as (RecyclerListView<RecyclerListViewProps, RecyclerListViewState> | null);
        if (this.props.children.ref) {
            if (typeof this.props.children.ref === "function") {
                (this.props.children).ref(recycler);
            } else {
                throw new CustomError(RecyclerListViewExceptions.refNotAsFunctionException);
            }
        }
    }

    private _onVisibleIndicesChanged(all: number[], now: number[], notNow: number[]): void {
        console.log("VisibleIndices", 1);  //tslint:disable-line
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

    private _assertChildType(): void {
        if (React.Children.count(this.props.children) !== 1 || !this._isChildRecyclerInstance()) {
            throw new CustomError(RecyclerListViewExceptions.wrongStickyChildTypeException);
        }
    }

    private _isChildRecyclerInstance(): boolean {
        return (
            this.props.children.props.dataProvider
            && this.props.children.props.rowRenderer
            && this.props.children.props.layoutProvider
        );
    }
}

StickyContainer.propTypes = {

    // Mandatory to pass a single child of RecyclerListView or any of its children classes. Exception will be thrown otherwise.
    children: PropTypes.element.isRequired,

    // Provide an array of indices whose corresponding items need to be stuck to the top of the recyclerView once the items scroll off the top.
    // Every subsequent sticky index view will push the previous sticky view off the top to take its place.
    // Note: Array indices need to be in ascending sort order.
    stickyHeaderIndices: PropTypes.arrayOf(PropTypes.number),

    // Works same as sticky headers, but for views to be stuck at the bottom of the recyclerView.
    // Note: Array indices need to be in ascending sort order.
    stickyFooterIndices: PropTypes.arrayOf(PropTypes.number),
};
