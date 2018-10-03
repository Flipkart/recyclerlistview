export class RAFToken {
    private _isTerminated: boolean = false;
    public terminate(): void {
        this._isTerminated = true;
    }
    public isTerminated(): boolean {
        return this._isTerminated;
    }
}
export class RAFHelper {
    public static excuteOnRAF(func: (token: RAFToken) => void, rafNesting: number): void {
        let rAFExecutable = (tokenValue: RAFToken) => {
            func(tokenValue);
            if (!tokenValue.isTerminated()) {
                rAFExecutable(tokenValue);
            }
        };
        for (let i = 0; i < rafNesting; i++) {
            const methodRef = rAFExecutable;
            rAFExecutable = (tokenValue: RAFToken) => {
                requestAnimationFrame(() => {
                    methodRef(tokenValue);
                });
            };
        }
        const token = new RAFToken();
        rAFExecutable(token);
    }
}
