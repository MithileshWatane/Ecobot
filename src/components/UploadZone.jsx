import { useRef } from 'react'
import styles from './UploadZone.module.css'

export default function UploadZone({ onFile }) {
  const inputRef = useRef()

  const handleDrop = e => {
    e.preventDefault()
    e.currentTarget.classList.remove(styles.dragover)
    if (e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0])
  }

  return (
    <div
      className={styles.zone}
      onClick={() => inputRef.current.click()}
      onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add(styles.dragover) }}
      onDragLeave={e => e.currentTarget.classList.remove(styles.dragover)}
      onDrop={handleDrop}
    >
      <span className={styles.icon}>📸</span>
      <div className={styles.label}>Tap to upload product photo</div>
      <div className={styles.sub}>JPG, PNG, WEBP supported</div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={e => { if (e.target.files[0]) onFile(e.target.files[0]) }}
      />
    </div>
  )
}
