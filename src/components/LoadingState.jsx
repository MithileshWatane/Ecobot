import styles from './LoadingState.module.css'

const STEPS = [
  '👁 Vision: Identifying product...',
  '🌐 Search: Fetching impact data...',
  '🧠 AI: Scoring & finding alternatives...',
  '🖼 Fetching product images & links...',
]

export default function LoadingState({ currentStep }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.ring} />
      <div className={styles.steps}>
        {STEPS.map((text, i) => {
          const n = i + 1
          let cls = styles.step
          if (n < currentStep) cls += ' ' + styles.done
          if (n === currentStep) cls += ' ' + styles.active
          return (
            <div key={n} className={cls}>
              <div className={styles.dot} />
              {text}
            </div>
          )
        })}
      </div>
    </div>
  )
}
