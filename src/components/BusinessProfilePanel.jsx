import { useState } from 'react';
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
  ruralArea: '',
  additionalContext: '',
  specialTags: [],
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
    ruralArea: 'yes',
    additionalContext:
      'We grow flowers on family land but also do floral design for weddings and urban retail clients. We need irrigation improvements, ecommerce, online booking, and digital tools for expansion.',
    specialTags: ['sustainable', 'innovative', 'womenOwned'],
  },
};

function BusinessProfilePanel({ onSubmitProfile, language, onLanguageChange }) {
  const [formData, setFormData] = useState(initialFormData);
  const copy = getTranslation(language);
  const availableRegions = regionsByCountry[formData.country] ?? [];
  const showAgricultureSubType = ['farm', 'foodProducer', 'agriTourism'].includes(
    formData.businessType,
  );

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
    onSubmitProfile(formData);
  };

  const handleDemoFill = (scenario) => {
    const selectedProfile = demoProfiles[scenario];

    if (!selectedProfile) {
      return;
    }

    setFormData(selectedProfile);
    onLanguageChange(selectedProfile.preferredLanguage);
  };

  return (
    <section className="intake-shell" aria-labelledby="business-profile-title">
      <div className="intake-card">
        <div className="intake-intro">
          <p className="eyebrow">{copy.intakeEyebrow}</p>
          <h2 id="business-profile-title">{copy.intakeTitle}</h2>
          <p className="panel-copy">{copy.intakeDescription}</p>
        </div>

        <form className="business-profile-form" onSubmit={handleSubmit}>
          <div className="language-row">
            <div className="form-field language-field">
              <label htmlFor="preferredLanguage">{copy.labels.preferredLanguage}</label>
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

            <div className="form-field">
              <label htmlFor="ruralArea">{copy.labels.ruralArea}</label>
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
              <div className="checkbox-list">
                {specialTagOptions.map((tag) => (
                  <label key={tag.value} className="checkbox-item">
                    <input
                      type="checkbox"
                      value={tag.value}
                      checked={formData.specialTags.includes(tag.value)}
                      onChange={handleTagChange}
                    />
                    <span>{copy.tags[tag.labelKey]}</span>
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
            </div>
            <button type="submit" className="primary-button primary-button-large">
              {copy.findFunding}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default BusinessProfilePanel;
