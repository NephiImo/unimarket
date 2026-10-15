import assert from 'node:assert/strict';
import test from 'node:test';
import * as jsxRuntime from 'react/jsx-runtime';
import { loadModule } from './helpers/load-typescript.mjs';

const validation = loadModule('app/lib/inquiries/validation.ts');
const chatProps = { inquiryId: 'inquiry-a', currentUserId: 'buyer' };
const row = (id, message, inquiryId = 'inquiry-a', senderId = 'buyer') => ({
  id,
  inquiry_id: inquiryId,
  sender_id: senderId,
  sender_name: 'Seller',
  message,
  created_at: '2026-10-15T12:00:00Z',
});

// A small hook/effect renderer exercises the real components without a browser
// or new dependencies. It batches updates until flush(), preserves keyed state,
// runs effect cleanups, and records any state updates after unmount.
function hookRenderer() {
  const instances = new Map();
  let active;
  let pendingEffects = [];
  let dirty = false;
  let mounted = true;
  let Component;
  let props;
  let tree;
  let lateUpdates = 0;
  const hooks = {
    useState(initial) {
      const instance = active;
      const index = instance.cursor++;
      if (!instance.hooks[index]) {
        const slot = {
          value: typeof initial === 'function' ? initial() : initial,
        };
        slot.set = (update) => {
          if (!instance.alive) {
            lateUpdates++;
            return;
          }
          const next =
            typeof update === 'function' ? update(slot.value) : update;
          if (!Object.is(next, slot.value)) {
            slot.value = next;
            dirty = true;
          }
        };
        instance.hooks[index] = slot;
      }
      const slot = instance.hooks[index];
      return [slot.value, slot.set];
    },
    useRef(initial) {
      const index = active.cursor++;
      active.hooks[index] ??= { current: initial };
      return active.hooks[index];
    },
    useEffect(effect, deps) {
      const index = active.cursor++;
      const slot = (active.hooks[index] ??= {});
      if (
        !slot.deps ||
        deps.some((value, i) => !Object.is(value, slot.deps[i]))
      ) {
        slot.deps = deps;
        pendingEffects.push({ instance: active, slot, effect });
      }
    },
  };
  function cleanup(instance) {
    instance.alive = false;
    for (const slot of instance.hooks) slot.cleanup?.();
  }
  function render() {
    const visited = new Set();
    function visit(element, path) {
      if (Array.isArray(element))
        return element.map((child, i) => visit(child, `${path}/${i}`));
      if (!element || typeof element !== 'object') return element;
      if (typeof element.type === 'function') {
        const key = `${path}/${element.type.name}:${element.key ?? ''}`;
        const instance = instances.get(key) ?? { hooks: [], alive: true };
        instances.set(key, instance);
        visited.add(key);
        instance.cursor = 0;
        active = instance;
        const result = element.type(element.props);
        active = null;
        return visit(result, key);
      }
      return {
        ...element,
        props: {
          ...element.props,
          children: visit(element.props.children, path),
        },
      };
    }
    tree = visit({ type: Component, props }, 'root');
    for (const [key, instance] of instances) {
      if (!visited.has(key)) {
        cleanup(instance);
        instances.delete(key);
      }
    }
    const effects = pendingEffects;
    pendingEffects = [];
    for (const { instance, slot, effect } of effects) {
      if (instance.alive) {
        slot.cleanup?.();
        slot.cleanup = effect();
      }
    }
  }
  return {
    hooks,
    mount(component, initialProps) {
      Component = component;
      props = initialProps;
      render();
    },
    update(nextProps) {
      props = nextProps;
      dirty = true;
      this.flush();
    },
    flush() {
      while (mounted && dirty) {
        dirty = false;
        render();
      }
    },
    unmount() {
      for (const instance of instances.values()) cleanup(instance);
      instances.clear();
      mounted = false;
    },
    get tree() {
      return tree;
    },
    get lateUpdates() {
      return lateUpdates;
    },
  };
}

function nodes(element, predicate) {
  if (Array.isArray(element))
    return element.flatMap((child) => nodes(child, predicate));
  if (!element || typeof element !== 'object') return [];
  return [
    ...(predicate(element) ? [element] : []),
    ...nodes(element.props?.children, predicate),
  ];
}
function text(element) {
  if (Array.isArray(element)) return element.map(text).join(' ');
  if (!element || typeof element === 'boolean') return '';
  if (typeof element !== 'object') return String(element);
  return text(element.props?.children);
}

function client(
  t,
  componentPath = 'components/InquiryChat.tsx',
  initialProps = chatProps
) {
  const original = {
    fetch: globalThis.fetch,
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
    document: Object.getOwnPropertyDescriptor(globalThis, 'document'),
  };
  const listeners = new Set();
  const timers = new Map();
  const requests = [];
  let timerId = 0;
  const renderer = hookRenderer();
  const document = {
    visibilityState: 'visible',
    addEventListener(name, listener) {
      assert.equal(name, 'visibilitychange');
      listeners.add(listener);
    },
    removeEventListener(name, listener) {
      assert.equal(name, 'visibilitychange');
      listeners.delete(listener);
    },
  };
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: document,
  });
  globalThis.setTimeout = (callback, delay) => {
    timers.set(++timerId, { callback, delay });
    return timerId;
  };
  globalThis.clearTimeout = (id) => timers.delete(id);
  // Deliberately allow aborted requests to resolve late: identity guards must
  // protect state even if the response/body was already on its way.
  globalThis.fetch = (url, options = {}) =>
    new Promise((resolve, reject) =>
      requests.push({ url, options, resolve, reject })
    );
  t.after(() => {
    renderer.unmount();
    globalThis.fetch = original.fetch;
    globalThis.setTimeout = original.setTimeout;
    globalThis.clearTimeout = original.clearTimeout;
    if (original.document)
      Object.defineProperty(globalThis, 'document', original.document);
    else delete globalThis.document;
  });
  const Component = loadModule(componentPath, {
    react: renderer.hooks,
    'react/jsx-runtime': jsxRuntime,
    '@/app/lib/inquiries/validation': validation,
  }).default;
  renderer.mount(Component, initialProps);
  const find = (type) =>
    nodes(renderer.tree, (element) => element.type === type)[0];
  async function settle() {
    for (let i = 0; i < 8; i++) await Promise.resolve();
    renderer.flush();
  }
  return {
    renderer,
    requests,
    timers,
    listeners,
    find,
    settle,
    open(value = true) {
      find('details').props.onToggle({ currentTarget: { open: value } });
      renderer.flush();
    },
    visibility(value) {
      document.visibilityState = value;
      for (const listener of listeners) listener();
      renderer.flush();
    },
    type(value) {
      find('textarea').props.onChange({ target: { value } });
      renderer.flush();
    },
    submit() {
      return find('form').props.onSubmit({ preventDefault() {} });
    },
    tick() {
      const entry = timers.entries().next().value;
      assert.ok(entry, 'a poll must be scheduled');
      timers.delete(entry[0]);
      entry[1].callback();
      renderer.flush();
    },
    async respond(request, data, status = 200) {
      request.resolve({
        ok: status >= 200 && status < 300,
        status,
        json: async () => data,
      });
      await settle();
    },
    get content() {
      return text(renderer.tree);
    },
  };
}

test('chat polls only an opened visible conversation, every 12s without overlap', async (t) => {
  const ui = client(t);
  assert.equal(ui.find('details').props.open, false);
  assert.equal(ui.requests.length, 0);
  ui.visibility('hidden');
  ui.open();
  assert.equal(ui.requests.length, 0);
  ui.visibility('visible');
  ui.visibility('visible');
  assert.equal(ui.requests.length, 1);
  assert.equal(ui.timers.size, 0);
  await ui.respond(ui.requests[0], []);
  assert.equal([...ui.timers.values()][0].delay, 12000);
  ui.tick();
  assert.equal(ui.requests.length, 2);
  assert.equal(ui.timers.size, 0);
  ui.visibility('hidden');
  assert.equal(ui.requests[1].options.signal.aborted, true);
  await ui.respond(ui.requests[1], [row('stale', 'Hidden stale message')]);
  ui.visibility('visible');
  await ui.respond(ui.requests[2], [row('current', 'Visible message')]);
  assert.match(ui.content, /Visible message/);
  assert.doesNotMatch(ui.content, /Hidden stale message/);
  const log = nodes(
    ui.renderer.tree,
    (element) => element.props.role === 'log'
  )[0];
  assert.equal(log.props['aria-live'], 'polite');
  ui.open(false);
  assert.equal(ui.timers.size, 0);
  assert.equal(ui.listeners.size, 0);
});

test('late polling cannot overwrite a successful POST, even when abort is ignored', async (t) => {
  const ui = client(t);
  ui.open();
  await ui.respond(ui.requests[0], [
    row('old', 'Earlier reply', 'inquiry-a', 'seller'),
  ]);
  ui.tick();
  const stalePoll = ui.requests[1];
  ui.type('New buyer message');
  const submitted = ui.submit();
  assert.equal(stalePoll.options.signal.aborted, true);
  assert.equal(ui.requests[2].options.method, 'POST');
  assert.equal(ui.timers.size, 0);
  await ui.respond(ui.requests[2], row('new', 'New buyer message'), 201);
  await submitted;
  await ui.respond(stalePoll, [
    row('old', 'Earlier reply', 'inquiry-a', 'seller'),
  ]);
  assert.match(ui.content, /New buyer message/);
  assert.match(ui.content, /Earlier reply/);
  assert.match(ui.content, /You/);
  assert.match(ui.content, /Seller/);
  assert.equal(
    ui.requests.length,
    3,
    'POST appends its saved row without a competing refresh'
  );
  assert.equal([...ui.timers.values()][0].delay, 12000);
});

test('chat prevents duplicate submissions before React rerenders', async (t) => {
  const ui = client(t);
  ui.open();
  await ui.respond(ui.requests[0], []);
  ui.type('  One message  ');
  const handler = ui.find('form').props.onSubmit;
  const first = handler({ preventDefault() {} });
  const second = handler({ preventDefault() {} });
  assert.equal(
    ui.requests.filter((request) => request.options.method === 'POST').length,
    1
  );
  assert.equal(JSON.parse(ui.requests[1].options.body).message, 'One message');
  await ui.respond(ui.requests[1], row('new', 'One message'), 201);
  await Promise.all([first, second]);
  assert.equal(ui.find('textarea').props.value, '');
});

test('a POST finishing in a hidden tab does not start a background GET or timer', async (t) => {
  const ui = client(t);
  ui.open();
  await ui.respond(ui.requests[0], []);
  ui.type('Sent while leaving the tab');
  const submitted = ui.submit();
  ui.visibility('hidden');
  await ui.respond(
    ui.requests[1],
    row('new', 'Sent while leaving the tab'),
    201
  );
  await submitted;
  assert.equal(ui.requests.length, 2);
  assert.equal(ui.timers.size, 0);
  ui.visibility('visible');
  assert.equal(ui.requests.length, 3);
});

test('chat aborts pending reads/writes and ignores late completions after close or unmount', async (t) => {
  for (const action of ['close', 'unmount']) {
    for (const operation of ['GET', 'POST']) {
      await t.test(`${action} during ${operation}`, async (child) => {
        const ui = client(child);
        ui.open();
        if (operation === 'POST') {
          await ui.respond(ui.requests[0], []);
          ui.type('Pending message');
          void ui.submit();
        }
        const pending = ui.requests.at(-1);
        if (action === 'close') ui.open(false);
        else ui.renderer.unmount();
        assert.equal(pending.options.signal.aborted, true);
        await ui.respond(
          pending,
          operation === 'POST'
            ? row('late', 'Late message')
            : [row('late', 'Late message')]
        );
        assert.equal(ui.renderer.lateUpdates, 0);
        assert.equal(ui.timers.size, 0);
        assert.equal(ui.listeners.size, 0);
        if (action === 'close') assert.doesNotMatch(ui.content, /Late message/);
      });
    }
  }
});

test('changing the inquiry resets the draft and rejects responses from the previous conversation', async (t) => {
  const ui = client(t);
  ui.open();
  await ui.respond(ui.requests[0], []);
  ui.type('Draft for the first buyer');
  void ui.submit();
  const stale = ui.requests[1];
  ui.renderer.update({ ...chatProps, inquiryId: 'inquiry-b' });
  assert.equal(stale.options.signal.aborted, true);
  assert.equal(ui.find('details').props.open, false);
  await ui.respond(stale, row('late', 'Private previous conversation'), 201);
  ui.open();
  assert.match(ui.requests[2].url, /inquiry-b\/messages$/);
  await ui.respond(ui.requests[2], [
    row('current', 'Second conversation', 'inquiry-b'),
  ]);
  assert.equal(ui.find('textarea').props.value, '');
  assert.match(ui.content, /Second conversation/);
  assert.doesNotMatch(ui.content, /Private previous conversation/);
  assert.equal(ui.renderer.lateUpdates, 0);
});

test('chat errors remain alerts, keep the draft, hide internal failures, and allow retry', async (t) => {
  const ui = client(t);
  ui.open();
  await ui.respond(ui.requests[0], { error: 'INTERNAL_DATABASE_DETAIL' }, 500);
  assert.ok(
    nodes(ui.renderer.tree, (element) => element.props.role === 'alert').length
  );
  assert.doesNotMatch(ui.content, /INTERNAL_DATABASE_DETAIL/);
  ui.type('Keep this draft');
  const failed = ui.submit();
  await ui.respond(ui.requests[1], { error: 'INTERNAL_DATABASE_DETAIL' }, 500);
  await failed;
  assert.equal(ui.find('textarea').props.value, 'Keep this draft');
  assert.equal(ui.find('button').props.disabled, false);
  const retried = ui.submit();
  await ui.respond(ui.requests[2], row('new', 'Keep this draft'), 201);
  await retried;
  assert.match(ui.content, /Keep this draft/);
});

test('failed POST clears initial loading after aborting the first GET and schedules a retry', async (t) => {
  const ui = client(t);
  ui.open();
  const initialGet = ui.requests[0];
  ui.type('Keep this unsent message');
  const submitted = ui.submit();
  assert.equal(initialGet.options.signal.aborted, true);

  await ui.respond(ui.requests[1], { error: 'Unavailable' }, 500);
  await submitted;
  assert.doesNotMatch(ui.content, /Loading conversation/);
  assert.match(ui.content, /Could not send message/);
  assert.equal(ui.find('textarea').props.value, 'Keep this unsent message');
  assert.equal(ui.find('button').props.disabled, false);
  assert.equal([...ui.timers.values()][0].delay, 12000);

  await ui.respond(initialGet, [row('stale', 'Stale initial result')]);
  assert.doesNotMatch(ui.content, /Stale initial result/);
  ui.tick();
  await ui.respond(ui.requests[2], [row('current', 'Current conversation')]);
  assert.match(ui.content, /Current conversation/);
  assert.equal(ui.find('textarea').props.value, 'Keep this unsent message');
});

test('seller response blocks duplicate POSTs and announces the saved response', async (t) => {
  const ui = client(t, 'components/SellerResponseForm.tsx', {
    inquiryId: 'inquiry-a',
    existingResponse: null,
  });
  ui.type('  Yes, it is available.  ');
  const handler = ui.find('form').props.onSubmit;
  const first = handler({ preventDefault() {} });
  const duplicate = handler({ preventDefault() {} });
  assert.equal(ui.requests.length, 1);
  assert.equal(
    JSON.parse(ui.requests[0].options.body).response,
    'Yes, it is available.'
  );
  await ui.respond(ui.requests[0], {
    seller_response: 'Yes, it is available.',
  });
  await Promise.all([first, duplicate]);
  assert.equal(ui.find('form'), undefined);
  assert.match(ui.content, /Yes, it is available/);
  assert.ok(
    nodes(ui.renderer.tree, (element) => element.props.role === 'status').length
  );
});

test('seller response respects a saved reply refreshed for the same inquiry', (t) => {
  const ui = client(t, 'components/SellerResponseForm.tsx', {
    inquiryId: 'inquiry-a',
    existingResponse: null,
  });
  ui.type('An unsent draft');
  ui.renderer.update({
    inquiryId: 'inquiry-a',
    existingResponse: 'The response already saved on the server',
  });

  assert.match(ui.content, /The response already saved on the server/);
  assert.equal(ui.find('form'), undefined);
  assert.equal(ui.requests.length, 0);
  assert.ok(
    nodes(ui.renderer.tree, (element) => element.props.role === 'status').length
  );
});

test('seller response aborts on unmount or inquiry change without stale updates', async (t) => {
  for (const action of ['unmount', 'change']) {
    await t.test(action, async (child) => {
      const ui = client(child, 'components/SellerResponseForm.tsx', {
        inquiryId: 'inquiry-a',
        existingResponse: null,
      });
      ui.type('Old inquiry response');
      const submitted = ui.submit();
      const pending = ui.requests[0];
      if (action === 'unmount') ui.renderer.unmount();
      else
        ui.renderer.update({ inquiryId: 'inquiry-b', existingResponse: null });
      assert.equal(pending.options.signal.aborted, true);
      await ui.respond(pending, { seller_response: 'Old inquiry response' });
      await submitted;
      assert.equal(ui.renderer.lateUpdates, 0);
      if (action === 'change') {
        assert.equal(ui.find('textarea').props.value, '');
        assert.doesNotMatch(ui.content, /Old inquiry response/);
      }
    });
  }
});
