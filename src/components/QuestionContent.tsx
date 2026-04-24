import React from 'react';

interface QuestionContentProps {
  content: string;
  className?: string;
}

const QuestionContentInner: React.FC<QuestionContentProps> = ({ content, className }) => {
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

export const QuestionContent = React.memo(QuestionContentInner);
