import { callGrok, MODELS } from '../client.js';
import { GROX_SAFETY_CATEGORIES } from '../../algorithm-weights.js';

const CATEGORY_IDS = GROX_SAFETY_CATEGORIES.map((c) => c.id);

const PASS1_SCHEMA = {
  type: 'object',
  required: ['categories'],
  properties: {
    categories: {
      type: 'array',
      items: {
        type: 'object',
        required: ['categoryId', 'risk'],
        properties: {
          categoryId: { type: 'string', enum: CATEGORY_IDS },
          risk: { type: 'string', enum: ['low', 'medium', 'high'] },
        },
        additionalProperties: false,
      },
    },
  },
  additionalProperties: false,
};

const PASS2_SCHEMA = {
  type: 'object',
  required: ['categories'],
  properties: {
    categories: {
      type: 'array',
      items: {
        type: 'object',
        required: ['categoryId', 'risk', 'reasoning'],
        properties: {
          categoryId: { type: 'string', enum: CATEGORY_IDS },
          risk: { type: 'string', enum: ['low', 'medium', 'high'] },
          reasoning: { type: 'string' },
        },
        additionalProperties: false,
      },
    },
  },
  additionalProperties: false,
};

const DELUXE_IDS = new Set(GROX_SAFETY_CATEGORIES.filter((c) => c.deluxe_reasoning).map((c) => c.id));

function pass1System() {
  return `You are a content safety classifier. Classify the tweet across exactly these 7 categories: ${CATEGORY_IDS.join(', ')}. For each, return the categoryId and risk level: low, medium, or high. You must return all 7 categories.`;
}

function pass2System(categoriesToRegrade) {
  return `You are a senior content safety reviewer applying detailed reasoning. Re-evaluate ONLY these categories: ${categoriesToRegrade.join(', ')}. Provide a risk level (low/medium/high) and a concise reasoning string for each.`;
}

export default async function gradeSafety(tweetText) {
  const pass1Result = await callGrok({
    model: MODELS.mini,
    system: pass1System(),
    user: tweetText,
    schema: PASS1_SCHEMA,
  });

  const pass1Map = new Map(pass1Result.categories.map((c) => [c.categoryId, c]));

  const needsDeluxe = pass1Result.categories
    .filter((c) => DELUXE_IDS.has(c.categoryId) && (c.risk === 'medium' || c.risk === 'high'))
    .map((c) => c.categoryId);

  let pass2Map = new Map();
  if (needsDeluxe.length > 0) {
    const pass2Result = await callGrok({
      model: MODELS.full,
      system: pass2System(needsDeluxe),
      user: tweetText,
      schema: PASS2_SCHEMA,
    });
    pass2Map = new Map(pass2Result.categories.map((c) => [c.categoryId, c]));
  }

  return GROX_SAFETY_CATEGORIES.map((cat) => {
    const deluxeEntry = pass2Map.get(cat.id);
    const pass1Entry = pass1Map.get(cat.id) || { risk: 'low' };
    const final = deluxeEntry || pass1Entry;

    return {
      categoryId: cat.id,
      label: cat.label,
      risk: final.risk,
      deluxeReasoningApplied: !!deluxeEntry,
      ...(deluxeEntry?.reasoning ? { reasoning: deluxeEntry.reasoning } : {}),
      source: 'grok',
    };
  });
}
