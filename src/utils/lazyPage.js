import { Component, lazy } from "react";
import theme from "../theme";

const RELOAD_KEY = "lazy-page-reload-at";
/** 이 시간 안에 또 실패하면 새로고침하지 않는다(새 배포에도 파일이 없으면 무한 새로고침이 된다). */
const RELOAD_GUARD_MS = 10000;

/**
 * 첫 로딩에서 빼고 들어갈 때 받는 화면.
 *
 * 새로 배포하면 예전 조각 파일(chunk)이 사라진다. 배포 전에 열어 둔 탭에서 이 화면으로 가면
 * 파일을 못 받는다. 그때는 한 번만 새로고침해 새 index.html과 새 조각을 받는다.
 */
export function lazyPage(load) {
  return lazy(() =>
    load().catch((error) => {
      let last = 0;
      try {
        last = Number(sessionStorage.getItem(RELOAD_KEY)) || 0;
      } catch {
        // 저장소를 못 쓰면 새로고침 여부를 기억할 수 없다. 아래에서 오류로 넘긴다.
        throw error;
      }
      if (Date.now() - last < RELOAD_GUARD_MS) throw error;
      try {
        sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
      } catch {
        throw error;
      }
      window.location.reload();
      // 새로고침이 끝날 때까지 기다린다.
      return new Promise(() => {});
    })
  );
}

/**
 * 조각 파일을 끝내 못 받았을 때 흰 화면 대신 안내를 보여준다.
 * 이 경계 밖(헤더·푸터)은 그대로 남는다. 주소(`resetKey`)가 바뀌면 안내를 거두고 다시 그린다.
 */
export class LazyPageBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidUpdate(prevProps) {
    if (this.state.failed && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ failed: false });
    }
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div
        role="alert"
        style={{
          minHeight: "60vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: theme.space[3],
          padding: theme.space[6],
          textAlign: "center",
          fontSize: theme.font.size.body,
          color: theme.text.gamma[200],
        }}
      >
        <p style={{ margin: 0 }}>페이지를 불러오지 못했습니다. 연결 상태를 확인하고 새로고침해 주세요.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{ minHeight: 44, padding: `0 ${theme.space[4]}`, cursor: "pointer" }}
        >
          새로고침
        </button>
      </div>
    );
  }
}
