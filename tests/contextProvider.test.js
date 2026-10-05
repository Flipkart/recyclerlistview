const assert = require("assert");
const { ContextProvider, DataProvider, LayoutProvider, RecyclerListView } = require("../web");

class MemoryContext extends ContextProvider {
    constructor(values) {
        super();
        this.values = { ...values };
        this.removed = [];
    }
    getUniqueKey() { return "list"; }
    get(key) { return this.values[key]; }
    save(key, value) { this.values[key] = value; }
    remove(key) {
        this.removed.push(key);
        delete this.values[key];
    }
}

const cachedLayouts = Array.from({ length: 80 }, (_, index) => ({
    x: 0, y: index * 60, width: 300, height: 60, type: 0, isOverridden: true,
}));
const layoutContext = JSON.stringify({ layoutArray: cachedLayouts });

function createList(contextProvider, options = {}) {
    const dataProvider = new DataProvider((a, b) => a !== b).cloneWithRows(Array.from({ length: 80 }, (_, i) => i));
    const layoutProvider = new LayoutProvider(() => 0, (_type, size) => {
        size.width = options.isHorizontal ? 40 : 300;
        size.height = options.isHorizontal ? 200 : 40;
    });
    return new RecyclerListView({
        ...RecyclerListView.defaultProps,
        contextProvider, dataProvider, layoutProvider, rowRenderer: () => null,
        ...options,
    });
}

const tests = [];
function test(name, run) { tests.push({ name, run }); }

test("discarded construction neither consumes context nor reports recreation", () => {
    const context = new MemoryContext({ list_offset: 800, list_layouts: layoutContext });
    let calls = 0;
    createList(context, { forceNonDeterministicRendering: true, onRecreate: () => calls++ });
    assert.strictEqual(context.get("list_offset"), 800);
    assert.strictEqual(context.get("list_layouts"), layoutContext);
    assert.strictEqual(calls, 0);
    assert.deepStrictEqual(context.removed, []);
});

test("a committed instance consumes context and reports recreation once", () => {
    const context = new MemoryContext({ list_offset: 800 });
    const calls = [];
    createList(context); // A discarded render before the committed instance.
    const list = createList(context, { onRecreate: value => calls.push(value) });
    list.componentDidMount();
    assert.deepStrictEqual(calls, [{ lastOffset: 800 }]);
    assert.strictEqual(context.get("list_offset"), undefined);
    list.componentDidMount();
    assert.deepStrictEqual(calls, [{ lastOffset: 800 }]);
});

test("mount replay before layout retains both saved offset and cached layouts", () => {
    const context = new MemoryContext({ list_offset: 800, list_layouts: layoutContext });
    const calls = [];
    const list = createList(context, { forceNonDeterministicRendering: true, onRecreate: value => calls.push(value) });
    list.componentDidMount();
    list.componentWillUnmount();
    assert.strictEqual(context.get("list_offset"), 800);
    assert.deepStrictEqual(JSON.parse(context.get("list_layouts")), { layoutArray: cachedLayouts });
    list.componentDidMount();
    assert.strictEqual(context.get("list_offset"), undefined);
    assert.strictEqual(context.get("list_layouts"), undefined);
    assert.deepStrictEqual(calls, [{ lastOffset: 800 }]);
});

test("onRecreate can inspect context before it is consumed", () => {
    const context = new MemoryContext({ list_offset: 800 });
    let value;
    const list = createList(context, { onRecreate: () => { value = context.get("list_offset"); } });
    list.componentDidMount();
    assert.strictEqual(value, 800);
    assert.strictEqual(context.get("list_offset"), undefined);
});

for (const isHorizontal of [false, true]) {
    test(`mount replay retains a pending ${isHorizontal ? "horizontal" : "vertical"} offset`, () => {
        const context = new MemoryContext({ list_offset: 800 });
        const list = createList(context, { isHorizontal, layoutSize: { width: 300, height: 200 } });
        list.componentDidMount();
        list.componentWillUnmount();
        assert.strictEqual(context.get("list_offset"), 800);
        list.componentDidMount();
        assert.strictEqual(context.get("list_offset"), undefined);
    });
}

test("a pending initial index is saved at its resolved offset", () => {
    const context = new MemoryContext({ list_offset: 800 });
    const list = createList(context, { initialRenderIndex: 5, layoutSize: { width: 300, height: 200 } });
    list.componentDidMount();
    list.componentWillUnmount();
    assert.strictEqual(context.get("list_offset"), 200);
});

test("cached item measurements remain available to the committed constructor", () => {
    const context = new MemoryContext({ list_offset: 800, list_layouts: layoutContext });
    const options = { forceNonDeterministicRendering: true, layoutSize: { width: 300, height: 200 } };
    createList(context, options);
    const list = createList(context, options);
    assert.strictEqual(list.getLayout(0).height, 60);
    list.componentDidMount();
    assert.strictEqual(context.get("list_layouts"), undefined);
});

for (const offset of [0, -1, "800"]) {
    test(`does not consume an unrestorable offset ${JSON.stringify(offset)}`, () => {
        const context = new MemoryContext({ list_offset: offset });
        let calls = 0;
        const list = createList(context, { onRecreate: () => calls++ });
        list.componentDidMount();
        assert.strictEqual(context.get("list_offset"), offset);
        assert.strictEqual(calls, 0);
        assert.deepStrictEqual(context.removed, []);
    });
}

test("preserves an actual zero after the initial scroll is no longer pending", async () => {
    const context = new MemoryContext({ list_offset: 800 });
    const list = createList(context, { layoutSize: { width: 300, height: 200 } });
    list.componentDidMount();
    await new Promise(resolve => setTimeout(resolve, 10));
    assert.strictEqual(list.getCurrentScrollOffset(), 0);
    list.componentWillUnmount();
    assert.strictEqual(context.get("list_offset"), 0);
});

test("works without a context provider", () => {
    const list = createList(undefined);
    list.componentDidMount();
    list.componentWillUnmount();
});

(async () => {
    let failed = 0;
    for (const { name, run } of tests) {
        try { await run(); console.log(`PASS ${name}`); }
        catch (error) { failed++; console.error(`FAIL ${name}\n${error.stack}`); }
    }
    console.log(`${tests.length - failed} passed, ${failed} failed`);
    if (failed) { process.exitCode = 1; }
})();
