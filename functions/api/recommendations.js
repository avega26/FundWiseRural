import { buildAiPrompt } from '../../src/services/generateAIRecommendations';
import { defaultLanguage } from '../../src/i18n/translations';

const CLOUDFLARE_MODEL = '@cf/meta/llama-3.1-8b-instruct-fast';

const recommendationSchema = {
  type: 'object',
  properties: {
    profileReview: {
      type: 'object',
      properties: {
        confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
        consistency: {
          type: 'string',
          enum: ['consistent', 'mixed', 'conflicting'],
        },
        routeClassification: { type: 'string', enum: ['cap', 'erdf', 'mixed'] },
        explanation: { type: 'string' },
        note: { type: 'string' },
        rankingReason: { type: 'string' },
        detectedSignals: {
          type: 'array',
          items: { type: 'string' },
        },
        executiveSummary: { type: 'string' },
      },
      required: [
        'confidence',
        'consistency',
        'routeClassification',
        'explanation',
        'note',
        'rankingReason',
        'detectedSignals',
        'executiveSummary',
      ],
      additionalProperties: true,
    },
    recommendations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          explanation: { type: 'string' },
          eligibility: { type: 'string', enum: ['likely', 'possible', 'unlikely'] },
          rankingScore: { type: 'number' },
          rankingReason: { type: 'string' },
          requirements: {
            type: 'array',
            items: { type: 'string' },
          },
          nextStep: { type: 'string' },
          draftSupport: {
            type: 'object',
            properties: {
              projectSummary: { type: 'string' },
              fitReason: { type: 'string' },
              applicationAngle: { type: 'string' },
              evidenceToPrepare: {
                type: 'array',
                items: { type: 'string' },
              },
              preSubmissionChecklist: {
                type: 'array',
                items: { type: 'string' },
              },
              firstAuthorityQuestion: { type: 'string' },
              clarificationPoint: { type: 'string' },
              verifyBeforeSubmit: { type: 'string' },
            },
            required: [
              'projectSummary',
              'fitReason',
              'applicationAngle',
              'evidenceToPrepare',
              'preSubmissionChecklist',
              'firstAuthorityQuestion',
              'clarificationPoint',
              'verifyBeforeSubmit',
            ],
            additionalProperties: true,
          },
        },
        required: [
          'id',
          'explanation',
          'eligibility',
          'rankingScore',
          'rankingReason',
          'requirements',
          'nextStep',
          'draftSupport',
        ],
        additionalProperties: true,
      },
    },
  },
  required: ['profileReview', 'recommendations'],
  additionalProperties: true,
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

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
    const profile = body?.profile;
    const localRecommendations = body?.localRecommendations;

    if (!profile || !Array.isArray(localRecommendations) || localRecommendations.length === 0) {
      return json({ error: 'Invalid recommendation payload.' }, 400);
    }

    const language = profile.preferredLanguage || defaultLanguage;
    const prompt = buildAiPrompt(profile, localRecommendations, language);

    const result = await context.env.AI.run(CLOUDFLARE_MODEL, {
      messages: [
        {
          role: 'system',
          content:
            'You are FundWise Rural’s hosted AI layer. Return only structured recommendation output that matches the provided schema.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: recommendationSchema,
      },
    });

    const payload = result?.response ?? result;

    if (!payload || !Array.isArray(payload.recommendations)) {
      return json({ error: 'Workers AI returned an invalid recommendation payload.' }, 502);
    }

    return json(payload);
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to generate hosted AI recommendations.',
      },
      500,
    );
  }
}
