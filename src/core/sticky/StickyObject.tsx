/**
 * Created by ananya.chandra on 20/09/18.
 */

import * as React from "react";
import {Animated, View} from "react-native";
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
    tentativeSliding: boolean;
}
export default class StickyObject<P extends StickyObjectProps, S extends StickyObjectState> extends React.Component<P, S> {
    private _topStickyViewOffset: Animated.Value = new Animated.Value(0);
    private _currentIndice: number = 0;
    private _stickyType: StickyType = StickyType.HEADER;
    private _stickyTypeMultiplier: number = 1;

    constructor(props: P, context?: any) {
        super(props, context);
        this._setStickyType(context as StickyType);
        this.state = {
            visible: this._stickyType === StickyType.FOOTER,
            tentativeSliding: false,
        } as S;
    }

    public render(): JSX.Element | null {
        return (
            <Animated.View style={[
                {position: "absolute", transform: [{translateY: this._topStickyViewOffset}]},
                this._stickyType === StickyType.HEADER ? {top: 0} : {bottom: 0}]}>
                {this.state.visible ?
                    this.props.rowRenderer ? this.props.rowRenderer(this.props.stickyIndices[this._currentIndice], null, 0) : null
                    : null}
            </Animated.View>
        );
    }

    public onVisibleIndicesChanged(all: number[], now: number[], notNow: number[]): void {
        //TODO Ananya: Use hashmaps
        if (this.props.stickyIndices) {
            const stickyHeaderIndice: number = this.props.stickyIndices[this._currentIndice];
            if (all.indexOf(stickyHeaderIndice) >= 0 && all.indexOf(stickyHeaderIndice - this._stickyTypeMultiplier) === -1) {
                this.stickyViewVisible(true);
            } else if (all.indexOf(stickyHeaderIndice) >= 0 && all.indexOf(stickyHeaderIndice - this._stickyTypeMultiplier) >= 0) {
                this.stickyViewVisible(false);
            }
        }
    }

    public onScroll(offsetY: number): void {
        if (this.props.recyclerRef) {
            const currentStickyHeaderIndice = this.props.stickyIndices[this._currentIndice];
            const previousStickyHeaderIndice = this.props.stickyIndices[this._currentIndice - 1];
            const nextStickyHeaderIndice = this.props.stickyIndices[this._currentIndice + 1];
            if (previousStickyHeaderIndice || this.state.tentativeSliding) {
                const previousLayout: Layout | undefined = this.props.recyclerRef.getLayout(previousStickyHeaderIndice);
                const previousHeight: number | null = previousLayout ? previousLayout.height : null;
                const currentLayout: Layout | undefined = this.props.recyclerRef.getLayout(currentStickyHeaderIndice);
                const currentY: number | null = currentLayout ? currentLayout.y : null;
                if (currentY && previousHeight && offsetY < currentY) {
                    if (offsetY > currentY - previousHeight) {
                        this._currentIndice -= 1;
                        const y = offsetY + previousHeight - currentY;
                        this._topStickyViewOffset.setValue(-1 * y);
                        this.stickyViewVisible(true, true);
                    }
                }
            }
            if (nextStickyHeaderIndice) {
                const nextLayout: Layout | undefined = this.props.recyclerRef.getLayout(nextStickyHeaderIndice);
                const nextY: number | null = nextLayout ? nextLayout.y : null;
                const currentLayout: Layout | undefined = this.props.recyclerRef.getLayout(currentStickyHeaderIndice);
                const currentHeight: number | null = currentLayout ? currentLayout.height : null;
                if (nextY && currentHeight && offsetY > nextY - currentHeight) {
                    if (offsetY <= nextY) {
                        const y = offsetY + currentHeight - nextY;
                        this._topStickyViewOffset.setValue(-1 * y);
                    }
                    if (offsetY > nextY) {
                        this._currentIndice += 1;
                        this._topStickyViewOffset.setValue(0);
                        this.stickyViewVisible(true);
                    }
                }
            }
        }
    }

    protected _setStickyType(stickyType: StickyType): void {
        this._stickyType = stickyType;
        switch (stickyType) {
            case StickyType.HEADER:
                this._stickyTypeMultiplier = 1;
                break;
            case StickyType.FOOTER:
                this._stickyTypeMultiplier = -1;
                break;
        }
    }

    private stickyViewVisible(_visible: boolean, _tentativeSliding?: boolean): void {
        this.setState({
            visible: _visible,
            tentativeSliding: _tentativeSliding ? _tentativeSliding : false,
        });
    }
}
