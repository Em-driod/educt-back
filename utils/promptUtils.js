// utils/promptUtils.js

/**
 * Constructs a detailed prompt for the LLM based on content generation parameters.
 * @param {object} params - The parameters for content generation.
 * @param {string} params.contentType - The type of content (e.g., 'strategy').
 * @param {string} params.topic - The main topic of the content.
 * @param {string[]} params.tactics - Array of selected tactical approaches.
 * @param {string} params.tone - The desired tone.
 * @param {string} params.length - The desired length ('short', 'medium', 'long', 'extensive').
 * @param {string} params.complexity - The complexity level.
 * @param {string} params.audience - The target audience.
 * @param {string} params.keywords - Comma-separated keywords.
 * @param {string} params.examples - Whether to include examples ('yes', 'no', 'extensive').
 * @returns {string} The constructed LLM prompt.
 */
export function buildTacticalContentPrompt({
  contentType,
  topic,
  tactics,
  tone,
  length,
  complexity,
  audience,
  keywords,
  examples,
}) {
  // Map frontend length to a more specific word count range for the LLM
  const lengthMap = {
    'short': '300-500 words',
    'medium': '800-1200 words',
    'long': '1500-2000 words',
    'extensive': '2500+ words'
  };
  const requestedLength = lengthMap[length] || '800-1200 words'; // Fallback to medium

  // Map frontend examples to LLM instruction
  let examplesInstruction = "";
  if (examples === 'yes') {
    examplesInstruction = "Include relevant real-world or hypothetical examples to illustrate points effectively.";
  } else if (examples === 'extensive') {
    examplesInstruction = "Provide comprehensive and detailed examples for every concept explained, ensuring deep understanding.";
  } else {
    examplesInstruction = "Do NOT include any examples.";
  }

  // Clean up tactic names for better prompt readability (e.g., 'swot' -> 'SWOT Analysis')
  const formattedTactics = tactics.map(t => {
    switch (t) {
      case 'swot': return 'SWOT Analysis';
      case 'pestle': return 'PESTLE Analysis';
      case 'porter': return "Porter's 5 Forces";
      case 'okr': return 'OKR Framework';
      case 'growth': return 'Growth Hacking';
      case 'military': return 'Military Strategy';
      case 'game': return 'Game Theory';
      case 'behavioral': return 'Behavioral Economics';
      // Default: Convert snake_case or kebab-case to Title Case, handle multiple words
      default:
        return t.replace(/[_-]/g, ' ') // Replace underscores/hyphens with spaces
                .split(' ') // Split into words
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize first letter of each word
                .join(' '); // Join back with spaces
    }
  }).join(', ');

  // Format content type for readability (e.g., 'blog_post' -> 'Blog Post')
  const formattedContentType = contentType.replace(/_/g, ' ')
                                        .split(' ')
                                        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                                        .join(' ');

  // Format tone for readability
  const formattedTone = tone.charAt(0).toUpperCase() + tone.slice(1).toLowerCase();

  // Format complexity for readability
  const formattedComplexity = complexity.charAt(0).toUpperCase() + complexity.slice(1).toLowerCase();

  const prompt = `As a highly skilled content strategist and tactical expert, generate a piece of content for the following topic and specifications:

Content Type: ${formattedContentType}
Main Topic: ${topic}
Tactical Approaches to Integrate: ${formattedTactics}
Tone: ${formattedTone}
Desired Length: Approximately ${requestedLength}
Complexity Level: ${formattedComplexity}${audience ? `
Target Audience: ${audience}` : ''}${keywords ? `
Key Terms to Include: ${keywords}` : ''}

${examplesInstruction}

Structure the content logically with clear headings and subheadings. Ensure the language is precise, insightful, and directly addresses the tactical application of the chosen frameworks to the main topic. The output should be ready for publication.`;

  return prompt.trim(); // Trim leading/trailing whitespace from the entire prompt
}