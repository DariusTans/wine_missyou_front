import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage } from '@langchain/core/messages';

interface WineData {
  wine_name: string;
  rating?: number;
  vintage?: number;
  producer?: string;
  blend?: Array<{ grape: string; percentage: number }>;
  region?: string;
  tasting_notes?: string;
}

interface EnhancedWineData extends WineData {
  enhanced_tasting_notes?: string;
  wine_style?: string;
  aging_potential?: string;
  serving_temp?: string;
  decanting_time?: string;
  food_pairings?: string[];
  thai_food_pairings?: Array<{
    name: string;
    nameInThai: string;
    description: string;
    spiceLevel: 'mild' | 'medium' | 'hot';
    pairingReason: string;
  }>;
  similar_wines?: string[];
  price_range?: string;
  collector_notes?: string;
}


//  blend: [
//           { grape: "Nebbiolo", percentage: 100 }
//         ],
interface WineAnalysisResult {
  wine_name: string;
  rating?: number;
  vintage?: number;
  producer?: string;
  region?: string;
  tasting_notes?: string;
  review_date?: string;
  price?: string;
  source_url?: string;
  found: boolean;
  blend?: Array<{ grape: string; percentage: number }>;
  reviews?: Array<{
    critic: string;
    publication: string;
    rating: number;
    maxRating: number;
    review: string;
    reviewDate: string;
  }>;
  error_message?: string;
}

class LangChainWineService {
  private llm: ChatGoogleGenerativeAI | null = null;
  private apiKey: string | null = null;
  private wineDatabase: WineData[] = [];
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;
  private rateLimitDelay = 1000; // 1 second between requests
  private lastRequestTime = 0;

  constructor() {
    this.apiKey = process.env.REACT_APP_GOOGLE_API_KEY || null;
    
    if (this.apiKey) {
      this.llm = new ChatGoogleGenerativeAI({
        apiKey: this.apiKey,
        model: 'gemini-2.0-flash',
        temperature: 0.5,
      });
    } else {
      console.warn('Google API key not found. LangChain features will use mock data.');
    }
    
    // Initialize with sample wine data
    this.initializeWineDatabase();
  }

  private initializeWineDatabase() {
    this.wineDatabase = [
      {
        wine_name: "Château Margaux 2015",
        rating: 98,
        vintage: 2015,
        producer: "Château Margaux",
        region: "Margaux, Bordeaux, France",
        tasting_notes: "Elegant and refined with notes of blackcurrant, violets, and graphite. Silky tannins with exceptional balance."
      },
      {
        wine_name: "Screaming Eagle Cabernet Sauvignon 2018",
        rating: 96,
        vintage: 2018,
        producer: "Screaming Eagle",
        region: "Napa Valley, California",
        tasting_notes: "Bold and concentrated with dark fruit flavors, espresso, and vanilla. Full-bodied with firm tannins."
      },
      {
        wine_name: "Domaine de la Romanée-Conti La Tâche 2017",
        rating: 99,
        vintage: 2017,
        producer: "Domaine de la Romanée-Conti",
        region: "Burgundy, France",
        tasting_notes: "Ethereal Pinot Noir with red fruit, earth, and spice. Incredible complexity and finesse."
      },
      {
        wine_name: "Krug Grande Cuvée NV",
        rating: 94,
        producer: "Krug",
        region: "Champagne, France",
        tasting_notes: "Rich and creamy Champagne with brioche, honey, and citrus notes. Persistent bubbles and long finish."
      },
      {
        wine_name: "Penfolds Grange 2016",
        rating: 97,
        vintage: 2016,
        producer: "Penfolds",
        region: "South Australia",
        tasting_notes: "Iconic Shiraz blend with dark berries, chocolate, and spice. Powerful yet elegant structure."
      }
    ];
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async retryWithBackoff<T>(
    operation: () => Promise<T>, 
    maxRetries = 3,
    baseDelay = 1000
  ): Promise<T> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        const isRateLimited = error?.status === 429 || 
                             error?.message?.includes('429') ||
                             error?.message?.includes('rate limit') ||
                             error?.message?.includes('quota');

        if (attempt === maxRetries || !isRateLimited) {
          throw error;
        }

        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        console.warn(`Rate limit hit, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
        await this.sleep(delay);
      }
    }
    throw new Error('Unexpected error in retry logic');
  }

  private async enqueueRequest<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          // Rate limiting: ensure minimum delay between requests
          const now = Date.now();
          const timeSinceLastRequest = now - this.lastRequestTime;
          if (timeSinceLastRequest < this.rateLimitDelay) {
            await this.sleep(this.rateLimitDelay - timeSinceLastRequest);
          }

          const result = await this.retryWithBackoff(operation);
          this.lastRequestTime = Date.now();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    
    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift()!;
      try {
        await request();
      } catch (error) {
        console.error('Queue processing error:', error);
      }
    }

    this.isProcessingQueue = false;
  }

  async searchWines(query: string): Promise<WineData[]> {
    if (!query) return this.wineDatabase;
    
    const lowerQuery = query.toLowerCase();
    return this.wineDatabase.filter(wine => 
      wine.wine_name.toLowerCase().includes(lowerQuery) ||
      wine.producer?.toLowerCase().includes(lowerQuery) ||
      wine.region?.toLowerCase().includes(lowerQuery) ||
      wine.tasting_notes?.toLowerCase().includes(lowerQuery)
    );
  }

  async chatWithWineExpert(message: string, wineContext?: WineData): Promise<string> {
    if (!this.apiKey || !this.llm) {
      return this.getMockChatResponse(message, wineContext);
    }

    try {
      return await this.enqueueRequest(async () => {
        let contextPrompt = "You are a professional sommelier and wine expert. ";
        
        if (wineContext) {
          contextPrompt += `The user is asking about the wine: ${wineContext.wine_name} ` +
            `from ${wineContext.producer} (${wineContext.region}). ` +
            `Rating: ${wineContext.rating}/100. ` +
            `Tasting notes: ${wineContext.tasting_notes}. `;
        }
        
        contextPrompt += "Please provide helpful, accurate information about wines, pairings, and wine culture.";

        const response = await this.llm!.invoke(contextPrompt + "\n\nUser: " + message);
        return response.content as string;
      });
    } catch (error) {
      console.error('Error in wine chat:', error);
      return this.getMockChatResponse(message, wineContext);
    }
  }

  private getMockChatResponse(message: string, wineContext?: WineData): string {
    if (wineContext) {
      return `Thank you for asking about ${wineContext.wine_name}. This is an excellent wine from ${wineContext.region}. ${wineContext.tasting_notes} Would you like to know more about food pairings or similar wines?`;
    }
    return "I'd be happy to help you with wine recommendations, pairings, or any wine-related questions. What would you like to know?";
  }

  async enhanceWineData(wineData: WineData): Promise<EnhancedWineData> {
    if (!this.apiKey || !this.llm) {
      return this.getMockEnhancedData(wineData);
    }

    try {
      return await this.enqueueRequest(async () => {
        const prompt = `You are a wine expert and sommelier. Given the following wine information, provide enhanced details in JSON format.

Wine Information:
- Name: ${wineData.wine_name || 'Unknown'}
- Producer: ${wineData.producer || 'Unknown'}
- Region: ${wineData.region || 'Unknown'}
- Vintage: ${wineData.vintage || 'Unknown'}
- Rating: ${wineData.rating || 'Unknown'}/100
- Current Tasting Notes: ${wineData.tasting_notes || 'No tasting notes available'}
- Blend: ${wineData.blend || 'Unknown'}

Please provide enhanced information in the following JSON structure:
{
  "enhanced_tasting_notes": "Detailed professional tasting notes with specific flavor compounds and structure analysis",
  "wine_style": "Wine style classification (e.g., 'Full-bodied Cabernet Sauvignon', 'Elegant Burgundian Pinot Noir')",
  "aging_potential": "How long this wine can age and peak drinking window",
  "serving_temp": "Optimal serving temperature range",
  "decanting_time": "Recommended decanting time if applicable",
  "food_pairings": ["List of 4-5 classic food pairings"],
  "thai_food_pairings": [
    {
      "name": "Thai dish name in English",
      "nameInThai": "Thai dish name in Thai script",
      "description": "Brief description of the dish",
      "spiceLevel": "mild|medium|hot",
      "pairingReason": "Why this pairing works with wine characteristics"
    }
  ],
  "similar_wines": ["List of 3-4 similar wines to try"],
  "price_range": "Typical price range for this wine",
  "collector_notes": "Notes for collectors about this wine's investment potential and rarity"
}

Focus on accuracy and provide specific, actionable information.`;

        const response = await this.llm!.invoke("You are a professional sommelier and wine expert. Provide accurate, detailed wine information in the requested JSON format.\n\n" + prompt);

        let responseContent = response.content as string;
        
        // Strip markdown code blocks if present
        responseContent = responseContent.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
        
        const enhancedData = JSON.parse(responseContent);
        
        return {
          ...wineData,
          ...enhancedData
        };
      });
    } catch (error) {
      console.error('Error enhancing wine data:', error);
      return this.getMockEnhancedData(wineData);
    }
  }

  async getWineRecommendations(wineData: WineData, preferences?: string[]): Promise<string[]> {
    if (!this.apiKey || !this.llm) {
      return this.getMockRecommendations(wineData);
    }

    try {
      return await this.enqueueRequest(async () => {
        const prompt = `Based on the wine "${wineData.wine_name}" from ${wineData.region}, ${wineData.producer}, suggest 5 similar wines that someone who enjoys this wine would like. Consider the wine style, region, grape variety, and quality level. Return only a JSON array of wine names.`;

        const response = await this.llm!.invoke("You are a wine expert providing recommendations. Return only a JSON array of wine names.\n\n" + prompt);

        let responseContent = response.content as string;
        
        // Strip markdown code blocks if present
        responseContent = responseContent.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
        
        return JSON.parse(responseContent);
      });
    } catch (error) {
      console.error('Error getting wine recommendations:', error);
      return this.getMockRecommendations(wineData);
    }
  }

  async analyzeSentiment(reviews: string[]): Promise<{ overall: string; individual: Array<{ review: string; sentiment: string; score: number }> }> {
    if (!this.apiKey || !this.llm) {
      return this.getMockSentimentAnalysis(reviews);
    }

    try {
      return await this.enqueueRequest(async () => {
        const prompt = `Analyze the sentiment of these wine reviews and provide a JSON response:
        
Reviews: ${JSON.stringify(reviews)}

Return JSON in this format:
{
  "overall": "positive|neutral|negative",
  "individual": [
    {
      "review": "original review text",
      "sentiment": "positive|neutral|negative", 
      "score": 0.0-1.0
    }
  ]
}`;

        const response = await this.llm!.invoke("You are a sentiment analysis expert. Analyze wine review sentiments accurately.\n\n" + prompt);

        let responseContent = response.content as string;
        
        // Strip markdown code blocks if present
        responseContent = responseContent.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
        
        return JSON.parse(responseContent);
      });
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      return this.getMockSentimentAnalysis(reviews);
    }
  }

  private getMockEnhancedData(wineData: WineData): EnhancedWineData {
    return {
      ...wineData,
      enhanced_tasting_notes: "Rich and full-bodied with notes of dark berries, subtle oak, and elegant tannins. Shows great complexity with layers of flavor that evolve in the glass.",
      wine_style: "Full-bodied Premium Red Wine",
      aging_potential: "Peak drinking: 2024-2035. Can age gracefully for 15+ years.",
      serving_temp: "16-18°C (61-64°F)",
      decanting_time: "30-60 minutes recommended",
      food_pairings: ["Grilled ribeye steak", "Aged hard cheeses", "Lamb with herbs", "Dark chocolate desserts"],
      thai_food_pairings: [
        {
          name: "Massaman Curry with Beef",
          nameInThai: "เนื้อมัสมั่น",
          description: "Rich, mildly spiced curry with tender beef and aromatic spices",
          spiceLevel: "mild" as const,
          pairingReason: "The wine's tannins complement the rich curry while the fruit balances the warm spices"
        },
        {
          name: "Grilled Beef Salad",
          nameInThai: "ยำเนื้อย่าง", 
          description: "Spicy northeastern Thai salad with grilled beef and fresh herbs",
          spiceLevel: "medium" as const,
          pairingReason: "The wine's structure stands up to the bold flavors while the fruit cools the heat"
        }
      ],
      similar_wines: ["Caymus Cabernet Sauvignon", "Silver Oak Alexander Valley", "Opus One", "Château Pichon Baron"],
      price_range: "$150-300",
      collector_notes: "Excellent vintage with strong investment potential. Limited production from prestigious producer."
    };
  }

  private getMockRecommendations(wineData: WineData): string[] {
    return [
      "Domaine de la Romanée-Conti La Tâche",
      "Screaming Eagle Cabernet Sauvignon", 
      "Château Le Pin Pomerol",
      "Krug Grande Cuvée Champagne",
      "Sassicaia Super Tuscan"
    ];
  }

  private getMockSentimentAnalysis(reviews: string[]) {
    return {
      overall: "positive" as const,
      individual: reviews.map(review => ({
        review,
        sentiment: "positive" as const,
        score: 0.85
      }))
    };
  }

  async analyzeWineImage(imageFile: File): Promise<WineAnalysisResult> {
    console.log("Analyzing wine image...");
    console.log("API key: ", this.apiKey);
    console.log("LLM: ", this.llm);
    if (!this.apiKey || !this.llm) {
      console.log("API key or LLM not found. Using mock data.");
      return this.getMockWineAnalysis();
    }

    try {
      return await this.enqueueRequest(async () => {
        // Convert file to base64
        const base64Image = await this.fileToBase64(imageFile);
        
        const prompt = `Analyze this wine bottle image and extract comprehensive wine information. Look carefully at:

        MAIN LABEL:
        1. Wine name (exact name from the label)
        2. Producer/Winery name
        3. Region/Appellation
        4. Vintage year
        5. Wine type/style

        ***🔍 CRITICAL SEARCH: RATINGS & REVIEWS (SCAN ALL LABELS/STICKERS/NECK FOIL)***
        6. Expert ratings/scores (numbers like 95/100, 97 points, etc.)
        7. Critic names (James Suckling, Robert Parker, Wine Spectator, etc.)
        8. Publication logos (Wine Advocate, JamesSuckling.com, etc.)
        9. Review quotes or tasting notes from critics
        10. Review dates

        ADDITIONAL INFO:
        11. Price information
        12. Grape blend composition
        13. Source URLs or QR codes

        Provide the information in this EXACT JSON format:
        {
          "wine_name": "Exact wine name from label",
          "rating": highest_expert_rating_number_if_visible,
          "vintage": year_as_number,
          "producer": "Producer/Winery name", 
          "region": "Wine region/appellation",
          "tasting_notes": "Main critic's tasting notes if visible, otherwise brief description based on wine type",
          "review_date": "YYYY-MM-DD format if visible",
          "price": "Price with currency symbol if visible",
          "source_url": "URL or website if visible",
          "found": true,
          "blend": [
            { "grape": "Grape_name", "percentage": percentage_number }
          ],
          "reviews": [
            {
              "critic": "Critic name (James Suckling, Robert Parker, etc.)",
              "publication": "Publication name (JamesSuckling.com, Wine Advocate, etc.)",
              "rating": rating_number,
              "maxRating": 100,
              "review": "Full review text if visible",
              "reviewDate": "YYYY-MM-DD"
            }
          ]
        }

        IMPORTANT NOTES:
        - **PRIORITY ALERT:** **Thoroughly examine ALL visible areas (front/back label, neck, stickers) for logos, text, and numbers related to wine critics and scores.**
        - Extract **ALL visible ratings/reviews**, not just one.
        - If multiple critics are shown, include all in the 'reviews' array.
        - Use the highest rating as the main "rating" field.
        - For blend, if it's a single varietal, use 100% for that grape.

        If you cannot clearly read the wine label or identify the wine, return:
        {
          "wine_name": "Unknown Wine Label",
          "found": false,
          "error_message": "Unable to identify wine from the provided image. Please ensure the label is clearly visible and try again."
        }
        `;

        const message = new HumanMessage({
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:${imageFile.type};base64,${base64Image}`,
              },
            },
          ],
        });

        const response = await this.llm!.invoke([message]);

        let responseContent = response.content as string;
        
        // Strip markdown code blocks if present
        responseContent = responseContent.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
        
        const analysisResult = JSON.parse(responseContent);
        return analysisResult;
      });
    } catch (error) {
      console.error('Error analyzing wine image:', error);
      return {
        wine_name: "Analysis Error",
        found: false,
        error_message: "Failed to analyze wine image. Please try again."
      };
    }
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = error => reject(error);
    });
  }

  private getMockWineAnalysis(): WineAnalysisResult {
    const mockAnalyses: WineAnalysisResult[] = [
      {
        wine_name: "Roberto Voerzio Barolo Brunate 2017",
        rating: 97,
        vintage: 2017,
        producer: "Roberto Voerzio",
        region: "Piedmont, Italy",
        tasting_notes: "(James Suckling) Very subtle aromas of dried strawberry with cedar and flowers that follow through to a full body with tight, linear tannins that are focused and polished. Earth, spice and stone undertones. Extremely firm and long. Succulent. Racy and driven. Needs four or five years to open.",
        review_date: "2021-11-08",
        price: "$359",
        source_url: "https://www.wine.com/product/roberto-voerzio-barolo-brunate-2017/1221807",
        found: true,
        blend: [
          { grape: "Nebbiolo", percentage: 100 }
        ],
        reviews: [
          {
            critic: "James Suckling",
            publication: "JamesSuckling.com",
            rating: 97,
            maxRating: 100,
            review: "Very subtle aromas of dried strawberry with cedar and flowers that follow through to a full body with tight, linear tannins that are focused and polished. Earth, spice and stone undertones. Extremely firm and long. Succulent. Racy and driven. Needs four or five years to open.",
            reviewDate: "2021-11-08"
          },
          {
            critic: "Robert Parker",
            publication: "Wine Advocate",
            rating: 95,
            maxRating: 100,
            review: "The 2017 Barolo Brunate is absolutely gorgeous, with incredible elegance and finesse. Aromatics include dark cherry, rose petals, and subtle spice. On the palate, it's full-bodied yet graceful, with silky tannins and remarkable length.",
            reviewDate: "2021-10-15"
          }
        ]
      },
      {
        wine_name: "Château Margaux 2015",
        rating: 98,
        vintage: 2015,
        producer: "Château Margaux",
        region: "Margaux, Bordeaux, France",
        tasting_notes: "(Wine Spectator) Elegant and refined with notes of blackcurrant, violets, and graphite. Silky tannins with exceptional balance.",
        review_date: "2021-05-15",
        price: "$899",
        source_url: "https://www.wine-searcher.com/find/ch+margaux+2015",
        found: true,
        blend: [
          { grape: "Cabernet Sauvignon", percentage: 87 },
          { grape: "Merlot", percentage: 10 },
          { grape: "Petit Verdot", percentage: 2 },
          { grape: "Cabernet Franc", percentage: 1 }
        ],
        reviews: [
          {
            critic: "Wine Spectator",
            publication: "Wine Spectator",
            rating: 98,
            maxRating: 100,
            review: "Elegant and refined with notes of blackcurrant, violets, and graphite. Silky tannins with exceptional balance.",
            reviewDate: "2021-05-15"
          }
        ]
      }
    ];
    
    return mockAnalyses[Math.floor(Math.random() * mockAnalyses.length)];
  }
}

export const wineService = new LangChainWineService();
export type { EnhancedWineData, WineAnalysisResult };