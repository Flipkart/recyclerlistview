export interface Scrollable {
    scrollToOffset(x: number, y: number, animate: boolean): void;
}
export class AutoScroll {
    public static scrollNow(scrollable: Scrollable, fromX: number, fromY: number, toX: number, toY: number, speedMultiplier: number = 1): Promise<void> {
        return new Promise((resolve) => {
            scrollable.scrollToOffset(fromX, fromY, false);
            const incrementPerMs = 0.1 * speedMultiplier;
            let startTime = Date.now();
            let startX = fromX;
            let startY = fromY;
            const animationLoop = () => {
                requestAnimationFrame(() => {
                    const currentTime = Date.now();
                    const timeElapsed = currentTime - startTime;
                    const distanceToCover = incrementPerMs * timeElapsed;
                    startX += distanceToCover;
                    startY += distanceToCover;
                    scrollable.scrollToOffset(Math.min(toX, startX), Math.min(toY, startY), false);
                    startTime = currentTime;
                    if (Math.min(toX, startX) !== toX || Math.min(toY, startY) !== toY) {
                        animationLoop();
                        return;
                    }
                    resolve();
                });
            };
            animationLoop();
        });
    }
}
