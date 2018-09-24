/**
 * Created by ananya.chandra on 20/09/18.
 */

import * as React from "react";
import {Animated, View} from "react-native";

export interface StickyHeaderProps {
    _rowRenderer: ((type: string | number, data: any, index: number) => JSX.Element | JSX.Element[] | null) | null;
}
export interface StickyHeaderState {
    a: number;
}
export default class StickyHeader<P extends StickyHeaderProps, S extends StickyHeaderState> extends React.Component {
    constructor(props: P, context?: any) {
        super(props, context);
    }
    public render(): JSX.Element {
        return (
            <View/>
        );
    }
}
