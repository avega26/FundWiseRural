import { buildAssistantPrompt } from '../../src/services/generateAIRecommendations';
import { defaultLanguage } from '../../src/i18n/translations';

const CLOUDFLARE_MODEL = '@cf/meta/llama-3.1-8b-instruct-fast';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

const assistantSchema = {
  type: 'object',
  properties: {
    answer: { type: 'string' },
  },
  required: ['answer'],
  additionalProperties: false,
};

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      Allow: 'POST, OPTIONS',
    },
  });
}

export async function onRequestPost(context) {
  if (!context.env?.AI) {
    return json(
      {
        error:
          'Workers AI binding is missing. Add an AI binding named AI in your Cloudflare Pages project settings.',
      },
      503,
    );
  }

  try {
    const body = await context.request.json();
    const prompt = buildAssistantPrompt({
      question: body?.question || '',
      language: body?.language || defaultLanguage,
      submittedProfile: body?.submittedProfile || null,
      profileReview: body?.profileReview || null,
      results: Array.isArray(body?.results) ? body.results : [],
      currentScreen: body?.currentScreen || 'form',
    });

    const result = await context.env.AI.run(CLOUDFLARE_MODEL, {
      messages: [
        {
          role: 'system',
          content:
            'You are Clover, FundWise Rural’s floating assistant. Return only structured output matching the provided schema.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: assistantSchema,
      },
    });

    const payload = result?.response ?? result;

    if (!payload || typeof payload.answer !== 'string') {
      return json({ error: 'Workers AI returned an invalid assistant payload.' }, 502);
    }

    return json(payload);
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to generate hosted assistant response.',
      },
      500,
    );
  }
}
