import type { APIRoute } from 'astro';

const LLM_URL = 'http://192.168.1.38:11434/v1/chat/completions';
const MODEL = 'cognitivecomputations_qwen3-72b-embiggened';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { name, age, topics } = await request.json();
    
    if (!name || !topics || topics.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const topicsList = topics.join(', ');
    const ageAppropriate = age <= 4 ? 'very simple words, short sentences' : 
                          age <= 7 ? 'simple vocabulary, engaging sentences' : 
                          'more detailed descriptions, some adventure';
    
    const prompt = `Write a children's storybook for ${name}, age ${age}. 
Topics to include: ${topicsList}

Requirements:
- Use ${ageAppropriate}
- Make ${name} the hero of the story
- Write exactly 5 pages
- Each page should be 2-3 sentences
- Make it fun, positive, and age-appropriate
- Include the topics naturally in the adventure

Respond with ONLY valid JSON in this exact format, no other text:
{
  "title": "The Amazing Adventure Title",
  "pages": [
    {"text": "Page 1 text here..."},
    {"text": "Page 2 text here..."},
    {"text": "Page 3 text here..."},
    {"text": "Page 4 text here..."},
    {"text": "Page 5 text here..."}
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
            content: 'You are a children\'s book author. You write delightful, age-appropriate stories. Always respond with valid JSON only, no markdown or explanation.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 1000
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
    const { name = 'our hero', topics = ['adventure'] } = await request.json().catch(() => ({}));
    const fallbackStory = {
      title: `${name}'s Magical Adventure`,
      pages: [
        { text: `Once upon a time, there was a brave child named ${name} who loved ${topics[0] || 'adventure'}.` },
        { text: `One sunny day, ${name} discovered something amazing in the backyard!` },
        { text: `It was a magical path that led to a land full of wonders and ${topics.slice(0, 2).join(' and ')}.` },
        { text: `${name} made wonderful friends and helped everyone with kindness and courage.` },
        { text: `And so ${name} returned home, knowing that the greatest adventures are yet to come. The End!` }
      ]
    };
    
    return new Response(JSON.stringify(fallbackStory), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
