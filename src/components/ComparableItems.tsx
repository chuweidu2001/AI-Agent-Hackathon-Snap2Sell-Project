interface ComparableItem {
  title: string
  price: number
  link: string
  image: string
  sold: boolean
}

interface ComparableItemsProps {
  active: ComparableItem[]
  sold: ComparableItem[]
}

export function ComparableItems({ active, sold }: ComparableItemsProps) {
  const renderItems = (items: ComparableItem[], label: string) => {
    if (items.length === 0) return null
    return (
      <div className="comparable-section">
        <h4>{label}</h4>
        <div className="comparable-grid">
          {items.map((item, i) => (
            <a key={i} href={item.link} target="_blank" rel="noopener noreferrer" className="comparable-card">
              {item.image && <img src={item.image} alt={item.title} className="comparable-img" />}
              <div className="comparable-info">
                <p className="comparable-title">{item.title.slice(0, 60)}</p>
                <p className="comparable-price">${item.price.toFixed(2)}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="comparables">
      <h3>Market Research</h3>
      {renderItems(sold, 'Recently Sold')}
      {renderItems(active, 'Currently Listed')}
      {active.length === 0 && sold.length === 0 && (
        <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>
          Live eBay comparables unavailable — price estimated by AI based on market knowledge.
        </p>
      )}
    </div>
  )
}
