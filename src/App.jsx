import { useState } from 'react'
import UploadZone from './components/UploadZone'
import ImagePreview from './components/ImagePreview'
import LoadingState from './components/LoadingState'
import ResultsPanel from './components/ResultsPanel'
import { detectProduct, fetchEnvData, analyzeProduct } from './api'
import styles from './App.module.css'

export default function App() {
  const [groqKey, setGroqKey]         = useState(import.meta.env.VITE_GROQ_API_KEY || '')
  const [tavilyKey, setTavilyKey]     = useState(import.meta.env.VITE_TAVILY_API_KEY || '')
  const [imageBase64, setImageBase64] = useState(null)
  const [imageMime, setImageMime]     = useState('image/jpeg')
  const [previewSrc, setPreviewSrc]   = useState(null)
  const [loading, setLoading]         = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [error, setError]             = useState(null)
  const [results, setResults]         = useState(null)

  function handleFile(file) {
    if (!file.type.startsWith('image/')) { setError('Please upload an image file.'); return }
    setError(null)
    setImageMime(file.type)
    const reader = new FileReader()
    reader.onload = e => {
      setImageBase64(e.target.result.split(',')[1])
      setPreviewSrc(e.target.result)
    }
    reader.readAsDataURL(file)
  }

  function resetUpload() { setImageBase64(null); setPreviewSrc(null) }
  function resetAll()    { setResults(null); setError(null); resetUpload() }

  async function runAnalysis() {
    setError(null)
    if (!imageBase64) { setError('Please upload a product image.'); return }

    setLoading(true); setResults(null); setCurrentStep(1)
    try {
      const productData   = await detectProduct(groqKey, imageBase64, imageMime)
      setCurrentStep(2)
      const searchResults = await fetchEnvData(tavilyKey, productData)
      setCurrentStep(3)
      const analysis      = await analyzeProduct(groqKey, productData, searchResults)
      setCurrentStep(4)
      setResults({ productData, analysis })
    } catch (err) {
      setError(err.message || String(err))
    } finally {
      setLoading(false); setCurrentStep(0)
    }
  }

  return (
    <div className={styles.app}>
      {/* Sticky nav */}
      <nav className={styles.navbar}>
        <div className={styles.navBrand}>
          <span className={styles.navLeaf}>🌿</span>
          EcoScan
        </div>
        <span className={styles.navPill}>Impact Analyzer</span>
      </nav>

      <div className={styles.container}>
        {/* Hero */}
        {!results && (
          <div className={styles.hero}>
            <span className={styles.heroIcon}>📦</span>
            <h1 className={styles.heroTitle}>Know What You <em>Buy</em></h1>
            <p className={styles.heroSub}>
              Upload a product photo — we'll reveal its environmental footprint and suggest greener alternatives.
            </p>
          </div>
        )}

        {/* Upload / Preview */}
        {!results && (
          <div className={styles.section}>
            {previewSrc
              ? <ImagePreview src={previewSrc} onRemove={resetUpload} />
              : <UploadZone onFile={handleFile} />
            }
          </div>
        )}

        {/* Error */}
        {error && <div className={styles.errorBox}>⚠ {error}</div>}

        {/* Analyze button */}
        {!results && (
          <button className={styles.analyzeBtn} disabled={loading} onClick={runAnalysis}>
            <span className={styles.btnInner}>🌿 Analyze Environmental Impact</span>
          </button>
        )}

        {/* Loading */}
        {loading && <LoadingState currentStep={currentStep} />}

        {/* Results */}
        {results && !loading && (
          <ResultsPanel
            productData={results.productData}
            analysis={results.analysis}
            tavilyKey={tavilyKey}
            onReset={resetAll}
          />
        )}
      </div>
    </div>
  )
}
