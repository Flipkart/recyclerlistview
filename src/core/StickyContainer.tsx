/**
 * Created by ananya.chandra on 14/09/18.
 */

import * as React from "react";
import {ToastAndroid, View, Animated} from "react-native";
import RecyclerListView, {RecyclerListViewState, RecyclerListViewProps} from "./RecyclerListView";

export interface StickyContainerProps {
    children: RecyclerListView<RecyclerListViewProps, RecyclerListViewState>;
    topStickyIndices: number;
    bottomStickyIndices: number;
    stickyView?: JSX.Element;
}
export interface StickyContainerState {
    topVisible: boolean;
    bottomVisible: boolean;
}
export default class StickyContainer<P extends StickyContainerProps, S extends StickyContainerState> extends React.Component<P, S> {
    private rowRenderer: (type: string | number, data: any, index: number) => JSX.Element | JSX.Element[] | null;

    constructor(props: P, context?: any) {
        super(props, context);
        this.onVisibleIndexesChanged = this.onVisibleIndexesChanged.bind(this);
        const recycler: RecyclerListView<RecyclerListViewProps, RecyclerListViewState> = this.props.children;
        this.rowRenderer = recycler.props.rowRenderer;

        this.state = {
            topVisible: false,
            bottomVisible: !!this.props.bottomStickyIndices,
        } as S;
    }

    public render(): JSX.Element {
        return (
            <View style={{flex: 1}}>
                <RecyclerListView
                    {...this.props.children.props}
                    onVisibleIndexesChanged={this.onVisibleIndexesChanged}
                />
                {this.state.topVisible ?
                    <View style={{position: "absolute", top: 0}}>
                        {this.rowRenderer(this.props.topStickyIndices, null, 0)}
                    </View> : null}
                {this.state.bottomVisible ?
                    <View style={{position: "absolute", bottom: 0}}>
                        {this.rowRenderer(this.props.bottomStickyIndices, null, 0)}
                    </View> : null}
                {/*{value ? <View style={{height: 200, width: 300, backgroundColor: "blue", position: "absolute", top: 0}}/> : null}*/}
            </View>
        );
    }

    public bottomStickyViewVisible(visible: boolean): void {
        this.setState({
            bottomVisible: visible,
        });
    }

    public topStickyViewVisible(visible: boolean): void {
        this.setState({
            topVisible: visible,
        });
    }

    private onVisibleIndexesChanged(all: number[], now: number[], notNow: number[]): void {
        if (this.props.topStickyIndices) {
            if (all.indexOf(this.props.topStickyIndices) >= 0 && all.indexOf(this.props.topStickyIndices - 1) === -1) {
                this.topStickyViewVisible(true);
            } else if (all.indexOf(this.props.topStickyIndices) >= 0 && all.indexOf(this.props.topStickyIndices - 1) >= 0) {
                this.topStickyViewVisible(false);
            }
        }
        if (this.props.bottomStickyIndices) {
            if (all.indexOf(this.props.bottomStickyIndices) >= 0 && all.indexOf(this.props.bottomStickyIndices + 1) === -1) {
                this.bottomStickyViewVisible(true);
            } else if (all.indexOf(this.props.bottomStickyIndices) >= 0 && all.indexOf(this.props.bottomStickyIndices + 1) >= 0) {
                this.bottomStickyViewVisible(false);
            }
        }
    }
}
