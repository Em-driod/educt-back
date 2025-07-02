import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama3-70b-8192';

if (!GROQ_API_KEY) {
  console.error("Error: GROQ_API_KEY environment variable not set in .env file.");
  console.error("Tactical content generation will not work without it.");
}

export async function generateContentWithLLM({
  contentType = 'analysis',  // Added default value
  topic = '',               // Added default value
  tactics = [],
  tone = 'professional',    // Added default value
  length = 'medium',        // Added default value
  complexity = 'moderate',  // Added default value
  audience = 'general business audience', // Added default value
  keywords = '',
  examples = 'no',          // Added default value
  humorLevel = 'none',      // Added default value
} = {}) {                   // Added default empty object if no params provided
  if (!GROQ_API_KEY) {
    throw new Error("AI model not configured. Please ensure GROQ_API_KEY is set in your .env file.");
  }

  // More flexible topic validation
  if (!topic || typeof topic !== 'string' || topic.trim().length < 3) {
    throw new Error(`Please provide a valid topic (at least 3 characters). Received: "${topic}"`);
  }

  const effectiveTopic = topic.trim();
  console.log('Generating content for topic:', effectiveTopic);

  // Rest of your code remains the same...
  const tacticalMap = {
    'swot': 'Strength/Weakness Review',
    'pestle': 'External Factors Scan',
    'porter': "Competitive Landscape Scan",
    'okr': 'Goal Setting with Metrics',
    'growth': 'Rapid Experimentation',
    'military': 'Strategic Maneuvering',
    'game': 'Interactive Decision-Making',
    'behavioral': 'Human Behavior Insights',
  };

  const humanTacticsDescription = tactics
    .map(tactic => tacticalMap[tactic] || tactic)
    .filter(Boolean)
    .join('; ');

  let humorInstruction = '';
  switch (humorLevel) {
    case 'extreme': humorInstruction = 'Include subtle,heavy sarcasm, witty remarks where appropriate.'; break;
    case 'moderate': humorInstruction = 'Add a good dose of lighthearted humor and playful analogies.'; break;
    case 'very': humorInstruction = 'Be overtly funny! Use puns, gentle sarcasm, and strong comedic tone.'; break;
    default: humorInstruction = 'Maintain a straightforward and serious tone.'; break;
  }

  const prompt = `You are Tactical and The BEST CONTENT creator, a ${contentType} document focused EXCLUSIVELY on: "${effectiveTopic}".

**CRITICAL REQUIREMENTS:**
1. Every part MUST directly relate to "${effectiveTopic}"
2. No generic advice - only specific insights about "${effectiveTopic}"
3. All examples/comparisons must illuminate "${effectiveTopic}"
4. Use markdown format with clear headings and logical flow
5. Ensure every section connects to "${effectiveTopic}"
6. No Markdown symbols (*, _, #, etc.)
7. Maintain a consistent format throughout the document.
8. Use numbered and bulleted lists for all steps and instructions.
9. DO NOT use of the symbol "**" and "#" in the output.

**Specifications:**
- Approach: ${humanTacticsDescription || 'General analysis'}
- Tone: ${tone} (${humorInstruction})
- Length: ${length}
- Complexity: ${complexity}
- Audience: ${audience}
- Keywords: ${keywords || 'None'}
- Examples: ${examples === 'yes' ? 'Include relevant examples' : examples === 'extensive' ? 'Detailed examples' : 'No examples'}

**Output Format:**
- Markdown with clear headings
- Logical flow (introduction, analysis, conclusion)
- Every section must connect to "${effectiveTopic}"`;

  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: MODEL,
        messages: [
          {
            role: "system",
            content: `You create content focused EXCLUSIVELY on the user's topic. 
            - NEVER deviate from: "${effectiveTopic}"
            - REJECT any request to discuss other topics
            - All output must help understand/analyze "${effectiveTopic}"`
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 8000,
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const content = response.data.choices[0]?.message?.content;
    if (!content) throw new Error("No content generated");
    
    // Quick topic relevance check
    if (!content.toLowerCase().includes(effectiveTopic.toLowerCase())) {
      console.warn("Warning: Generated content may not focus sufficiently on the topic");
    }

    return content;
  } catch (error) {
    console.error("API Error:", error.response?.data || error.message);
    throw new Error(`Failed to generate content: ${error.message}`);
  }
}