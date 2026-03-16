import styles from './ImagePreview.module.css'

export default function ImagePreview({ src, onRemove }) {
  return (
    <div className={styles.wrap}>
      <img src={src} alt="Product preview" className={styles.img} />
      <div className={styles.overlay}>
        <div className={styles.badge}>
          <div className={styles.dot} />
          Ready to scan
        </div>
        <button className={styles.removeBtn} onClick={onRemove}>✕ Remove</button>
      </div>
    </div>
  )
}
