import { useState, useCallback } from 'react'
import { PhotoUpload } from './components/PhotoUpload'
import { ListingCard, type Listing } from './components/ListingCard'

type Step = 'upload' | 'identifying' | 'clarify' | 'researching' | 'confirm' | 'done'

interface ItemData {
  item_name: string
  condition: string
  title: string
  description: string
  category: string
  photoUrl: string
  photoPath: string
  estimated_size?: string
  size_confident?: boolean
}

interface PriceData {
  suggested_price: number
  reasoning: string
  comparables: { active: any[]; sold: any[] }
}

function App() {
  const [step, setStep] = useState<Step>('upload')
  const [itemData, setItemData] = useState<ItemData | null>(null)
  const [priceData, setPriceData] = useState<PriceData | null>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [error, setError] = useState<string | null>(null)
  const [clarifyQuestion, setClarifyQuestion] = useState<string>('')
  const [clarifyAnswer, setClarifyAnswer] = useState<string>('')
  const [clarifyPhoto, setClarifyPhoto] = useState<{ url: string; path: string } | null>(null)
  const [alternatives, setAlternatives] = useState<Array<{ price: number; reasoning: string }>>([])
  const [showDashboard, setShowDashboard] = useState(false)

  const fetchListings = useCallback(async () => {
    try {
      const res = await fetch('/api/listings')
      const data = await res.json()
      setListings(data.listings || [])
    } catch {}
  }, [])

  const handleUpload = useCallback(async (file: File) => {
    setStep('identifying')
    setError(null)

    const formData = new FormData()
    formData.append('photo', file)

    try {
      const res = await fetch('/api/identify', { method: 'POST', body: formData })
      const data = await res.json()

      if (data.error) {
        setError(data.error)
        setStep('upload')
        return
      }

      if (data.unclear) {
        setClarifyQuestion(data.question)
        setClarifyPhoto({ url: data.photoUrl, path: data.photoPath })
        setStep('clarify')
        return
      }

      setItemData({
        item_name: data.item_name,
        condition: data.condition,
        title: data.title,
        description: data.description,
        category: data.category,
        photoUrl: data.photoUrl,
        photoPath: data.photoPath,
        estimated_size: data.estimated_size,
        size_confident: data.size_confident,
      })

      // Auto-proceed to price research
      setStep('researching')
      const priceRes = await fetch('/api/price-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_name: data.item_name, condition: data.condition }),
      })
      const priceResult = await priceRes.json()

      if (priceResult.error) {
        setError(priceResult.error)
        setStep('upload')
        return
      }

      setPriceData(priceResult)
      setStep('confirm')
    } catch (err: any) {
      setError(err.message)
      setStep('upload')
    }
  }, [])

  const handleConfirmPrice = useCallback(async (price: number) => {
    if (!itemData) return

    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: itemData.title,
          description: itemData.description,
          item_name: itemData.item_name,
          condition: itemData.condition,
          price,
          category: itemData.category,
          photoUrl: itemData.photoUrl,
          photoPath: itemData.photoPath,
          status: 'confirmed',
        }),
      })
      await res.json()
      await fetchListings()
      setStep('done')
    } catch (err: any) {
      setError(err.message)
    }
  }, [itemData, fetchListings])

  const handleRejectPrice = useCallback(async () => {
    if (!itemData || !priceData) return

    try {
      const res = await fetch('/api/suggest-alternatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_name: itemData.item_name,
          condition: itemData.condition,
          rejected_price: priceData.suggested_price,
          comparables: priceData.comparables,
        }),
      })
      const data = await res.json()
      setAlternatives(data.alternatives || [])
    } catch (err: any) {
      setError(err.message)
    }
  }, [itemData, priceData])

  const handleClarifySubmit = useCallback(async () => {
    if (!clarifyAnswer.trim() || !clarifyPhoto) return

    setStep('identifying')
    setError(null)

    try {
      const res = await fetch('/api/clarify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: clarifyAnswer.trim(), photoPath: clarifyPhoto.path }),
      })
      const data = await res.json()

      if (data.error) {
        setError(data.error)
        setStep('clarify')
        return
      }

      if (data.unclear) {
        setClarifyQuestion(data.question)
        setClarifyAnswer('')
        setStep('clarify')
        return
      }

      setItemData({
        item_name: data.item_name,
        condition: data.condition,
        title: data.title,
        description: data.description,
        category: data.category,
        photoUrl: data.photoUrl,
        photoPath: data.photoPath,
        estimated_size: data.estimated_size,
        size_confident: data.size_confident,
      })

      setStep('researching')
      const priceRes = await fetch('/api/price-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_name: data.item_name, condition: data.condition }),
      })
      const priceResult = await priceRes.json()

      if (priceResult.error) {
        setError(priceResult.error)
        setStep('upload')
        return
      }

      setPriceData(priceResult)
      setStep('confirm')
    } catch (err: any) {
      setError(err.message)
      setStep('clarify')
    }
  }, [clarifyAnswer, clarifyPhoto])

  const resetFlow = useCallback(() => {
    setStep('upload')
    setItemData(null)
    setPriceData(null)
    setError(null)
    setClarifyQuestion('')
    setClarifyAnswer('')
    setClarifyPhoto(null)
    setAlternatives([])
  }, [])

  if (showDashboard) {
    return (
      <div className="app">
        <header>
          <h1>AI Secondhand Seller</h1>
          <button onClick={() => { setShowDashboard(false); fetchListings() }} className="btn btn-secondary">
            Sell an Item
          </button>
        </header>
        <main>
          <h2>Your Listings</h2>
          {listings.length === 0 ? (
            <p className="empty-state">No listings yet. Upload a photo to get started!</p>
          ) : (
            <div className="listings-grid">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </main>
      </div>
    )
  }

  return (
    <div className="app">
      <header>
        <h1>AI Secondhand Seller</h1>
        <button onClick={() => { setShowDashboard(true); fetchListings() }} className="btn btn-secondary">
          My Listings {listings.length > 0 && `(${listings.length})`}
        </button>
      </header>

      <main>
        {error && <div className="error-banner">{error}</div>}

        {step === 'upload' && (
          <div className="step-container">
            <h2>What do you want to sell?</h2>
            <p className="subtitle">Upload a photo and our AI agent will handle the rest.</p>
            <PhotoUpload onUpload={handleUpload} />
          </div>
        )}

        {step === 'identifying' && (
          <div className="step-container loading">
            <div className="spinner" />
            <h2>AI is analyzing your item...</h2>
            <p>Identifying item, brand, and condition</p>
          </div>
        )}

        {step === 'clarify' && (
          <div className="step-container">
            <h2>Need Clarification</h2>
            <p>{clarifyQuestion}</p>
            {clarifyPhoto && (
              <img src={`http://localhost:3001${clarifyPhoto.url}`} alt="Uploaded item" className="clarify-photo" />
            )}
            <div className="clarify-input">
              <input
                type="text"
                value={clarifyAnswer}
                onChange={(e) => setClarifyAnswer(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleClarifySubmit() }}
                placeholder="Type your answer..."
                autoFocus
              />
              <button onClick={handleClarifySubmit} className="btn btn-primary" disabled={!clarifyAnswer.trim()}>
                Submit
              </button>
            </div>
            <button onClick={resetFlow} className="btn btn-secondary" style={{ marginTop: '1rem' }}>
              Upload a different photo
            </button>
          </div>
        )}

        {step === 'researching' && (
          <div className="step-container loading">
            <div className="spinner" />
            <h2>Researching prices on eBay...</h2>
            <p>Comparing with similar items to find the best price</p>
          </div>
        )}

        {step === 'confirm' && itemData && priceData && (
          <div className="step-container">
            <div className="confirm-layout">
              <div className="confirm-item">
                <img src={`http://localhost:3001${itemData.photoUrl}`} alt={itemData.title} className="confirm-photo" />
                <div className="confirm-details">
                  <h2>{itemData.title}</h2>
                  <p className="item-description">{itemData.description}</p>
                  <div className="item-tags">
                    <span className="tag">{itemData.condition}</span>
                    <span className="tag">{itemData.category}</span>
                    {itemData.estimated_size && (
                      <span className="tag">{itemData.estimated_size}</span>
                    )}
                  </div>
                  {itemData.size_confident === false && (
                    <div className="size-warning">
                      Size is estimated and may be inaccurate. For better results, retake the photo with a coin or bill placed next to the item for scale reference.
                    </div>
                  )}
                </div>
              </div>

              <div className="price-section">
                <h3>Suggested Price</h3>
                <div className="price-display">${priceData.suggested_price.toFixed(2)}</div>
                <p className="price-reasoning">{priceData.reasoning}</p>
                <div className="price-actions">
                  <button onClick={() => handleConfirmPrice(priceData.suggested_price)} className="btn btn-primary">
                    Accept & List
                  </button>
                  <button onClick={handleRejectPrice} className="btn btn-secondary">
                    Suggest Other Prices
                  </button>
                  <button onClick={resetFlow} className="btn btn-danger">
                    Don't Sell
                  </button>
                </div>

                {alternatives.length > 0 && (
                  <div className="alternatives">
                    <h4>Alternative Prices</h4>
                    {alternatives.map((alt, i) => (
                      <div key={i} className="alt-price">
                        <button onClick={() => handleConfirmPrice(alt.price)} className="btn btn-outline">
                          ${alt.price.toFixed(2)}
                        </button>
                        <span className="alt-reasoning">{alt.reasoning}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="step-container">
            <div className="success-message">
              <div className="success-icon">✓</div>
              <h2>Listing Created!</h2>
              <p>Your item is ready. View it in your dashboard.</p>
              <div className="done-actions">
                <button onClick={resetFlow} className="btn btn-primary">Sell Another Item</button>
                <button onClick={() => { setShowDashboard(true); fetchListings() }} className="btn btn-secondary">
                  View Dashboard
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
