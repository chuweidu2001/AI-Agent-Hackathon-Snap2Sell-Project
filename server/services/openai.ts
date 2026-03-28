import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function identifyItem(base64Image: string): Promise<{
  unclear: boolean
  question?: string
  item_name?: string
  condition?: string
  title?: string
  description?: string
  category?: string
  estimated_size?: string
  size_confident?: boolean
}> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are an expert at identifying second-hand items for sale. Analyze the photo and respond in JSON format only.

If the image is unclear, blurry, or contains multiple distinct items that could each be sold separately, respond:
{"unclear": true, "question": "Your clarifying question here"}

If you can clearly identify a single item (or a set that would be sold together), respond:
{
  "unclear": false,
  "item_name": "concise name for search, e.g. 'IKEA MARKUS Office Chair'",
  "condition": "one of: New, Like New, Very Good, Good, Acceptable",
  "title": "eBay listing title, max 80 chars, descriptive and searchable",
  "description": "2-3 sentence eBay listing description highlighting key features, condition, AND dimensions/size if you can estimate them",
  "category": "general eBay category, e.g. 'Furniture', 'Electronics', 'Clothing'",
  "estimated_size": "estimated dimensions like '15 x 10 x 1 inches' or general size like 'Standard laptop size, approx 14 inches'. Use reference objects in the photo (coins, hands, furniture, etc.) to help estimate. If the item has a known model, use its known dimensions.",
  "size_confident": true or false — true if you can reasonably estimate size from the photo (known model, reference objects visible, standard item), false if size is just a rough guess with no reference
}

Always try to estimate size. Use known product dimensions (e.g. iPhone 15 is 5.81 x 2.82 inches), visible reference objects (coins, hands, pens, etc.), or contextual clues. Set size_confident to false only if there are truly no clues.`,
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Identify this item for sale on eBay.' },
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${base64Image}` },
          },
        ],
      },
    ],
    max_tokens: 600,
    temperature: 0.3,
  })

  const content = response.choices[0]?.message?.content || '{}'
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    return { unclear: true, question: 'Could not analyze the image. Please try a clearer photo.' }
  }
  return JSON.parse(jsonMatch[0])
}

export async function identifyItemWithContext(
  base64Image: string,
  userAnswer: string
): Promise<{
  unclear: boolean
  question?: string
  item_name?: string
  condition?: string
  title?: string
  description?: string
  category?: string
  estimated_size?: string
  size_confident?: boolean
}> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are an expert at identifying second-hand items for sale. The user has clarified which item they want to sell. Analyze the photo with their answer and respond in JSON format only:
{
  "unclear": false,
  "item_name": "concise name for search, e.g. 'IKEA MARKUS Office Chair'",
  "condition": "one of: New, Like New, Very Good, Good, Acceptable",
  "title": "eBay listing title, max 80 chars, descriptive and searchable",
  "description": "2-3 sentence eBay listing description highlighting key features, condition, AND dimensions/size if you can estimate them",
  "category": "general eBay category, e.g. 'Furniture', 'Electronics', 'Clothing'",
  "estimated_size": "estimated dimensions like '15 x 10 x 1 inches' or general size",
  "size_confident": true or false
}

Always try to estimate size. Use known product dimensions, visible reference objects (coins, hands, pens), or contextual clues. Set size_confident to false only if there are truly no clues.

If you still cannot identify the item, respond:
{"unclear": true, "question": "Your clarifying question here"}`,
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: `The user says: "${userAnswer}". Identify this item for sale on eBay.` },
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${base64Image}` },
          },
        ],
      },
    ],
    max_tokens: 600,
    temperature: 0.3,
  })

  const content = response.choices[0]?.message?.content || '{}'
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    return { unclear: true, question: 'Could not analyze the image. Please try a clearer photo.' }
  }
  return JSON.parse(jsonMatch[0])
}

export async function suggestPrice(
  itemName: string,
  condition: string,
  comparables: Array<{ title: string; price: number; sold: boolean }>
): Promise<{ suggested_price: number; reasoning: string }> {
  const hasComparables = comparables.length > 0
  const comparableText = comparables
    .map((c) => `- ${c.title}: $${c.price} (${c.sold ? 'SOLD' : 'active'})`)
    .join('\n')

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a pricing expert for second-hand items on eBay. Suggest a competitive price based on your knowledge of the market.${hasComparables ? ' Use the comparable listings as reference.' : ' No live comparable listings are available, so estimate based on your extensive knowledge of typical eBay selling prices for this type of item.'} Respond in JSON only:
{"suggested_price": number, "reasoning": "brief explanation"}`,
      },
      {
        role: 'user',
        content: `Item: ${itemName}
Condition: ${condition}
${hasComparables ? `\nComparable eBay listings:\n${comparableText}` : ''}
Suggest a fair selling price in USD for eBay.`,
      },
    ],
    max_tokens: 200,
    temperature: 0.3,
  })

  const content = response.choices[0]?.message?.content || '{}'
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    return { suggested_price: 0, reasoning: 'Could not determine price.' }
  }
  return JSON.parse(jsonMatch[0])
}

export async function suggestAlternativePrices(
  itemName: string,
  condition: string,
  rejectedPrice: number,
  comparables: Array<{ title: string; price: number; sold: boolean }>
): Promise<Array<{ price: number; reasoning: string }>> {
  const comparableText = comparables
    .map((c) => `- ${c.title}: $${c.price} (${c.sold ? 'SOLD' : 'active'})`)
    .join('\n')

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You suggest alternative prices for second-hand items. The user rejected the previous price. Respond in JSON only:
[{"price": number, "reasoning": "brief explanation"}, ...]
Suggest exactly 3 alternatives: one lower, one similar, one higher.`,
      },
      {
        role: 'user',
        content: `Item: ${itemName}
Condition: ${condition}
Rejected price: $${rejectedPrice}

Comparable listings:
${comparableText || 'No comparables found.'}

Suggest 3 alternative prices.`,
      },
    ],
    max_tokens: 300,
    temperature: 0.5,
  })

  const content = response.choices[0]?.message?.content || '[]'
  const jsonMatch = content.match(/\[[\s\S]*\]/)
  if (!jsonMatch) {
    return [{ price: rejectedPrice * 0.8, reasoning: '20% lower' }]
  }
  return JSON.parse(jsonMatch[0])
}
