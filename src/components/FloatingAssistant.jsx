import { useEffect, useMemo, useRef, useState } from 'react';
import { askFundwiseAssistant } from '../aiHelper';
import SeraphinaAvatar from './SeraphinaAvatar';

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
  const starterMessage = useMemo(() => 'What do you need help with?', []);
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

  const submitQuestion = async (rawQuestion) => {
    const question = rawQuestion.trim();

    if (!question || isLoading) {
      return;
    }

    setMessages((current) => [...current, { role: 'user', text: question }]);
    setInputValue('');
    setIsLoading(true);

    try {
      const [response] = await Promise.all([
        askFundwiseAssistant({
          question,
          language,
          submittedProfile,
          profileReview,
          results,
          currentScreen,
        }),
        new Promise((resolve) => window.setTimeout(resolve, 550)),
      ]);

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
                <SeraphinaAvatar className="assistant-avatar-svg" />
              </span>
              <div>
                <strong>Seraphina</strong>
                <p>What do you need help with?</p>
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

          <div className="assistant-messages" aria-live="polite">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`assistant-message assistant-message-${message.role}${index === 0 && message.role === 'assistant' ? ' assistant-message-intro' : ''}`}
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
              placeholder="Type your question here..."
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
          <SeraphinaAvatar className="assistant-bubble-svg" />
        </span>
        <span className="assistant-bubble-copy">
          <strong>Seraphina</strong>
          <span>Need help?</span>
        </span>
      </button>
    </div>
  );
}

export default FloatingAssistant;
