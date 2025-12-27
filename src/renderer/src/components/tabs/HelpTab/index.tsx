import { useState } from 'react'

import { ChevronDown, ChevronRight } from 'lucide-react'

import styles from './styles.module.scss'

interface AccordionSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

const AccordionSection = ({
  title,
  children,
  defaultOpen = false
}: AccordionSectionProps): React.JSX.Element => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className={styles.accordionSection}>
      <button className={styles.accordionHeader} onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        <span>{title}</span>
      </button>
      {isOpen && <div className={styles.accordionContent}>{children}</div>}
    </div>
  )
}

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
          </ul>
        </div>
      </AccordionSection>

      <AccordionSection title="Base 사용법">
        <div className={styles.helpContent}>
          <h4>Base 위치 설정</h4>
          <p>
            MAIN 탭에서 드론의 이착륙 기지(Base) 위치를 설정합니다. 서버가 연결된 상태에서만 설정이
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
