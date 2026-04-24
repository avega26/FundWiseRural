import { useEffect, useMemo, useState } from 'react';
import { askFundwiseAssistant } from '../aiHelper';

function FloatingAssistant({
  language,
  currentScreen,
  submittedProfile,
  profileReview,
  results,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const starterMessage = useMemo(() => {
    if (currentScreen === 'results' && results?.[0]) {
      return `I’m still here if you want help unpacking ${results[0].name}, comparing CAP and ERDF, or checking what the summary did not mention.`;
    }

    if (currentScreen === 'mockApplication') {
      return 'I can help you turn this mock application into a stronger first draft, especially if you want help with framing or evidence.';
    }

    return 'I can help explain the form, decode CAP versus ERDF, or suggest what details matter most before you search.';
  }, [currentScreen, results]);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: starterMessage,
    },
  ]);

  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        text: starterMessage,
      },
    ]);
  }, [starterMessage]);

  const suggestions = useMemo(() => {
    if (currentScreen === 'results' && results?.length) {
      return [
        'Why is this the top match?',
        'Explain CAP in simple terms',
        'What should I verify before applying?',
      ];
    }

    if (currentScreen === 'mockApplication') {
      return [
        'How should I frame this application?',
        'What evidence should I gather first?',
        'What would make this stronger?',
      ];
    }

    return [
      'What is the difference between CAP and ERDF?',
      'What should I put in the business context box?',
      'What details matter most for matching?',
    ];
  }, [currentScreen, results]);

  const submitQuestion = async (rawQuestion) => {
    const question = rawQuestion.trim();

    if (!question || isLoading) {
      return;
    }

    setMessages((current) => [...current, { role: 'user', text: question }]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await askFundwiseAssistant({
        question,
        language,
        submittedProfile,
        profileReview,
        results,
        currentScreen,
      });

      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: response.answer,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text:
            error instanceof Error
              ? error.message
              : 'I hit a small snag there, but I can still help with the basics.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    submitQuestion(inputValue);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submitQuestion(inputValue);
    }
  };

  return (
    <div className="floating-assistant">
      {isOpen && (
        <section className="assistant-panel" aria-label="FundWise assistant">
          <div className="assistant-panel-header">
            <div className="assistant-panel-title">
              <span className="assistant-avatar" aria-hidden="true">
                <svg viewBox="0 0 64 64" className="assistant-avatar-svg">
                  <circle cx="32" cy="32" r="30" fill="#f5f8fb" stroke="#d7e7f1" strokeWidth="2" />
                  <path d="M16 54c4-9 10-14 16-14s12 5 16 14" fill="#dbeef9" />
                  <circle cx="32" cy="24" r="13" fill="#eef2f6" stroke="#b8c3ce" strokeWidth="2" />
                  <path d="M19 17c0-5 5-10 10-10 2 0 3 0 4 1-4 1-8 4-8 9H19Z" fill="#eef2f6" stroke="#b8c3ce" strokeWidth="2" />
                  <path d="M45 17c0-5-5-10-10-10-2 0-3 0-4 1 4 1 8 4 8 9h6Z" fill="#eef2f6" stroke="#b8c3ce" strokeWidth="2" />
                  <path d="M36 10l8-5 6 8-8 5Z" fill="#97a3af" />
                  <circle cx="43" cy="10" r="3" fill="#ffd45e" />
                  <circle cx="27" cy="24" r="2.6" fill="#183a55" />
                  <circle cx="37" cy="24" r="2.6" fill="#183a55" />
                  <ellipse cx="32" cy="29" rx="4" ry="2.8" fill="#f5c9d1" />
                  <path d="M28 34c2 2 6 2 8 0" fill="none" stroke="#7f8b98" strokeWidth="2.4" strokeLinecap="round" />
                </svg>
              </span>
              <div>
                <strong>Clover</strong>
                <p>Ask about funds, fit, or next steps</p>
              </div>
            </div>
            <button
              type="button"
              className="secondary-button secondary-button-quiet assistant-close"
              onClick={() => setIsOpen(false)}
            >
              Close
            </button>
          </div>

          <div className="assistant-suggestions">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="assistant-chip"
                onClick={() => submitQuestion(suggestion)}
                disabled={isLoading}
              >
                {suggestion}
              </button>
            ))}
          </div>

          <div className="assistant-messages" aria-live="polite">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`assistant-message assistant-message-${message.role}`}
              >
                <p>{message.text}</p>
              </div>
            ))}
            {isLoading && (
              <div className="assistant-message assistant-message-assistant">
                <p>Clover is thinking...</p>
              </div>
            )}
          </div>

          <form className="assistant-form" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="floating-assistant-input">
              Ask Clover a question
            </label>
            <textarea
              id="floating-assistant-input"
              rows="2"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about funds, fit, or what to do next..."
              disabled={isLoading}
            />
            <button type="submit" className="primary-button" disabled={isLoading}>
              {isLoading ? 'Thinking…' : 'Ask Clover'}
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        className="assistant-bubble"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-label="Open FundWise assistant"
      >
        <span className="assistant-bubble-avatar" aria-hidden="true">
          <svg viewBox="0 0 48 48" className="assistant-bubble-svg">
            <circle cx="24" cy="24" r="22" fill="#f5f8fb" />
            <circle cx="24" cy="19" r="9" fill="#eef2f6" stroke="#b8c3ce" strokeWidth="1.5" />
            <circle cx="20" cy="19" r="2" fill="#183a55" />
            <circle cx="28" cy="19" r="2" fill="#183a55" />
            <path d="M20 24c1.5 1.5 6.5 1.5 8 0" fill="none" stroke="#7f8b98" strokeWidth="2" strokeLinecap="round" />
            <path d="M13 42c3-7 7-10 11-10s8 3 11 10" fill="#dbeef9" />
            <path d="M27 8l7-4 5 7-7 4Z" fill="#97a3af" />
          </svg>
        </span>
        <span className="assistant-bubble-copy">
          <strong>Clover</strong>
          <span>Ask a question</span>
        </span>
      </button>
    </div>
  );
}

export default FloatingAssistant;
