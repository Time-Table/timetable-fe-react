/* 시간 글자와 "눌러서 명단 보기"는 숨긴 글(aria-hidden)이라 역할·이름이 없어 칸 이름(class)으로 위치를 확인한다. */
/* eslint-disable testing-library/no-node-access, testing-library/no-container */
import { render, screen } from "@testing-library/react";
import { ViewGrid } from "./BGrid";

// 격자 모양만 본다. 합성 자료만 쓴다(한 주 7열, 모두 후보 날).
const week = [5, 6, 7, 8, 9, 10, 11].map((d) => ({ key: `2026-10-${String(d).padStart(2, "0")}`, on: true, dnum: d }));
const draw = ({ times = ["10:00", "10:30", "11:00", "11:30"], tipKey = null } = {}) => {
  const info = new Map(week.flatMap((d) => times.map((t) => [`${d.key}-${t}`, { count: 1, members: ["민준"] }])));
  return render(
    <ViewGrid week={week} times={times} locked={new Set()} info={info} max={1} picks={[]} tipKey={tipKey} popKey={null} slide={null} onCell={() => {}} />,
  );
};

test("시간 글자는 정각 선마다 하나, 마지막 선에는 끝 시각을 단다(자정 끝은 24)", () => {
  const { container, unmount } = draw();
  expect([...container.querySelectorAll(".tb-hour:not(.end)")].map((el) => el.textContent)).toEqual(["10", "11"]);
  expect(container.querySelector(".tb-hour.end")).toHaveTextContent("12");
  // 날짜 줄 밑 틈과 첫 시간 선이 첫 칸보다 앞에 있다
  expect(container.querySelector(".tb-gridgap.line")).toBeInTheDocument();
  unmount();
  const { container: late } = draw({ times: ["23:00", "23:30"] });
  expect(late.querySelector(".tb-hour.end")).toHaveTextContent("24");
});

test("명단 안내는 칸 위에 띄워 꼬리로 칸 안을 짚고, 첫 줄이면 아래로, 양끝 열이면 말풍선만 안쪽으로 붙인다", () => {
  const place = (tipKey) => {
    const { container, unmount } = draw({ tipKey });
    const tip = screen.getByText("눌러서 명단 보기");
    const out = [tip.className, container.querySelector(".tb-tip-arrow").className];
    expect(container.querySelector(".tb-cell.has-tip")).toContainElement(tip);
    unmount();
    return out;
  };
  expect(place("2026-10-08-11:00")).toEqual(["tb-tip", "tb-tip-arrow"]);
  expect(place("2026-10-08-10:00")).toEqual(["tb-tip below", "tb-tip-arrow below"]);
  expect(place("2026-10-05-11:30")).toEqual(["tb-tip start", "tb-tip-arrow"]);
  expect(place("2026-10-11-10:00")).toEqual(["tb-tip end below", "tb-tip-arrow below"]);
});
