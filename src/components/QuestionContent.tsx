import React from 'react';

interface QuestionContentProps {
  content: string;
  className?: string;
}

export const QuestionContent: React.FC<QuestionContentProps> = ({ content, className }) => {
  // If content contains HTML tags (like <img> or <sub> or <sup>), render as HTML
  // Otherwise render as plain text
  const hasHtml = /<[a-z][\s\S]*>/i.test(content);

  if (hasHtml) {
    return (
      <div 
        className={className}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  return <div className={className}>{content}</div>;
};
