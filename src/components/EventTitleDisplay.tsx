import React from 'react';

interface EventTitleDisplayProps {
  title: string;
  className?: string;
  prefixClassName?: string;
  caseClassName?: string;
}

export const EventTitleDisplay: React.FC<EventTitleDisplayProps> = ({
  title,
  className = '',
  prefixClassName = 'font-bold text-[#182B33]',
  caseClassName = 'text-xs font-normal text-[#5A6D75] ml-1.5 whitespace-nowrap',
}) => {
  // Check for trailing parentheses like (BVerwG ...) or (2 BvR ...)
  const parenMatch = title.match(/^(.*?)(\s*\([^\)]+\))\s*$/);

  if (parenMatch) {
    const mainPart = parenMatch[1].trim();
    const casePart = parenMatch[2].trim();

    // Check for prefix "Prozessstart:" or "Urteil:"
    const prefixMatch = mainPart.match(/^(Prozessstart:|Urteil:)\s*(.*)$/i);
    if (prefixMatch) {
      const prefix = prefixMatch[1];
      const rest = prefixMatch[2];
      return (
        <span className={className}>
          <span className={prefixClassName}>{prefix} </span>
          <span>{rest}</span>
          <span className={caseClassName}>{casePart}</span>
        </span>
      );
    }

    return (
      <span className={className}>
        <span>{mainPart}</span>
        <span className={caseClassName}>{casePart}</span>
      </span>
    );
  }

  // If no trailing parentheses, check for prefix
  const prefixMatch = title.match(/^(Prozessstart:|Urteil:)\s*(.*)$/i);
  if (prefixMatch) {
    const prefix = prefixMatch[1];
    const rest = prefixMatch[2];
    return (
      <span className={className}>
        <span className={prefixClassName}>{prefix} </span>
        <span>{rest}</span>
      </span>
    );
  }

  return <span className={className}>{title}</span>;
};
