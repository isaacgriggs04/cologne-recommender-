import Anthropic from '@anthropic-ai/sdk';
import fragranceData from '../../fragrances_filtered.json';

// Initialize Anthropic client only when API key is available
const getAnthropicClient = () => {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('API Key check:', {
      envVar: import.meta.env.VITE_ANTHROPIC_API_KEY,
      allEnvKeys: Object.keys(import.meta.env).filter(k => k.includes('ANTHROPIC'))
    });
    throw new Error('VITE_ANTHROPIC_API_KEY is not set in environment variables. Make sure the .env file exists and restart the dev server.');
  }
  // Verify API key format
  if (!apiKey.startsWith('sk-ant-')) {
    throw new Error('Invalid API key format. API key should start with "sk-ant-"');
  }
  // WARNING: dangerouslyAllowBrowser exposes your API key in the browser
  // This is only for development. For production, use a backend proxy.
  return new Anthropic({ 
    apiKey,
    dangerouslyAllowBrowser: true 
  });
};

// Tool definition for searching fragrances
const searchFragrancesTool = {
  name: 'search_fragrances',
  description: 'Search for fragrances based on criteria like accords, notes, gender, season, occasion, price range, or keywords. Returns matching fragrances with their details.',
  input_schema: {
    type: 'object',
    properties: {
      accords: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of accords to search for (e.g., ["woody", "spicy", "citrus", "vanilla"])'
      },
      notes: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of notes to search for (e.g., ["vanilla", "sandalwood", "pepper"])'
      },
      gender: {
        type: 'string',
        enum: ['men', 'women', 'unisex'],
        description: 'Filter by gender preference'
      },
      season: {
        type: 'string',
        enum: ['spring', 'summer', 'fall', 'winter'],
        description: 'Filter by best season to wear'
      },
      occasion: {
        type: 'string',
        description: 'Filter by occasion (e.g., "casual", "professional", "night out", "date")'
      },
      priceMax: {
        type: 'number',
        description: 'Maximum price in USD'
      },
      priceMin: {
        type: 'number',
        description: 'Minimum price in USD'
      },
      minRating: {
        type: 'number',
        description: 'Minimum rating (0-5)'
      },
      maxResults: {
        type: 'number',
        description: 'Maximum number of results to return (default: 20, max: 50)'
      },
      keywords: {
        type: 'array',
        items: { type: 'string' },
        description: 'Keywords to search in fragrance name or brand (e.g., ["creed", "dior"])'
      }
    }
  }
};

// Tool handler: Search and filter fragrances
const handleSearchFragrances = (args) => {
  let results = [...fragranceData];
  const limit = Math.min(args.maxResults || 20, 50); // Cap at 50

  // Filter by gender
  if (args.gender) {
    results = results.filter(f => {
      const gender = (f.Gender || '').toLowerCase();
      return gender.includes(args.gender);
    });
  }

  // Filter by price
  if (args.priceMin !== undefined || args.priceMax !== undefined) {
    results = results.filter(f => {
      const price = parseFloat(f.Price) || 0;
      if (args.priceMin !== undefined && price < args.priceMin) return false;
      if (args.priceMax !== undefined && price > args.priceMax) return false;
      return true;
    });
  }

  // Filter by rating
  if (args.minRating !== undefined) {
    results = results.filter(f => {
      const rating = parseFloat(f.rating) || 0;
      return rating >= args.minRating;
    });
  }

  // Filter by keywords (name or brand)
  if (args.keywords && args.keywords.length > 0) {
    results = results.filter(f => {
      const name = (f.Name || '').toLowerCase();
      const brand = (f.Brand || '').toLowerCase();
      return args.keywords.some(keyword => 
        name.includes(keyword.toLowerCase()) || 
        brand.includes(keyword.toLowerCase())
      );
    });
  }

  // Score and rank by relevance
  const scored = results.map(fragrance => {
    let score = 0;
    const accords = (fragrance['Main Accords'] || []).map(a => a.toLowerCase());
    const notes = (fragrance['General Notes'] || []).map(n => n.toLowerCase());
    const seasonRanking = fragrance['Season Ranking'] || [];
    const occasionRanking = fragrance['Occasion Ranking'] || [];

    // Score accords (higher weight)
    if (args.accords && args.accords.length > 0) {
      args.accords.forEach(accord => {
        const accordLower = accord.toLowerCase();
        if (accords.some(a => a.includes(accordLower))) {
          score += 3;
        }
      });
    }

    // Score notes
    if (args.notes && args.notes.length > 0) {
      args.notes.forEach(note => {
        const noteLower = note.toLowerCase();
        if (notes.some(n => n.includes(noteLower))) {
          score += 2;
        }
      });
    }

    // Score season (weighted by ranking)
    if (args.season) {
      const seasonMatch = seasonRanking.find(s => 
        s.name.toLowerCase() === args.season.toLowerCase()
      );
      if (seasonMatch) {
        score += seasonMatch.score * 2;
      }
    }

    // Score occasion (weighted by ranking)
    if (args.occasion) {
      const occasionMatch = occasionRanking.find(o => 
        o.name.toLowerCase().includes(args.occasion.toLowerCase())
      );
      if (occasionMatch) {
        score += occasionMatch.score * 2;
      }
    }

    // Boost by rating (prefer higher rated)
    const rating = parseFloat(fragrance.rating) || 0;
    score += rating * 0.5;

    return { fragrance, score };
  });

  // Sort by score and format results
  const topResults = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => ({
      Name: item.fragrance.Name,
      Brand: item.fragrance.Brand,
      Gender: item.fragrance.Gender,
      Rating: item.fragrance.rating,
      Price: item.fragrance.Price || 'N/A',
      OilType: item.fragrance.OilType,
      Longevity: item.fragrance.Longevity,
      Sillage: item.fragrance.Sillage,
      Accords: item.fragrance['Main Accords'] || [],
      Notes: item.fragrance['General Notes'] || [],
      SeasonRanking: item.fragrance['Season Ranking'] || [],
      OccasionRanking: item.fragrance['Occasion Ranking'] || [],
      ImageURL: item.fragrance['Image URL'],
    }));

  return {
    count: topResults.length,
    fragrances: topResults
  };
};

export const getFragranceRecommendation = async (userInput, conversationHistory = []) => {
  try {
    // Check if API key is available
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('API key is not set. Please check your .env file and restart the dev server.');
    }

    const anthropic = getAnthropicClient();
    
    // Build messages array with conversation history
    const messages = [...conversationHistory, {
      role: 'user',
      content: userInput
    }];

    // First API call - Claude may request tools
    let response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      tools: [searchFragrancesTool],
      system: `You are a cologne savant tasked with helping users find a cologne that's well suited for them.

You have access to a fragrance database through the search_fragrances tool. Use this tool to find relevant fragrances when:
- The user asks for recommendations
- The user describes what they're looking for
- The user mentions preferences (accords, notes, season, occasion, gender, price)
- You need to provide specific fragrance suggestions

IMPORTANT: Only recommend fragrances that exist in the database. Always use the search_fragrances tool to find fragrances before recommending them. When recommending, use the exact Name and Brand from the search results.

You will first ask the user if they know what cologne they are looking for or not.

There are 2 scenarios that will be presented:

## User doesn't know what type of cologne they're looking for

When a user doesn't know what they're looking for, your job is to figure out what type of scents they would like. You will then create a scent profile of the user and use that to recommend colognes from the database. Probe the user with binary questions (ask one question at a time) to narrow down the different scents that the user is interested in. It shouldn't feel like a quiz but more like a conversation. Keep in mind that a person who doesn't know what they're looking for will typically be less knowledgeable about cologne, so make sure questions are easy to understand such as "do you like the smell of ice cream?" or "are you interested in something spicy?". Ask for the weather question first and keep it simple: colder weather, hotter weather, or year round. When describing things like warm and cozy scents, try and give a real world picture of the scents. Don't describe elements like sweet or earthy with other notes - try and use examples so users can picture what that means.

Once you understand their preferences, use the search_fragrances tool to find matching fragrances.

## User knows what type of cologne they're looking for

When a user knows what type of scent they're looking for, your job is to take the description given by the user and use the search_fragrances tool to find matching fragrances. Provide 10 cologne suggestions from the search results, each with a brief description. You will then ask the user if they are interested in any of the recommendations. If they are interested, ask if they want a more detailed description. If they are not interested, then search again with different criteria and provide 10 more suggestions. Continue this process until the user is interested with one of the suggestions. When a user knows what type of scent they're looking for, try not to ask too many follow up questions.

## Knowledge

When describing fragrances, use the notes, longevity, sillage, price, ratings, and season information from the search results to paint a picture of what a cologne smells like. When giving recommendations, try and describe scents within the context of the real world instead of just listing notes.`,
      messages: messages
    });

    // Handle tool calls in a loop
    while (response.stop_reason === 'tool_use') {
      const toolCalls = response.content.filter(item => item.type === 'tool_use');
      
      // Process each tool call
      const toolResults = toolCalls.map(toolCall => {
        if (toolCall.name === 'search_fragrances') {
          try {
            const results = handleSearchFragrances(toolCall.input);
            return {
              type: 'tool_result',
              tool_use_id: toolCall.id,
              content: JSON.stringify(results, null, 2)
            };
          } catch (error) {
            return {
              type: 'tool_result',
              tool_use_id: toolCall.id,
              content: JSON.stringify({ error: error.message })
            };
          }
        }
        return null;
      }).filter(Boolean);

      // Add assistant's tool use to messages
      messages.push({
        role: 'assistant',
        content: response.content
      });
      
      // Add tool results to messages
      messages.push({
        role: 'user',
        content: toolResults
      });

      // Get Claude's response with tool results
      response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        tools: [searchFragrancesTool],
        messages: messages
      });
    }

    // Extract final response text
    if (response.content && response.content.length > 0) {
      const textContent = response.content.find(item => item.type === 'text');
      if (textContent) {
        return textContent.text;
      }
      // Fallback if no text content
      return response.content[0].text || 'I apologize, but I encountered an issue processing your request.';
    }
    
    throw new Error('No response content received');
  } catch (error) {
    console.error('Error calling Claude API:', error);
    
    // Provide more specific error messages
    if (error.message?.includes('API key')) {
      throw new Error('API key error: ' + error.message);
    } else if (error.status === 401) {
      throw new Error('Invalid API key. Please check your API key in the .env file.');
    } else if (error.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    } else if (error.message) {
      throw new Error('API Error: ' + error.message);
    } else {
      throw new Error('Failed to connect to Claude API. Please check your internet connection and API key.');
    }
  }
};
