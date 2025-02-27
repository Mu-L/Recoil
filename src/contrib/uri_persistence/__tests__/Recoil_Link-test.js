/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */
'use strict';

const {Simulate, act} = require('ReactTestUtils');

const {freshSnapshot} = require('../../../core/Recoil_Snapshot');
const atom = require('../../../recoil_values/Recoil_atom');
const {
  componentThatReadsAndWritesAtom,
  flushPromisesAndTimers,
  renderElements,
} = require('../../../testing/Recoil_TestingUtils');
const {
  LinkToRecoilSnapshot,
  LinkToRecoilStateChange,
} = require('../Recoil_Link');
const React = require('react');

const myAtom = atom<string>({key: 'Link Snapshot', default: 'DEFAULT'});
const [ReadsAndWritesAtom, setAtom] = componentThatReadsAndWritesAtom(myAtom);

const LinkToSnapshot = ({snapshot, children}) => (
  <LinkToRecoilSnapshot
    snapshot={snapshot}
    uriFromSnapshot={({getLoadable}) =>
      `https://test.com/test?atom="${getLoadable(myAtom)
        .valueOrThrow()
        .toString()}`
    }>
    {children}
  </LinkToRecoilSnapshot>
);

const LinkToStateChange = ({stateChange, children}) => (
  <LinkToRecoilStateChange
    stateChange={stateChange}
    uriFromSnapshot={({getLoadable}) =>
      `https://test.com/test?atom="${getLoadable(myAtom)
        .valueOrThrow()
        .toString()}`
    }>
    {children}
  </LinkToRecoilStateChange>
);

test('Link - snapshot', async () => {
  const snapshot = freshSnapshot().map(({set}) => set(myAtom, 'MAP'));

  const c = renderElements(
    <>
      <ReadsAndWritesAtom />
      <LinkToSnapshot snapshot={snapshot}>
        LINK-{snapshot.getLoadable(myAtom).valueOrThrow().toString()}
      </LinkToSnapshot>
    </>,
  );

  expect(c.textContent).toEqual('"DEFAULT"LINK-MAP');

  act(() => setAtom('SET'));
  expect(c.textContent).toEqual('"SET"LINK-MAP');

  // flowlint-next-line unclear-type:off
  expect(((c.children[0]: any): HTMLAnchorElement).href).toEqual(
    'https://test.com/test?atom=%22MAP',
  );

  act(() => {
    Simulate.click(c.children[0], {button: 0});
  });
  await flushPromisesAndTimers();
  expect(c.textContent).toEqual('"MAP"LINK-MAP');
});

test('Link - stateChange', async () => {
  const c = renderElements(
    <>
      <ReadsAndWritesAtom />
      <LinkToStateChange stateChange={({set}) => set(myAtom, 'MAP')}>
        LINK
      </LinkToStateChange>
    </>,
  );
  expect(c.textContent).toEqual('"DEFAULT"LINK');

  act(() => setAtom('SET'));
  expect(c.textContent).toEqual('"SET"LINK');

  // flowlint-next-line unclear-type:off
  expect(((c.children[0]: any): HTMLAnchorElement).href).toEqual(
    'https://test.com/test?atom=%22MAP',
  );

  act(() => {
    Simulate.click(c.children[0], {button: 0});
  });
  await flushPromisesAndTimers();
  expect(c.textContent).toEqual('"MAP"LINK');
});

test('Link - state update', async () => {
  const c = renderElements(
    <>
      <ReadsAndWritesAtom />
      <LinkToStateChange
        stateChange={({set}) => set(myAtom, value => 'MAP ' + value)}>
        LINK
      </LinkToStateChange>
    </>,
  );
  expect(c.textContent).toEqual('"DEFAULT"LINK');

  act(() => setAtom('SET'));
  expect(c.textContent).toEqual('"SET"LINK');

  // flowlint-next-line unclear-type:off
  expect(((c.children[0]: any): HTMLAnchorElement).href).toEqual(
    'https://test.com/test?atom=%22MAP%20SET',
  );

  act(() => {
    Simulate.click(c.children[0], {button: 0});
  });
  await flushPromisesAndTimers();
  expect(c.textContent).toEqual('"MAP SET"LINK');
});
