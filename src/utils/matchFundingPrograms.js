import { fundingPrograms } from '../data/fundingPrograms';

const capBusinessTypes = ['farm', 'agriTourism', 'foodProducer'];
const erdfBusinessTypes = ['manufacturer', 'retail', 'service'];

export function matchFundingPrograms(profile) {
  return fundingPrograms
    .map((program) => ({
      ...program,
      score: scoreProgram(program, profile),
    }))
    .filter((program) => program.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3);
}

function scoreProgram(program, profile) {
  let score = 0;
  const context = profile.additionalContext?.toLowerCase() ?? '';
  const mentionsDigital =
    context.includes('website') ||
    context.includes('online booking') ||
    context.includes('digital') ||
    context.includes('software') ||
    context.includes('booking');
  const mentionsAgriculture =
    context.includes('farm') ||
    context.includes('land') ||
    context.includes('irrigation') ||
    context.includes('sustainability') ||
    context.includes('agriculture');

  if (program.supportedBusinessTypes.includes(profile.businessType)) {
    score += 4;
  }

  if (program.supportedGoals.includes(profile.mainGoal)) {
    score += 4;
  }

  if (program.supportedSizes.includes(profile.businessSize)) {
    score += 2;
  }

  if (program.ruralRequired && profile.ruralArea === 'yes') {
    score += 3;
  }

  if (program.ruralRequired && profile.ruralArea === 'no') {
    score -= 6;
  }

  if (program.fundType === 'CAP') {
    if (capBusinessTypes.includes(profile.businessType)) {
      score += 2;
    }

    if (profile.mainGoal === 'sustainabilityUpgrade') {
      score += 3;
    }

    if (profile.mainGoal === 'buyEquipment') {
      score += 2;
    }

    if (profile.specialTags.includes('sustainable')) {
      score += 2;
    }

    if (mentionsAgriculture) {
      score += 2;
    }
  }

  if (program.fundType === 'ERDF') {
    if (erdfBusinessTypes.includes(profile.businessType)) {
      score += 2;
    }

    if (profile.mainGoal === 'digitize') {
      score += 3;
    }

    if (profile.mainGoal === 'expandOperations') {
      score += 2;
    }

    if (profile.mainGoal === 'hireStaff') {
      score += 2;
    }

    if (profile.specialTags.includes('innovative')) {
      score += 1;
    }

    if (mentionsDigital) {
      score += 2;
    }
  }

  if (profile.yearsInOperation === '0-1' && program.fundType === 'ERDF') {
    score -= 1;
  }

  if (profile.businessSize === 'micro' && program.id === 'erdf-regional-growth-fund') {
    score -= 2;
  }

  return Math.max(score, 0);
}
