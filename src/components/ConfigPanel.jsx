import { useState } from 'react'
import styles from './ConfigPanel.module.css'

function KeyField({ label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false)
  return (
    <div className={styles.field}>
      <label>{label}</label>
      <div className={styles.inputWrap}>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck="false"
        />
        <button className={styles.eyeBtn} onClick={() => setShow(s => !s)} type="button" tabIndex={-1}>
          {show ? '🙈' : '👁'}
        </button>
      </div>
    </div>
  )
}

export default function ConfigPanel({ groqKey, tavilyKey, onGroqChange, onTavilyChange }) {
  return (
    <div className={styles.panel}>
      <div className={styles.title}>⚙ API Keys</div>
      <div className={styles.grid}>
        <KeyField label="Groq API Key" value={groqKey} onChange={onGroqChange} placeholder="gsk_..." />
        <KeyField label="Tavily API Key" value={tavilyKey} onChange={onTavilyChange} placeholder="tvly-..." />
      </div>
    </div>
  )
}
