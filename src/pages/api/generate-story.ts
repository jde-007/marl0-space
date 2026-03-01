import type { APIRoute } from 'astro';

const LLM_URL = 'http://192.168.1.38:11434/v1/chat/completions';
const MODEL = 'cognitivecomputations_qwen3-72b-embiggened';

// Reading time to pages mapping (based on ~150 words/minute read-aloud speed)
const READING_TIME_CONFIG: Record<number, { pages: number; wordsPerPage: string }> = {
  2: { pages: 3, wordsPerPage: '30-40' },
  5: { pages: 5, wordsPerPage: '40-50' },
  10: { pages: 10, wordsPerPage: '45-55' },
  15: { pages: 15, wordsPerPage: '45-55' }
};

// Age-appropriate guidelines
const getAgeGuidelines = (age: number) => {
  if (age <= 3) {
    return {
      vocabulary: 'Use only basic nouns and verbs a toddler knows. No abstract concepts.',
      sentences: 'Maximum 6 words per sentence. Use repetition and rhythm.',
      emotional: 'Single emotions only (happy, sad, scared, excited). Immediate resolution.',
      style: 'Focus on sensory experiences: sounds, colors, textures. Use onomatopoeia.'
    };
  } else if (age <= 5) {
    return {
      vocabulary: 'Simple words with occasional "big kid" vocabulary understood in context.',
      sentences: '6-10 words per sentence. Simple compound sentences with "and" or "but".',
      emotional: 'Mild tension allowed but resolve quickly. Build confidence.',
      style: 'Repetitive phrases children can "read along" with. Call-and-response patterns.'
    };
  } else if (age <= 7) {
    return {
      vocabulary: 'Expanded vocabulary with context clues. Playful made-up words welcome.',
      sentences: 'Mix short punchy sentences with longer descriptive ones. Vary rhythm.',
      emotional: 'Can sustain mild suspense across 1-2 pages. Include problem-solving.',
      style: 'Humor, wordplay, and surprises. Character can have a flaw they overcome.'
    };
  } else {
    return {
      vocabulary: 'Rich descriptive language. Challenge with new words.',
      sentences: 'Complex sentences welcome. Use dialogue to reveal character.',
      emotional: 'Moral complexity allowed. Character growth through the story.',
      style: 'Subplots, secondary characters, cause-and-effect chains.'
    };
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const { name, age, topics, readingTime = 5 } = await request.json();
    
    if (!name || !topics || topics.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const topicsList = topics.join(', ');
    const config = READING_TIME_CONFIG[readingTime] || READING_TIME_CONFIG[5];
    const guidelines = getAgeGuidelines(age);
    const numPages = config.pages;
    
    // Build page structure instructions
    let pageStructure = '';
    if (numPages === 3) {
      pageStructure = `
PAGE 1 (Setup + Catalyst): Introduce ${name} with personality through ACTION. Something happens that calls them to adventure.
PAGE 2 (Challenge + Climax): ${name} faces a challenge involving ${topicsList}. Peak excitement as they succeed!
PAGE 3 (Resolution): Celebrate victory. Show what ${name} learned. End warmly.`;
    } else if (numPages === 5) {
      pageStructure = `
PAGE 1 (Hook): Introduce ${name} doing something that shows personality. End with intrigue.
PAGE 2 (Catalyst): Something changes. ${name} chooses to engage with ${topicsList}.
PAGE 3 (Challenge): ${name} tries and struggles. Sensory details. Build tension.
PAGE 4 (Triumph): ${name} succeeds using their own qualities. Peak excitement!
PAGE 5 (Warmth): Quiet resolution. Show growth. End on a feeling, not a summary.`;
    } else {
      // 10 or 15 pages - expanded structure
      pageStructure = `
Structure the ${numPages} pages as follows:
- Pages 1-2: SETUP - Introduce ${name} and their world. Show personality through action. Hint at what they love.
- Pages 3-4: CATALYST - Something changes! A discovery or problem that calls ${name} to action involving ${topicsList}.
- Pages 5-${Math.floor(numPages * 0.6)}: ADVENTURE - ${name} explores, meets characters, faces challenges. Include sensory details.
- Pages ${Math.floor(numPages * 0.6) + 1}-${numPages - 2}: CLIMAX - Building tension! Obstacles to overcome. ${name} must use their unique qualities.
- Pages ${numPages - 1}-${numPages}: RESOLUTION - Victory! What ${name} learned. Warm, satisfying ending.`;
    }
    
    const prompt = `Write a children's storybook for ${name}, age ${age}.
Topics to weave into the adventure: ${topicsList}
Reading time: ${readingTime} minutes

## LANGUAGE (age ${age})
- Vocabulary: ${guidelines.vocabulary}
- Sentences: ${guidelines.sentences}
- Emotional range: ${guidelines.emotional}
- Style: ${guidelines.style}
- Words per page: ${config.wordsPerPage}

## STORY STRUCTURE (${numPages} pages)
${pageStructure}

## CHARACTER RULES
- Give ${name} ONE distinctive trait that causes both the problem AND the solution
- ${name} must DO things (active verbs only) - never just watch or feel
- ${age >= 5 ? `Include at least one line of dialogue from ${name}` : 'Actions speak louder than words'}

## CRAFT REQUIREMENTS
- First line must hook attention (NEVER "Once upon a time")
- Each page ends with "page-turn motivation" (what happens next?)
- Include one moment of genuine humor or surprise
- AVOID: "The End", "happily ever after", "it was the best day ever"
- Write for READ-ALOUD performance - it should sound good spoken

Respond with ONLY valid JSON:
{
  "title": "Creative, specific title",
  "pages": [
    {"text": "Page 1 text..."},
    ... (exactly ${numPages} pages)
  ]
}`;

    const response = await fetch(LLM_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { 
            role: 'system', 
            content: `You are a children's book author trained in the style of Mo Willems, Julia Donaldson, and Oliver Jeffers.

VOICE: Write for the ear, not the eye—these stories are READ ALOUD. Every sentence should be fun to perform.

SAFETY (non-negotiable):
- No death, violence, or permanent loss
- No abandonment by parents/caregivers
- Fears must be resolved within the story
- Stories end with the child safe, loved, and confident

Respond with valid JSON only, no explanation or markdown.`
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.9,
        max_tokens: numPages <= 5 ? 1500 : 3000
      })
    });
    
    if (!response.ok) {
      console.error('LLM request failed:', response.status, await response.text());
      throw new Error('LLM request failed');
    }
    
    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || '';
    
    // Strip <think> tags if present (reasoning model)
    content = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response:', content);
      throw new Error('Invalid response format');
    }
    
    const story = JSON.parse(jsonMatch[0]);
    
    // Validate structure
    if (!story.title || !Array.isArray(story.pages) || story.pages.length === 0) {
      throw new Error('Invalid story structure');
    }
    
    return new Response(JSON.stringify(story), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Story generation error:', error);
    
    // Fallback story if LLM fails
    let body;
    try {
      body = await request.clone().json();
    } catch {
      body = {};
    }
    const { name = 'our hero', topics = ['adventure'], readingTime = 5 } = body;
    const numPages = READING_TIME_CONFIG[readingTime]?.pages || 5;
    
    const fallbackPages = [
      { text: `${name} woke up to find something strange outside the window—something that sparkled.` },
      { text: `"I have to see what that is!" ${name} grabbed a flashlight and tiptoed outside.` },
      { text: `There, hidden in the garden, was a tiny door covered in ${topics[0] || 'magical'} patterns!` },
      { text: `${name} knocked twice. The door swung open to reveal a world full of ${topics.slice(0, 2).join(' and ')}.` },
      { text: `After the most amazing adventure, ${name} smiled and whispered, "I'll be back tomorrow."` }
    ];
    
    // Adjust pages for reading time
    const fallbackStory = {
      title: `${name} and the Secret Door`,
      pages: fallbackPages.slice(0, Math.min(numPages, fallbackPages.length))
    };
    
    return new Response(JSON.stringify(fallbackStory), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
