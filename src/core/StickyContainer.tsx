/**
 * Created by ananya.chandra on 14/09/18.
 */

import * as React from "react";
import {View} from "react-native";
import RecyclerListView, {RecyclerListViewState, RecyclerListViewProps} from "./RecyclerListView";

export interface StickyContainerProps {
    children: RecyclerListView<RecyclerListViewProps, RecyclerListViewState>;
    stickyIndices?: number;
    stickyView?: JSX.Element;
}
export interface StickyContainerState {
    visible: boolean;
}
export default class StickyContainer<P extends StickyContainerProps, S extends StickyContainerState> extends React.Component<P, S> {
    constructor(props: P, context?: any) {
        super(props, context);

        this.state = {
            visible: false,
        } as S;

        const a: RecyclerListView<RecyclerListViewProps, RecyclerListViewState> = this.props.children as RecyclerListView<RecyclerListViewProps, RecyclerListViewState>;
        a._virtualRenderer.attachVisibleItemsListener(this.onVisibleIndexesChanged);

        setTimeout(() => {
            this.show();
        }, 1000);
    }

    public render(): JSX.Element {
        const value: boolean = this.state.visible;
        return (
            <View style={{flex: 1}}>
                {this.props.children}
                {value ? <View style={{height: 200, width: 300, backgroundColor: "blue", position: "absolute", top: 0}}/> : null}
            </View>
        );
    }

    public hide(): void {
        this.setState({
            visible: false,
        });
    }

    public show(): void {
        this.setState({
            visible: true,
        });
    }

    private onVisibleIndexesChanged(all: number[], now: number[], notNow: number[]): void {
        console.log("hello");
    }
}
