import * as React from "react";

export abstract class ComponentCompat<T1 = {}, T2 = {}, SS = any> extends React.Component<T1, T2, SS> {
    private _hasRenderedOnce: boolean = false;
    private _didPropsChange: boolean = false;

    constructor(props: T1, context?: any) {
        super(props, context);
    }

    public shouldComponentUpdate(newProps: T1, newState: T2): boolean {
        if (this.props !== newProps) {
            this.componentWillReceivePropsCompat(newProps);
        }
        return true;
    }

    public componentWillReceivePropsCompat(newProps: T1): void {
        //no op
    }

    public componentWillMountCompat(): void {
        //no op
    }

    public render(): React.ReactNode {
        if (!this._hasRenderedOnce) {
            this._hasRenderedOnce = true;
            this.componentWillMountCompat();
        }
        return this.renderCompat();
    }

    public abstract renderCompat(): React.ReactNode;
}
