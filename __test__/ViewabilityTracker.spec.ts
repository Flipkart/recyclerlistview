import ViewabilityTracker from "../src/core/ViewabilityTracker";

const VT = new ViewabilityTracker(0, 0);
VT.setLayouts([{ x: 0, y: 0, width: 100, height: 100, type: 0}], 100);

test("adds 1 + 2 to equal 3", () => {
    expect(VT.getLastActualOffset()).toBe(0);
});
