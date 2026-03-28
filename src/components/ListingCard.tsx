interface Listing {
  id: string
  title: string
  description: string
  item_name: string
  condition: string
  price: number
  category: string
  photo_url: string
  status: string
  ebay_url?: string
  created_at: string
}

interface ListingCardProps {
  listing: Listing
}

export function ListingCard({ listing }: ListingCardProps) {
  const statusColors: Record<string, string> = {
    draft: '#f59e0b',
    confirmed: '#3b82f6',
    posted: '#10b981',
    ready: '#8b5cf6',
  }

  return (
    <div className="listing-card">
      {listing.photo_url && (
        <img src={`http://localhost:3001${listing.photo_url}`} alt={listing.title} className="listing-img" />
      )}
      <div className="listing-info">
        <div className="listing-header">
          <h3>{listing.title}</h3>
          <span className="listing-status" style={{ background: statusColors[listing.status] || '#6b7280' }}>
            {listing.status}
          </span>
        </div>
        <p className="listing-desc">{listing.description}</p>
        <div className="listing-meta">
          <span className="listing-price">${listing.price?.toFixed(2)}</span>
          <span className="listing-condition">{listing.condition}</span>
          <span className="listing-category">{listing.category}</span>
        </div>
        {listing.ebay_url && (
          <a href={listing.ebay_url} target="_blank" rel="noopener noreferrer" className="ebay-link">
            View on eBay
          </a>
        )}
      </div>
    </div>
  )
}

export type { Listing }
