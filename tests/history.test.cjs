const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function fixture(native = true, early = false) {
  // Node's EventTarget requires object options when removing capture listeners.
  // Normalize the boolean shorthand accepted by browser Window.
  class WindowEvents extends EventTarget {
    addEventListener(type, listener, options) { super.addEventListener(type, listener, typeof options === 'boolean' ? { capture: options } : options); }
    removeEventListener(type, listener, options) { super.removeEventListener(type, listener, typeof options === 'boolean' ? { capture: options } : options); }
  }
  const window = new WindowEvents();
  if (native) window.navigation = new EventTarget();
  if (early) {
    const bootstrap = {};
    vm.runInNewContext(ts.transpileModule(fs.readFileSync("src/frontend/history-bootstrap.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports: bootstrap, window });
    bootstrap.installEarlyHistoryDispatcher();
  }
  const records = [{}]; let index = 0;
  const goCalls = [];
  const history = { get state() { return records[index]; }, pushState(state) { records.splice(++index); records[index] = state; }, replaceState(state) { records[index] = state; }, go(delta) { goCalls.push(delta); }, back() {} };
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/frontend/history.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports, window, history, location: { href: 'http://qa.test/stock', pathname: '/stock', search: '' }, crypto: require('node:crypto').webcrypto, queueMicrotask });
  const pop = state => { const event = new Event('popstate'); Object.defineProperty(event, 'state', { value: state }); window.dispatchEvent(event); };
  const traverse = () => { const event = new Event('navigate', { cancelable: true }); Object.defineProperties(event, { navigationType: { value: 'traverse' }, destination: { value: { sameDocument: true } } }); window.navigation.dispatchEvent(event); return event; };
  return { window, history, records, goCalls, pop, traverse, install: exports.installHistoryGuard };
}
test('native traversal asks before draft cleanup, cancels, and does not ask twice after acceptance', () => {
  const f = fixture(); let accepted = false, confirmations = 0;
  const control = f.install(() => { confirmations++; return accepted; }, () => {});
  const initial = f.history.state; f.history.pushState({}, '', '/pos');
  assert.equal(f.traverse().defaultPrevented, true);
  assert.equal(confirmations, 1);
  assert.deepEqual(f.goCalls, []);
  accepted = true;
  assert.equal(f.traverse().defaultPrevented, false);
  assert.equal(confirmations, 2);
  f.pop(initial); // Router may have already cleaned up the draft by this point.
  assert.equal(confirmations, 2);
  control.dispose(); f.traverse();
  assert.equal(confirmations, 2, 'Disposed providers leave no native listener behind');
});
test('indexed History fallback restores a declined traversal and removes its listener', () => {
  const f = fixture(false); let confirmations = 0;
  const control = f.install(() => { confirmations++; return false; }, () => {});
  const initial = f.history.state; f.history.pushState({}, '', '/pos');
  f.pop(initial);
  assert.equal(confirmations, 1);
  assert.deepEqual(f.goCalls, [1]);
  f.pop(f.records[1]);
  assert.equal(confirmations, 1, 'Restoration never prompts a second time');
  control.dispose(); f.pop(initial);
  assert.equal(confirmations, 1);
});

test('pre-hydration fallback protects the draft even when the router registers before the provider', () => {
  const f = fixture(false, true); let dirty = true;
  f.window.addEventListener('popstate', () => { dirty = false; });
  const control = f.install(() => !dirty, () => {});
  const initial = f.history.state; f.history.pushState({}, '', '/pos');
  f.pop(initial);
  assert.equal(dirty, true, 'A declined traversal must not reach the router and unmount the form');
  assert.deepEqual(f.goCalls, [1]);
  control.dispose(); f.pop(initial);
  assert.equal(dirty, false, 'Disposed providers leave no early guard behind');
});

test('router delegates retained from a disposed provider cannot corrupt the new history indices', () => {
  const f = fixture(false); let confirmations = 0;
  const first = f.install(() => true, () => {});
  const retainedPush = f.history.pushState, retainedReplace = f.history.replaceState;
  first.dispose();
  // A framework wrapper can still hold these delegates after effect cleanup.
  f.history.pushState = (...args) => retainedPush(...args);
  f.history.replaceState = (...args) => retainedReplace(...args);
  const second = f.install(() => { confirmations++; return false; }, () => {});
  const initial = f.history.state;
  f.history.pushState({}, '', '/pos');
  f.history.replaceState({}, '', '/pos');
  assert.equal(f.history.state.__vortexHistory.index, 1);
  f.pop(initial);
  assert.equal(confirmations, 1);
  assert.deepEqual(f.goCalls, [1]);
  second.dispose();
});
