import { useEffect, useState } from 'react';
import {
  agricultureSubTypeOptions,
  businessSizeOptions,
  businessTypeOptions,
  countryOptions,
  defaultLanguage,
  getTranslation,
  languageOptions,
  mainGoalOptions,
  regionsByCountry,
  ruralAreaOptions,
  specialTagOptions,
  yearsOptions,
} from '../i18n/translations';

const initialFormData = {
  preferredLanguage: '',
  businessName: '',
  country: '',
  region: '',
  businessType: '',
  agricultureSubType: '',
  businessSize: '',
  yearsInOperation: '',
  mainGoal: '',
  otherMainGoal: '',
  ruralArea: '',
  additionalContext: '',
  specialTags: [],
  grantScopePreference: '',
};

const demoProfiles = {
  cap: {
    preferredLanguage: 'en',
    businessName: 'Green Valley Farm',
    country: 'spain',
    region: 'andalusia',
    businessType: 'farm',
    agricultureSubType: 'flowersHorticulture',
    businessSize: 'micro',
    yearsInOperation: '2-5',
    mainGoal: 'sustainabilityUpgrade',
    otherMainGoal: '',
    ruralArea: 'yes',
    additionalContext:
      'We run a small flower-growing farm in rural Andalusia. We want support for irrigation upgrades, sustainability improvements, and a better website for direct sales.',
    specialTags: ['sustainable', 'innovative'],
  },
  erdf: {
    preferredLanguage: 'en',
    businessName: 'SunPath Studio',
    country: 'france',
    region: 'occitanie',
    businessType: 'service',
    agricultureSubType: '',
    businessSize: 'small',
    yearsInOperation: '2-5',
    mainGoal: 'digitize',
    otherMainGoal: '',
    ruralArea: 'no',
    additionalContext:
      'We are a growing hospitality and design business serving tourism clients. We want funding for a new website, booking tools, ecommerce improvements, and better internal software.',
    specialTags: ['innovative', 'womenOwned'],
  },
  mixed: {
    preferredLanguage: 'en',
    businessName: 'Bloom & Barrel',
    country: 'spain',
    region: 'andalusia',
    businessType: 'farm',
    agricultureSubType: 'flowersHorticulture',
    businessSize: 'micro',
    yearsInOperation: '6+',
    mainGoal: 'digitize',
    otherMainGoal: '',
    ruralArea: 'yes',
    additionalContext:
      'We grow flowers on family land but also do floral design for weddings and urban retail clients. We need irrigation improvements, ecommerce, online booking, and digital tools for expansion.',
    specialTags: ['sustainable', 'innovative', 'womenOwned'],
  },
  mock: {
    preferredLanguage: 'en',
    businessName: 'SunPath Studio',
    country: 'france',
    region: 'occitanie',
    businessType: 'service',
    agricultureSubType: '',
    businessSize: 'small',
    yearsInOperation: '2-5',
    mainGoal: 'digitize',
    otherMainGoal: '',
    ruralArea: 'no',
    additionalContext:
      'We are a growing hospitality and design business in Occitanie and want to prepare a stronger first-stage grant application for digital booking, ecommerce improvements, and internal software upgrades.',
    specialTags: ['innovative', 'womenOwned'],
  },
};

function BusinessProfilePanel({
  onSubmitProfile,
  language,
  onLanguageChange,
  initialProfile,
  previewMode = false,
  isDeveloperMode = false,
}) {
  const [formData, setFormData] = useState(initialFormData);
  const [includeMockApplication, setIncludeMockApplication] = useState(false);
  const copy = getTranslation(language);
  const availableRegions = regionsByCountry[formData.country] ?? [];
  const showAgricultureSubType = ['farm', 'foodProducer', 'agriTourism'].includes(
    formData.businessType,
  );
  const showOtherMainGoal = formData.mainGoal === 'other';

  useEffect(() => {
    if (!initialProfile) {
      return;
    }

    setFormData((currentData) => ({
      ...currentData,
      ...initialProfile,
      preferredLanguage: initialProfile.preferredLanguage || currentData.preferredLanguage || language,
    }));
    setIncludeMockApplication(false);

    if (initialProfile.preferredLanguage) {
      onLanguageChange(initialProfile.preferredLanguage);
    }
  }, [initialProfile, language, onLanguageChange]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    if (name === 'preferredLanguage') {
      onLanguageChange(value || defaultLanguage);
    }

    if (name === 'country') {
      setFormData((currentData) => ({
        ...currentData,
        country: value,
        region: '',
      }));

      return;
    }

    if (name === 'businessType') {
      setFormData((currentData) => ({
        ...currentData,
        businessType: value,
        agricultureSubType: ['farm', 'foodProducer', 'agriTourism'].includes(value)
          ? currentData.agricultureSubType
          : '',
      }));

      return;
    }

    if (name === 'mainGoal') {
      setFormData((currentData) => ({
        ...currentData,
        mainGoal: value,
        otherMainGoal: value === 'other' ? currentData.otherMainGoal : '',
      }));

      return;
    }

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  const handleTagChange = (event) => {
    const { value, checked } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      specialTags: checked
        ? [...currentData.specialTags, value]
        : currentData.specialTags.filter((tag) => tag !== value),
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log('FundWise Rural business profile:', formData);
    onSubmitProfile(formData, { openMockApplication: includeMockApplication });
  };

  const handleDemoFill = (scenario) => {
    const selectedProfile = demoProfiles[scenario];

    if (!selectedProfile) {
      return;
    }

    setFormData(selectedProfile);
    setIncludeMockApplication(scenario === 'mock');
    onLanguageChange(selectedProfile.preferredLanguage);
  };

  return (
    <section className="intake-shell" aria-labelledby="business-profile-title">
      <div className={`intake-card${previewMode ? ' intake-card-preview' : ''}`}>
        <div className="intake-intro">
          <p className="eyebrow">{copy.intakeEyebrow}</p>
          <h2 id="business-profile-title">{copy.intakeTitle}</h2>
          <p className="panel-copy">{copy.intakeDescription}</p>
          {initialProfile && (
            <p className="agent-prefill-note">
              The AI guide prefilled a few fields for you. Review and adjust anything before running the full recommendation flow.
            </p>
          )}
        </div>

        <form
          className={`business-profile-form${previewMode ? ' business-profile-form-preview' : ''}`}
          onSubmit={handleSubmit}
        >
          <fieldset className="form-preview-fieldset" disabled={previewMode}>
          <div className="language-row">
            <div className="form-field language-field">
              <label htmlFor="preferredLanguage">{copy.labels.preferredLanguage}</label>
              <p className="field-help">{copy.intakeFieldHelp?.preferredLanguage}</p>
              <select
                id="preferredLanguage"
                name="preferredLanguage"
                value={formData.preferredLanguage}
                onChange={handleInputChange}
              >
                <option value="">{copy.selectPlaceholder}</option>
                {languageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-grid">

            <div className="form-field">
              <label htmlFor="businessName">{copy.labels.businessName}</label>
              <p className="field-help">{copy.intakeFieldHelp?.businessName}</p>
              <input
                id="businessName"
                name="businessName"
                type="text"
                autoComplete="organization"
                value={formData.businessName}
                onChange={handleInputChange}
                placeholder={copy.businessNamePlaceholder}
              />
            </div>

            <div className="form-field">
              <label htmlFor="country">{copy.labels.country}</label>
              <p className="field-help">{copy.intakeFieldHelp?.country}</p>
              <select
                id="country"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
              >
                <option value="">{copy.selectPlaceholder}</option>
                {countryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {copy.countries[option.labelKey]}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="region">{copy.labels.region}</label>
              <p className="field-help">{copy.intakeFieldHelp?.region}</p>
              <select
                id="region"
                name="region"
                value={formData.region}
                onChange={handleInputChange}
              >
                <option value="">{copy.regionPlaceholder}</option>
                {availableRegions.map((region) => (
                  <option key={region.value} value={region.value}>
                    {region.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="businessType">{copy.labels.businessType}</label>
              <p className="field-help">{copy.intakeFieldHelp?.businessType}</p>
              <select
                id="businessType"
                name="businessType"
                value={formData.businessType}
                onChange={handleInputChange}
              >
                <option value="">{copy.selectPlaceholder}</option>
                {businessTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {copy.businessTypes[option.labelKey]}
                  </option>
                ))}
              </select>
            </div>

            {showAgricultureSubType && (
              <div className="form-field">
                <label htmlFor="agricultureSubType">{copy.labels.agricultureSubType}</label>
                <p className="field-help">{copy.intakeFieldHelp?.agricultureSubType}</p>
                <select
                  id="agricultureSubType"
                  name="agricultureSubType"
                  value={formData.agricultureSubType}
                  onChange={handleInputChange}
                >
                  <option value="">{copy.selectPlaceholder}</option>
                  {agricultureSubTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {copy.agricultureSubTypes[option.labelKey]}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-field">
              <label htmlFor="businessSize">{copy.labels.businessSize}</label>
              <p className="field-help">{copy.intakeFieldHelp?.businessSize}</p>
              <select
                id="businessSize"
                name="businessSize"
                value={formData.businessSize}
                onChange={handleInputChange}
              >
                <option value="">{copy.selectPlaceholder}</option>
                {businessSizeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {copy.businessSizes[option.labelKey]}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="yearsInOperation">{copy.labels.yearsInOperation}</label>
              <p className="field-help">{copy.intakeFieldHelp?.yearsInOperation}</p>
              <select
                id="yearsInOperation"
                name="yearsInOperation"
                value={formData.yearsInOperation}
                onChange={handleInputChange}
              >
                <option value="">{copy.selectPlaceholder}</option>
                {yearsOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {copy.years[option.labelKey]}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="mainGoal">{copy.labels.mainGoal}</label>
              <p className="field-help">{copy.intakeFieldHelp?.mainGoal}</p>
              <select
                id="mainGoal"
                name="mainGoal"
                value={formData.mainGoal}
                onChange={handleInputChange}
              >
                <option value="">{copy.selectPlaceholder}</option>
                {mainGoalOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {copy.goals[option.labelKey]}
                  </option>
                ))}
              </select>
            </div>

            {showOtherMainGoal && (
              <div className="form-field">
                <label htmlFor="otherMainGoal">{copy.labels.otherMainGoal}</label>
                <p className="field-help">{copy.intakeFieldHelp?.otherMainGoal}</p>
                <textarea
                  id="otherMainGoal"
                  name="otherMainGoal"
                  rows="3"
                  value={formData.otherMainGoal}
                  onChange={handleInputChange}
                  placeholder={copy.otherMainGoalPlaceholder}
                />
              </div>
            )}

            <div className="form-field">
              <label htmlFor="ruralArea">{copy.labels.ruralArea}</label>
              <p className="field-help">{copy.intakeFieldHelp?.ruralArea}</p>
              <select
                id="ruralArea"
                name="ruralArea"
                value={formData.ruralArea}
                onChange={handleInputChange}
              >
                <option value="">{copy.selectPlaceholder}</option>
                {ruralAreaOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {copy.ruralAreaOptions[option.labelKey]}
                  </option>
                ))}
              </select>
            </div>

            <fieldset className="form-field checkbox-group">
              <legend>{copy.labels.specialTags}</legend>
              <p className="field-help">{copy.intakeFieldHelp?.specialTags}</p>
              <div className="checkbox-list">
                {specialTagOptions.map((tag) => (
                  <label key={tag.value} className="checkbox-item">
                    <input
                      type="checkbox"
                      value={tag.value}
                      checked={formData.specialTags.includes(tag.value)}
                      onChange={handleTagChange}
                    />
                    <span className="tag-label-with-help">
                      <span>{copy.tags[tag.labelKey]}</span>
                      <span
                        className="tag-help-dot"
                        title={copy.tagDescriptions?.[tag.labelKey] || ''}
                        aria-label={copy.tagDescriptions?.[tag.labelKey] || ''}
                        tabIndex="0"
                      >
                        ?
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="form-field form-field-full">
            <label htmlFor="additionalContext">{copy.labels.additionalContext}</label>
              <textarea
                id="additionalContext"
                name="additionalContext"
                rows="5"
                aria-describedby="business-context-help"
                value={formData.additionalContext}
                onChange={handleInputChange}
                placeholder={copy.additionalContextPlaceholder}
              />
            <p id="business-context-help" className="field-help">
              {copy.additionalContextHelp}
            </p>
          </div>

          <div className="form-actions">
            {isDeveloperMode && (
              <div className="demo-actions">
                <button
                  type="button"
                  className="secondary-button demo-button"
                  onClick={() => handleDemoFill('cap')}
                >
                  {copy.demoCapProfile || 'CAP Demo'}
                </button>
                <button
                  type="button"
                  className="secondary-button demo-button"
                  onClick={() => handleDemoFill('erdf')}
                >
                  {copy.demoErdfProfile || 'ERDF Demo'}
                </button>
                <button
                  type="button"
                  className="secondary-button demo-button"
                  onClick={() => handleDemoFill('mixed')}
                >
                  {copy.demoMixedProfile || 'Mixed Demo'}
                </button>
                <button
                  type="button"
                  className="secondary-button demo-button"
                  onClick={() => handleDemoFill('mock')}
                >
                  {copy.demoMockApplication || 'Mock Form Demo'}
                </button>
              </div>
            )}
            <div className="form-submit-row">
              <button type="submit" className="primary-button primary-button-large">
                {copy.findFunding}
              </button>
              <label className="mock-route-toggle" htmlFor="includeMockApplication">
                <input
                  id="includeMockApplication"
                  type="checkbox"
                  checked={includeMockApplication}
                  onChange={(event) => setIncludeMockApplication(event.target.checked)}
                />
                <span className="mock-route-toggle-ui" aria-hidden="true">
                  <span className="mock-route-toggle-knob" />
                </span>
                <span className="mock-route-toggle-copy">
                  <strong>{copy.includeMockApplication || 'Include mock application route'}</strong>
                  <small>
                    {copy.includeMockApplicationHelp ||
                      'If the top result supports it, continue straight into the application flow after matching.'}
                  </small>
                </span>
              </label>
            </div>
          </div>
          </fieldset>
        </form>
      </div>
    </section>
  );
}

export default BusinessProfilePanel;
