import { useEffect, useRef } from 'react'
import { buildBuyLinks, tavilySearch, looksLikeImage } from '../api'
import styles from './ResultsPanel.module.css'

function scoreColors(score) {
  if (score <= 3) return { border: '#c0392b80', fill: '#e74c3c' }
  if (score <= 5) return { border: '#e67e2280', fill: '#f39c12' }
  if (score <= 7) return { border: '#d4ac0d80', fill: '#f1c40f' }
  return { border: '#27ae6080', fill: '#2ecc71' }
}

function AltCard({ alt, index, tavilyKey }) {
  const imgRef = useRef()
  const name   = alt.name  || alt
  const brand  = alt.brand  || ''
  const reason = alt.reason || ''
  const links  = buildBuyLinks(name)

  useEffect(() => {
    if (!tavilyKey) return
    async function fetchImg() {
      try {
        const data = await tavilySearch(tavilyKey, `${name} product image buy`, true)
        let imgUrl = null
        for (const img of (data.images || [])) {
          const url = typeof img === 'string' ? img : (img.url || img.src || '')
          if (looksLikeImage(url)) { imgUrl = url; break }
        }
        if (!imgUrl) for (const r of (data.results || [])) {
          if (r.image && looksLikeImage(r.image)) { imgUrl = r.image; break }
        }
        if (!imgUrl) for (const r of (data.results || [])) {
          const m = (r.content || '').match(/https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp)(\?[^\s"'<>]*)?/i)
          if (m && looksLikeImage(m[0])) { imgUrl = m[0]; break }
        }
        if (imgRef.current) {
          imgRef.current.innerHTML = imgUrl
            ? `<img src="${imgUrl}" alt="" style="width:100%;height:100%;object-fit:contain;padding:6px" onerror="this.parentElement.innerHTML='<span style=\\'font-size:2rem\\'>🌿</span>'">`
            : '<span style="font-size:2rem">🌿</span>'
        }
      } catch (_) {
        if (imgRef.current) imgRef.current.innerHTML = '<span style="font-size:2rem">🌿</span>'
      }
    }
    fetchImg()
  }, [alt, tavilyKey])

  return (
    <div className={styles.altCard}>
      <div className={styles.altImgWrap} ref={imgRef}>
        <div className={styles.altImgLoading}>🔍 Loading…</div>
      </div>
      <div className={styles.altBody}>
        <div>
          <div className={styles.altHeaderRow}>
            <div className={styles.altNumBadge}>{index + 1}</div>
            <div>
              <div className={styles.altName}>{name}</div>
              {brand && <div className={styles.altBrand}>{brand}</div>}
            </div>
          </div>
          {reason && <div className={styles.altWhy} style={{ marginTop: '.4rem' }}>{reason}</div>}
        </div>
        <div className={styles.buyLinks}>
          {links.map(l => (
            <a key={l.cls} className={`${styles.buyBtn} ${styles[l.cls]}`} href={l.url} target="_blank" rel="noopener noreferrer">
              <img className={styles.shopIcon} src={l.icon} alt="" onError={e => e.target.style.display = 'none'} />
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ResultsPanel({ productData, analysis, tavilyKey, onReset }) {
  const score  = Math.min(10, Math.max(1, Math.round(analysis.eco_score || 5)))
  const { border, fill } = scoreColors(score)
  const certs  = analysis.certifications || []

  useEffect(() => {
    // Animate score bar after mount
    const el = document.getElementById('__scoreFill')
    if (el) setTimeout(() => { el.style.width = `${score * 10}%` }, 120)
  }, [score])

  return (
    <div className={styles.panel}>
      {/* Product header */}
      <div className={styles.productHeader}>
        <div className={styles.productBrand}>{(productData.brand || '').toUpperCase()}</div>
        <div className={styles.productName}>{productData.product || 'Unknown Product'}</div>
        <div className={styles.scoreRow}>
          <div className={styles.scoreCircle} style={{ borderColor: border }}>
            <div className={styles.scoreNum}>{score}</div>
            <div className={styles.scoreLbl}>/ 10</div>
          </div>
          <div className={styles.scoreBarWrap}>
            <div className={styles.scoreBarLabel}>Eco-Friendliness Score</div>
            <div className={styles.scoreBar}>
              <div id="__scoreFill" className={styles.scoreFill} style={{ width: 0, background: fill, transition: 'width 1s ease .15s' }} />
            </div>
            {analysis.score_rationale && (
              <div className={styles.scoreRationale}>{analysis.score_rationale}</div>
            )}
          </div>
        </div>
      </div>

      {/* Issues + Certifications */}
      <div className={styles.cardsGrid}>
        <div className={styles.card}>
          <div className={styles.cardTitle}>⚠ Issues</div>
          <div className={styles.issueList}>
            {(analysis.issues || []).length > 0
              ? (analysis.issues || []).map((iss, i) => <div key={i} className={styles.issueTag}>{iss}</div>)
              : <div className={styles.noIssue}>No major issues found</div>
            }
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardTitle}>🏅 Certified</div>
          {certs.length > 0
            ? <div className={styles.certChips}>{certs.map((c, i) => <span key={i} className={styles.certChip}>✓ {c}</span>)}</div>
            : <div className={styles.noCert}>No certifications found</div>
          }
        </div>
      </div>

      {/* Alternatives */}
      <div className={styles.altSection}>
        <div className={styles.cardTitle}>🌱 Greener Alternatives — Buy Now</div>
        <div className={styles.altGrid}>
          {(analysis.alternatives || []).map((alt, i) => (
            <AltCard key={i} alt={alt} index={i} tavilyKey={tavilyKey} />
          ))}
        </div>
      </div>

      <button className={styles.resetBtn} onClick={onReset}>↩ Scan another product</button>
    </div>
  )
}
