import { useState } from 'react'

import { ChevronDown, ChevronRight } from 'lucide-react'

import styles from '../styles.module.scss'

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

  const handleToggleAccordion = (): void => {
    setIsOpen(!isOpen)
  }

  return (
    <div className={styles.accordionSection}>
      <button className={styles.accordionHeader} onClick={handleToggleAccordion}>
        {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        <span>{title}</span>
      </button>
      {isOpen && <div className={styles.accordionContent}>{children}</div>}
    </div>
  )
}

export default AccordionSection
