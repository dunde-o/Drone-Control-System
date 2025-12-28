import AccordionSection from './AccordionSection'

import styles from './styles.module.scss'

const HelpTab = (): React.JSX.Element => {
  return (
    <div className={styles.container}>
      <h2>HELP</h2>

      <AccordionSection title="단축키" defaultOpen>
        <div className={styles.shortcutList}>
          <div className={styles.shortcutRow}>
            <span>사이드바 열기/닫기</span>
            <code className={styles.shortcutKey}>Tab</code>
          </div>
          <div className={styles.shortcutRow}>
            <span>MAIN 탭</span>
            <code className={styles.shortcutKey}>Ctrl + 1</code>
          </div>
          <div className={styles.shortcutRow}>
            <span>SERVER 탭</span>
            <code className={styles.shortcutKey}>Ctrl + 2</code>
          </div>
          <div className={styles.shortcutRow}>
            <span>API 탭</span>
            <code className={styles.shortcutKey}>Ctrl + 3</code>
          </div>
          <div className={styles.shortcutRow}>
            <span>HELP 탭</span>
            <code className={styles.shortcutKey}>Ctrl + 4</code>
          </div>
        </div>
      </AccordionSection>

      <AccordionSection title="드론 제어">
        <div className={styles.helpContent}>
          <h4>드론 목록</h4>
          <p>
            MAIN 탭에서 현재 연결된 드론 목록을 확인할 수 있습니다. 각 드론의 상태, 배터리, 위치
            정보가 표시됩니다.
          </p>

          <h4>개별 드론 제어</h4>
          <ul>
            <li>
              <strong>이륙:</strong> idle 상태의 드론을 이륙시킵니다.
            </li>
            <li>
              <strong>착륙:</strong> 공중에 있는 드론을 착륙시킵니다.
            </li>
            <li>
              <strong>복귀:</strong> 드론을 Base 위치로 복귀시킵니다.
            </li>
            <li>
              <strong>위치 찾기:</strong> 지도에서 해당 드론 위치로 이동합니다.
            </li>
            <li>
              <strong>경로 표시:</strong> 드론의 이동 경로를 지도에 표시합니다.
            </li>
          </ul>

          <h4>전체 드론 명령</h4>
          <p>드론 목록 헤더의 버튼으로 모든 드론에 일괄 명령을 내릴 수 있습니다:</p>
          <ul>
            <li>
              <strong>전체 경로 보기:</strong> 모든 드론의 경로를 표시/숨김합니다.
            </li>
            <li>
              <strong>전체 랜덤 이동:</strong> 공중의 모든 드론을 Base 기준 5~10km 반경 내 랜덤
              위치로 이동시킵니다.
            </li>
            <li>
              <strong>전체 이륙:</strong> 모든 idle 상태 드론을 이륙시킵니다.
            </li>
            <li>
              <strong>전체 복귀:</strong> 모든 공중 드론을 Base로 복귀시킵니다.
            </li>
          </ul>

          <h4>드론 이동 명령</h4>
          <p>지도에서 드론을 선택한 후 우클릭으로 이동 명령을 내릴 수 있습니다:</p>
          <ul>
            <li>
              <strong>우클릭:</strong> 선택한 드론을 클릭한 위치로 이동시킵니다.
            </li>
            <li>
              <strong>Shift + 우클릭:</strong> 기존 경로에 새로운 웨이포인트를 추가합니다.
            </li>
          </ul>
          <p className={styles.hint}>
            hovering, moving, returning, returning_auto 상태의 드론만 이동 명령이 가능합니다.
          </p>
        </div>
      </AccordionSection>

      <AccordionSection title="드론 상태">
        <div className={styles.helpContent}>
          <h4>상태별 색상</h4>
          <ul>
            <li>
              <strong>idle (회색):</strong> 대기 중 (지상)
            </li>
            <li>
              <strong>ascending (노랑):</strong> 이륙 중
            </li>
            <li>
              <strong>hovering (파랑):</strong> 정지 비행 중
            </li>
            <li>
              <strong>moving (녹색):</strong> 이동 중
            </li>
            <li>
              <strong>returning (보라):</strong> Base로 복귀 중
            </li>
            <li>
              <strong>landing (노랑):</strong> 착륙 중
            </li>
            <li>
              <strong>returning_auto / landing_auto (빨강):</strong> 배터리 부족으로 자동 복귀/착륙
              중
            </li>
            <li>
              <strong>mia (빨강):</strong> 연결 끊김
            </li>
          </ul>
        </div>
      </AccordionSection>

      <AccordionSection title="마커 클러스터링">
        <div className={styles.helpContent}>
          <h4>클러스터링</h4>
          <p>
            지도에서 드론이 밀집된 경우 클러스터 마커로 묶어서 표시됩니다. 클러스터 마커에는 포함된
            드론 수가 표시됩니다.
          </p>

          <h4>클러스터링 규칙</h4>
          <ul>
            <li>6대 이상의 드론이 가까이 있을 때만 클러스터가 생성됩니다.</li>
            <li>줌 레벨에 따라 클러스터링 범위가 자동 조절됩니다.</li>
            <li>축소할수록 더 넓은 범위의 드론이 클러스터됩니다.</li>
            <li>클러스터 마커를 클릭하면 해당 위치로 확대됩니다.</li>
          </ul>
        </div>
      </AccordionSection>

      <AccordionSection title="서버 사용법">
        <div className={styles.helpContent}>
          <h4>서버 시작/중지</h4>
          <p>
            SERVER 탭에서 Host와 Port를 설정한 후 &quot;Start Server&quot; 버튼을 클릭하여 서버를
            시작합니다. 서버가 실행 중일 때는 &quot;Stop Server&quot; 버튼으로 중지할 수 있습니다.
          </p>

          <h4>서버 상태</h4>
          <p>
            Server Status 영역에서 현재 연결 상태를 확인할 수 있습니다. Connected 상태일 때만 서버
            설정을 변경할 수 있습니다.
          </p>

          <h4>서버 설정</h4>
          <ul>
            <li>
              <strong>드론 수:</strong> 시뮬레이션할 드론 수를 설정합니다.
            </li>
            <li>
              <strong>Heartbeat Log:</strong> 활성화하면 콘솔에서 heartbeat 메시지를 확인할 수
              있습니다.
            </li>
            <li>
              <strong>Base 이동 시간:</strong> Base 위치 변경 시 이동에 걸리는 시간(ms)을
              설정합니다.
            </li>
            <li>
              <strong>Heartbeat 주기:</strong> 서버가 클라이언트에게 상태를 전송하는 주기(ms)를
              설정합니다. 최소 1000ms입니다.
            </li>
            <li>
              <strong>Base 고도:</strong> 드론의 기본 비행 고도(m)를 설정합니다.
            </li>
          </ul>
        </div>
      </AccordionSection>

      <AccordionSection title="Base 사용법">
        <div className={styles.helpContent}>
          <h4>Base 위치 설정</h4>
          <p>
            지도에서 Base 마커를 클릭하면 Base 정보 패널이 열립니다. 서버가 연결된 상태에서만 설정이
            가능합니다.
          </p>

          <h4>좌표 직접 입력</h4>
          <p>
            위도(Latitude)와 경도(Longitude)를 직접 입력한 후 &quot;Base 위치 적용&quot; 버튼을
            클릭합니다.
          </p>

          <h4>지도에서 선택</h4>
          <ol>
            <li>
              지도 아이콘 버튼(<code>MapPinned</code>)을 클릭하여 선택 모드를 활성화합니다.
            </li>
            <li>지도에서 원하는 위치를 클릭합니다.</li>
            <li>좌표가 자동으로 입력됩니다.</li>
            <li>&quot;Base 위치 적용&quot; 버튼을 클릭하여 서버에 적용합니다.</li>
          </ol>
          <p className={styles.hint}>선택 모드에서 X 버튼을 클릭하면 이전 좌표로 복원됩니다.</p>

          <h4>Base 마커</h4>
          <p>지도에 표시된 Base 마커를 클릭하면 현재 Base 정보를 확인할 수 있습니다.</p>
        </div>
      </AccordionSection>

      <AccordionSection title="API 설정">
        <div className={styles.helpContent}>
          <h4>Google Maps API Key</h4>
          <p>
            API 탭에서 Google Maps API Key를 입력하고 &quot;Apply&quot; 버튼을 클릭하면 지도가
            업데이트됩니다.
          </p>
          <p className={styles.hint}>API Key는 Google Cloud Console에서 발급받을 수 있습니다.</p>
        </div>
      </AccordionSection>
    </div>
  )
}

export default HelpTab
