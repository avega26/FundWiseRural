import { useEffect, useMemo, useRef, useState } from 'react';
import { askFundwiseAssistant } from '../aiHelper';

function TypingDots() {
  return (
    <span className="typing-dots" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

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
  const chatEndRef = useRef(null);
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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isLoading, isOpen]);

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
                  <path d="M14 56c4-9 10-14 18-14s14 5 18 14" fill="#dbeef9" />
                  <path d="M20 21 25 9 33 18" fill="#eef2f6" stroke="#aebac5" strokeWidth="2.2" strokeLinejoin="round" />
                  <path d="M44 21 39 9 31 18" fill="#eef2f6" stroke="#aebac5" strokeWidth="2.2" strokeLinejoin="round" />
                  <circle cx="32" cy="27" r="15" fill="#eef2f6" stroke="#aebac5" strokeWidth="2.2" />
                  <ellipse cx="26" cy="26" rx="2.2" ry="2.8" fill="#183a55" />
                  <ellipse cx="38" cy="26" rx="2.2" ry="2.8" fill="#183a55" />
                  <ellipse cx="32" cy="33" rx="4.2" ry="3.2" fill="#f3c548" />
                  <circle cx="22.5" cy="31.5" r="2.8" fill="#f4dbe2" opacity="0.82" />
                  <circle cx="41.5" cy="31.5" r="2.8" fill="#f4dbe2" opacity="0.82" />
                  <path d="M25 31l-11-2" stroke="#7f8b98" strokeWidth="1.7" strokeLinecap="round" />
                  <path d="M25 34h-11" stroke="#7f8b98" strokeWidth="1.7" strokeLinecap="round" />
                  <path d="M39 31l11-2" stroke="#7f8b98" strokeWidth="1.7" strokeLinecap="round" />
                  <path d="M39 34h11" stroke="#7f8b98" strokeWidth="1.7" strokeLinecap="round" />
                  <path d="M29 38c1.2 1.5 4.8 1.5 6 0" fill="none" stroke="#7f8b98" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="32" cy="45" r="3.3" fill="#6b8ea6" />
                  <circle cx="32" cy="45" r="1.2" fill="#ffffff" />
                </svg>
              </span>
              <div>
                <strong>Seraphina</strong>
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
                <p><TypingDots /></p>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form className="assistant-form" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="floating-assistant-input">
              Ask Seraphina a question
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
            <div className="assistant-form-footer">
              <p className="assistant-form-hint">
                {isLoading ? 'Seraphina is replying…' : 'Press Enter to send, or Shift+Enter for a new line.'}
              </p>
              <button type="submit" className="primary-button" disabled={isLoading}>
                {isLoading ? 'Thinking…' : 'Ask Seraphina'}
              </button>
            </div>
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
            <path d="M15 16 19 8l6 6" fill="#eef2f6" stroke="#aebac5" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M33 16 29 8l-6 6" fill="#eef2f6" stroke="#aebac5" strokeWidth="1.5" strokeLinejoin="round" />
            <circle cx="24" cy="20" r="10" fill="#eef2f6" stroke="#aebac5" strokeWidth="1.5" />
            <ellipse cx="20" cy="19" rx="1.8" ry="2.3" fill="#183a55" />
            <ellipse cx="28" cy="19" rx="1.8" ry="2.3" fill="#183a55" />
            <ellipse cx="24" cy="24" rx="2.9" ry="2.2" fill="#f3c548" />
            <path d="M20.5 15.5c1.2-1.3 2.3-2 3.5-2 1.3 0 2.4.7 3.5 2" fill="none" stroke="#b7c1ca" strokeWidth="1.1" strokeLinecap="round" />
            <path d="M18 23l-5 1.4" stroke="#7f8b98" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M18 25.5h-5" stroke="#7f8b98" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M30 23l5 1.4" stroke="#7f8b98" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M30 25.5h5" stroke="#7f8b98" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M13 42c3-7 7-10 11-10s8 3 11 10" fill="#dbeef9" />
            <circle cx="24" cy="34.5" r="2.2" fill="#6b8ea6" />
            <circle cx="24" cy="34.5" r="0.8" fill="#ffffff" />
          </svg>
        </span>
        <span className="assistant-bubble-copy">
          <strong>Seraphina</strong>
          <span>Ask a question</span>
        </span>
      </button>
    </div>
  );
}

export default FloatingAssistant;
