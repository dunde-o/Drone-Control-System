# React Coding Rules

## 1. 스타일 관리

- 인라인 스타일 사용 금지
- SCSS Module 사용 (`*.module.scss`)
- 컴포넌트별 스타일은 해당 컴포넌트 폴더 내에 위치
- 공통 스타일은 `src/renderer/src/styles/` 폴더에 위치하고 import하여 사용

```
src/renderer/src/
├── styles/
│   ├── _variables.scss    # 공통 변수 (색상, 폰트 등)
│   ├── _mixins.scss       # 공통 믹스인
│   └── _common.scss       # 공통 스타일
└── components/
    └── MyComponent/
        ├── index.tsx
        └── styles.module.scss
```

```scss
// 컴포넌트 SCSS에서 공통 스타일 import
@use '@renderer/styles/common' as *;
@use '@renderer/styles/variables' as vars;
```

## 2. 컴포넌트 구조

- 컴포넌트는 폴더로 관리하고 `index.tsx`를 메인 파일로 사용
- 관련 파일들(SCSS, 타입, 유틸 등)은 같은 폴더에 위치
- `function` 대신 `const` 화살표 함수 사용
- **파일당 하나의 컴포넌트만 export** (DRY 원칙)

```tsx
// Bad - function 선언
function MyComponent(): React.JSX.Element {
  return <div>...</div>
}

// Good - const 화살표 함수
const MyComponent = (): React.JSX.Element => {
  return <div className={styles.container}>...</div>
}

export default MyComponent
```

## 3. Import 순서

import문은 다음 순서로 정렬:

```tsx
// 1. React 관련
import { useState, useEffect } from 'react'

// 2. 외부 라이브러리 (알파벳순)
import { APIProvider, Map } from '@vis.gl/react-google-maps'
import clsx from 'clsx'

// 3. 내부 절대 경로 (알파벳순)
import { useAuth } from '@renderer/hooks/useAuth'
import { formatDate } from '@renderer/utils/date'

// 4. 상대 경로 (알파벳순)
import ChildComponent from './ChildComponent'
import styles from './styles.module.scss'
```

## 4. 이벤트 핸들러

- 익명 함수 대신 명명된 핸들러 함수 사용
- 핸들러 함수명은 `handle` 접두사 사용
- 함수명은 동작을 명확하게 설명해야 함 (예: `handleSubmitForm`, `handleDeleteItem`)

```tsx
// Bad - 익명 함수 사용
<button onClick={() => setCount(count + 1)}>Click</button>

// Bad - 불명확한 이름
const handleClick = () => { ... }

// Good - 동작을 설명하는 명확한 이름
const handleIncrementCount = (): void => {
  setCount(count + 1)
}
<button onClick={handleIncrementCount}>Click</button>
```

## 5. 조건부 렌더링

- `switch`문이나 `if`문을 사용한 렌더링 함수 금지
- JSX 내에서 `&&` 또는 삼항 연산자를 사용한 조건부 렌더링

```tsx
// Bad - switch문/if문 렌더링 함수
const renderContent = () => {
  switch (tab) {
    case 'main':
      return <MainTab />
  }
}

// Good - && 연산자 사용
return (
  <div>
    {activeTab === 'main' && <MainTab />}
    {activeTab === 'settings' && <SettingsTab />}
  </div>
)

// Good - 삼항 연산자 (2가지 경우)
{
  isLoggedIn ? <Dashboard /> : <LoginForm />
}
```

## 6. Hooks 규칙 (React 공식)

- Hook은 컴포넌트 **최상위 레벨**에서만 호출
- 조건문, 반복문, 중첩 함수 내부에서 Hook 호출 금지
- Hook은 React 컴포넌트 또는 커스텀 Hook에서만 호출

```tsx
// Bad - 조건문 내부에서 Hook 호출
if (isLoggedIn) {
  const [user, setUser] = useState(null) // ❌
}

// Good - 최상위에서 Hook 호출
const [user, setUser] = useState(null)
const [isLoading, setIsLoading] = useState(false)
```

## 7. 커스텀 Hook

- 로직 재사용을 위해 커스텀 Hook 생성
- 커스텀 Hook은 반드시 `use` 접두사 사용
- `src/renderer/src/hooks/` 폴더에 위치

```tsx
// hooks/useWindowSize.ts
const useWindowSize = () => {
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const handleResize = (): void => {
      setSize({ width: window.innerWidth, height: window.innerHeight })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return size
}
```

## 8. 불변성 (Immutability)

- props와 state는 직접 변경 금지
- 새로운 객체/배열을 생성하여 업데이트

```tsx
// Bad - 직접 변경
state.items.push(newItem) // ❌
state.user.name = 'New Name' // ❌

// Good - 새 객체 생성
setItems([...items, newItem])
setUser({ ...user, name: 'New Name' })

// Good - 배열 업데이트
setItems(items.filter((item) => item.id !== targetId))
setItems(items.map((item) => (item.id === targetId ? { ...item, done: true } : item)))
```

## 9. Props 네이밍

- Props는 **camelCase** 사용
- 이벤트 핸들러 props는 `on` 접두사 사용
- Boolean props는 `is`, `has`, `can` 접두사 사용

```tsx
interface ButtonProps {
  onClick: () => void // 이벤트 핸들러
  isDisabled?: boolean // Boolean
  hasIcon?: boolean // Boolean
  buttonText: string // 일반 prop
}
```

## 10. TypeScript 타입 정의

- 컴포넌트 Props는 `interface` 사용
- 컴포넌트명 + `Props` 접미사 (예: `ButtonProps`)
- 복잡한 타입은 `types.ts` 파일로 분리

```tsx
interface UserCardProps {
  user: User
  onEdit: (id: string) => void
  isEditable?: boolean
}

const UserCard = ({ user, onEdit, isEditable = false }: UserCardProps): React.JSX.Element => {
  // ...
}
```

## 11. 성능 최적화

- 무거운 계산은 `useMemo` 사용
- 콜백 함수 메모이제이션은 `useCallback` 사용
- 큰 컴포넌트는 `React.lazy`로 지연 로딩

```tsx
// 무거운 계산 메모이제이션
const sortedItems = useMemo(() => {
  return items.sort((a, b) => a.name.localeCompare(b.name))
}, [items])

// 콜백 메모이제이션 (자식에 전달 시)
const handleItemClick = useCallback((id: string): void => {
  setSelectedId(id)
}, [])

// 지연 로딩
const HeavyComponent = lazy(() => import('./HeavyComponent'))
```

## 12. 폴더 구조

- 폴더 깊이는 최대 **3-4단계**로 제한
- 기능(feature) 기반 폴더 구조 권장

```
src/renderer/src/
├── components/       # 공통 UI 컴포넌트
├── features/         # 기능별 모듈
│   └── auth/
│       ├── components/
│       ├── hooks/
│       └── utils/
├── hooks/            # 공통 커스텀 훅
├── styles/           # 공통 스타일
├── types/            # 공통 타입 정의
└── utils/            # 공통 유틸리티
```

## 13. 텍스트 스타일

- 메뉴/UI 내 텍스트는 띄어쓰기 단위로 줄바꿈 허용
- SCSS: `word-break: keep-all` 사용

## 14. 파일 네이밍

- 컴포넌트 폴더: **PascalCase** (예: `MyComponent/`)
- Hook 파일: **camelCase** + `use` 접두사 (예: `useAuth.ts`)
- 유틸 파일: **camelCase** (예: `formatDate.ts`)
- 타입 파일: `types.ts`
- SCSS 모듈: `styles.module.scss`

## 15. 상수 관리

- 상수는 별도의 `constants.ts` 파일로 분리하여 관리
- **전역 상수**: `src/renderer/src/constants/` 폴더에 위치
- **로컬 상수**: 해당 컴포넌트 폴더 내 `constants.ts`에 위치

```
src/renderer/src/
├── constants/              # 전역 상수
│   ├── index.ts           # 전역 상수 export
│   ├── api.ts             # API 관련 상수
│   └── routes.ts          # 라우트 관련 상수
└── components/
    └── MyComponent/
        ├── index.tsx
        ├── constants.ts    # 컴포넌트 전용 상수
        └── styles.module.scss
```

```tsx
// constants/api.ts - 전역 상수
export const API_BASE_URL = 'https://api.example.com'
export const API_TIMEOUT = 5000

// components/MyComponent/constants.ts - 로컬 상수
export const DEFAULT_PAGE_SIZE = 10
export const MAX_ITEMS = 100
```

## 16. SCSS Module 사용법

```tsx
import styles from './styles.module.scss'

// 단일 클래스
<div className={styles.container}>

// 복수 클래스
<div className={`${styles.container} ${styles.active}`}>

// 조건부 클래스
<div className={isActive ? styles.active : styles.inactive}>
```
