import { useState } from 'react';
import cogniHappy from '../../../assets/cogni/cogni-happy.png';
import MessageContent from './MessageContent';
import MessageActions from './MessageActions';
import MessageTimestamp from './MessageTimestamp';
import MessageMetadata from './MessageMetadata';
import MessageReactions from './MessageReactions';
import CopyToast from '../CopyToast';

export default function MessageBubble({ message, isRtl, t, i18n, searchQuery }) {
  const isUser = message.role === 'user';
  const [showCopyToast, setShowCopyToast] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setShowCopyToast(true);
      setTimeout(() => setShowCopyToast(false), 1500);
    } catch {}
  };

  const handleFeedback = (messageId, type) => console.log('Feedback:', messageId, type);
  const handleReaction = (messageId, emoji) => console.log('Reaction:', messageId, emoji);

  return (
    <>
      {/* Outer row: avatar + bubble */}
      <div
        className={`flex items-end gap-2 mb-3 ca-message-enter ${
          isUser
            ? isRtl ? 'justify-start' : 'justify-end'
            : isRtl ? 'justify-end' : 'justify-start'
        }`}
      >
        {/* Cogni avatar — LTR left side */}
        {!isUser && !isRtl && (
          <div className="flex-shrink-0 self-end mb-0.5 h-7 w-7 overflow-hidden rounded-full border border-primary/20 bg-white shadow-sm">
            <img src={cogniHappy} alt="Cogni" className="h-full w-full object-cover" />
          </div>
        )}

        {/* Bubble column */}
        <div
          className={`group relative ${isUser ? 'max-w-[78%]' : 'max-w-[82%]'}`}
          style={{ textAlign: isRtl ? 'right' : 'left' }}
        >
          {/* Bubble */}
          <div
            className={`rounded-2xl text-sm shadow-sm ${
              isUser ? 'rounded-br-sm' : 'rounded-bl-sm border'
            }`}
            style={
              isUser
                ? {
                    background: 'var(--ca-bubble-user-bg)',
                    color: 'var(--ca-bubble-user-text)',
                    boxShadow: 'var(--ca-bubble-user-shadow)',
                    padding: 'var(--ca-message-padding-y) var(--ca-message-padding-x)',
                  }
                : {
                    background: 'var(--ca-bubble-assistant-bg)',
                    color: 'var(--ca-bubble-assistant-text)',
                    borderColor: 'var(--ca-bubble-assistant-border)',
                    boxShadow: 'var(--ca-bubble-assistant-shadow)',
                    padding: 'var(--ca-message-padding-y) var(--ca-message-padding-x)',
                  }
            }
          >
            <MessageContent content={message.content} isUser={isUser} highlightQuery={searchQuery} />
            <MessageTimestamp timestamp={message.timestamp} locale={i18n?.language} />
            {!isUser && <MessageMetadata meta={message.meta} t={t} locale={i18n?.language} />}
          </div>

          {/* Actions + reactions below bubble (assistant only) */}
          {!isUser && (
            <>
              <MessageActions onCopy={handleCopy} onFeedback={handleFeedback} messageId={message.id} />
              <MessageReactions messageId={message.id} onReaction={handleReaction} />
            </>
          )}
        </div>

        {/* Cogni avatar — RTL right side */}
        {!isUser && isRtl && (
          <div className="flex-shrink-0 self-end mb-0.5 h-7 w-7 overflow-hidden rounded-full border border-primary/20 bg-white shadow-sm">
            <img src={cogniHappy} alt="Cogni" className="h-full w-full object-cover" />
          </div>
        )}
      </div>

      <CopyToast visible={showCopyToast} />
    </>
  );
}
