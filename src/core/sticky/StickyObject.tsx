/**
 * Created by ananya.chandra on 20/09/18.
 */

import * as React from "react";
import {Animated, StyleProp, ViewStyle} from "react-native";
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
export default abstract class StickyObject<P extends StickyObjectProps, S extends StickyObjectState> extends React.Component<P, S> {
    protected stickyType: StickyType = StickyType.HEADER;
    protected stickyTypeMultiplier: number = 1;
    protected initialVisibility: boolean = false;
    protected containerPosition: StyleProp<ViewStyle>;
    private _stickyViewOffset: Animated.Value = new Animated.Value(0);
    private _currentIndice: number = 0;

    constructor(props: P, context?: any) {
        super(props, context);
        this.setStickyType();
        this.state = {
            visible: this.initialVisibility,
            tentativeSliding: false,
        } as S;
    }

    public render(): JSX.Element | null {
        return (
            <Animated.View style={[
                {position: "absolute", transform: [{translateY: this._stickyViewOffset}]}, this.containerPosition]}>
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
            if (all.indexOf(stickyHeaderIndice) >= 0 && all.indexOf(stickyHeaderIndice - this.stickyTypeMultiplier) === -1) {
                this.stickyViewVisible(true);
            } else if (all.indexOf(stickyHeaderIndice) >= 0 && all.indexOf(stickyHeaderIndice - this.stickyTypeMultiplier) >= 0) {
                this.stickyViewVisible(false);
            }
        }
    }

    public onScroll(offsetY: number): void {
        if (this.props.recyclerRef) {
            const currentStickyIndice = this.props.stickyIndices[this._currentIndice];
            const previousStickyIndice = this.props.stickyIndices[this._currentIndice - this.stickyTypeMultiplier];
            const nextStickyIndice = this.props.stickyIndices[this._currentIndice + this.stickyTypeMultiplier];
            if (previousStickyIndice || this.state.tentativeSliding) {
                const previousLayout: Layout | undefined = this.props.recyclerRef.getLayout(previousStickyIndice);
                const previousHeight: number | null = previousLayout ? previousLayout.height : null;
                const currentLayout: Layout | undefined = this.props.recyclerRef.getLayout(currentStickyIndice);
                const currentY: number | null = currentLayout ? currentLayout.y : null;
                const currentHeight: number | null = currentLayout ? currentLayout.height : null;

                if (currentY && currentHeight) {
                    let currentYd: number;
                    let screenHeight: number | null;
                    let scrollY: number | null;
                    if (this.stickyType === StickyType.HEADER) {
                        currentYd = currentY;
                        scrollY = offsetY;
                    } else {
                        currentYd = -1 * (currentY + currentHeight);
                        screenHeight = this.props.recyclerRef.getScrollableHeight();
                        scrollY = screenHeight ? -1 * (offsetY + screenHeight) : null;
                    }
                    if (previousHeight && scrollY && scrollY < currentYd) {
                        if (scrollY > currentYd - previousHeight) {
                            this._currentIndice -= this.stickyTypeMultiplier;
                            const translate = (scrollY - currentYd + previousHeight) * (-1 * this.stickyTypeMultiplier);
                            this._stickyViewOffset.setValue(translate);
                            this.stickyViewVisible(true, true);
                        }
                    }
                }
            }
            if (nextStickyIndice) {
                const nextLayout: Layout | undefined = this.props.recyclerRef.getLayout(nextStickyIndice);
                const nextY: number | null = nextLayout ? nextLayout.y : null;
                const nextHeight: number | null = nextLayout ? nextLayout.height : null;
                const currentLayout: Layout | undefined = this.props.recyclerRef.getLayout(currentStickyIndice);
                const currentHeight: number | null = currentLayout ? currentLayout.height : null;

                if (nextY && nextHeight) {
                    let nextYd: number;
                    let screenHeight: number | null;
                    let scrollY: number | null;
                    if (this.stickyType === StickyType.HEADER) {
                        nextYd = nextY;
                        scrollY = offsetY;
                    } else {
                        nextYd = -1 * (nextY + nextHeight);
                        screenHeight = this.props.recyclerRef.getScrollableHeight();
                        scrollY = screenHeight ? -1 * (offsetY + screenHeight) : null;
                    }
                    if (currentHeight && nextYd && scrollY && scrollY + currentHeight > nextYd) {
                        if (scrollY <= nextYd) {
                            const translate = (scrollY - nextYd + currentHeight) * (-1 * this.stickyTypeMultiplier);
                            this._stickyViewOffset.setValue(translate);
                        } else if (scrollY > nextYd) {
                            this._currentIndice += this.stickyTypeMultiplier;
                            this._stickyViewOffset.setValue(0);
                            this.stickyViewVisible(true);
                        }
                    }
                }
            }
        }
    }

    protected abstract setStickyType(): void;

    private stickyViewVisible(_visible: boolean, _tentativeSliding?: boolean): void {
        this.setState({
            visible: _visible,
            tentativeSliding: _tentativeSliding ? _tentativeSliding : false,
        });
    }
}
