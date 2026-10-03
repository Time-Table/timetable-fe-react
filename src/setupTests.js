// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// 표 화면 A/B 2회차 상태(GET /api/experiments/table-ab)는 테스트에서 기본 꺼짐이다.
// 켜서 보는 테스트는 jest.mocked(getTableAbState).mockResolvedValue({ ok: true, running: true, state: "running" })로 바꾼다.
jest.mock("./api/experiment", () => ({
  getTableAbState: jest.fn(() => Promise.resolve({ ok: true, running: false, state: "off" })),
}));

// 랜딩 신뢰 표시 집계(GET /api/stats/landing)는 테스트에서 기본 "못 받음"(null)이라 세 줄이 그려지지 않는다.
// 숫자를 보는 테스트는 MauHero.test.jsx가 따로 흉내 낸다.
// jest.fn은 CRA 설정(resetMocks)으로 테스트마다 구현이 지워지므로 평범한 함수로 둔다.
jest.mock("./api/stats", () => ({
  getLandingStats: () => Promise.resolve(null),
}));
