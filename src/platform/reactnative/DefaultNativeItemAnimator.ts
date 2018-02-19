import ItemAnimator from "../../core/ItemAnimator";
import { LayoutAnimation, Platform, UIManager } from "react-native";

export default class DefaultNativeItemAnimator implements ItemAnimator {
    public shouldAnimateOnce: boolean = true;
    private hasAnimatedOnce: boolean = false;
    constructor() {
        if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
            UIManager.setLayoutAnimationEnabledExperimental(true);
        }
    }
    public animateWillMount(atX: number, atY: number, itemIndex: number): void {
        //no need
    }
    public animateDidMount(atX: number, atY: number, itemRef: object, itemIndex: number): void {
        //no need
    }

    public animateWillUpdate(fromX: number, fromY: number, toX: number, toY: number, itemRef: object, itemIndex: number): void {
        //no need
    }

    public animateShift(fromX: number, fromY: number, toX: number, toY: number, itemRef: object, itemIndex: number): void {
        if (fromX !== toX || fromY !== toY) {
            if (!this.shouldAnimateOnce || this.shouldAnimateOnce && !this.hasAnimatedOnce) {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                this.hasAnimatedOnce = true;
            }
        }
    }

    public animateWillUnmount(atX: number, atY: number, itemRef: object, itemIndex: number): void {
        //no need
    }
}
