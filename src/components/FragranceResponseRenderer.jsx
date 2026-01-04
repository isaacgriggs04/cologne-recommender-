import React from 'react';
import ReactMarkdown from 'react-markdown';
import { processMessageContent, RecommendationCard } from './ChatContainer';

const FragranceResponseRenderer = ({ text, onAddToWishlist, onViewDetails }) => {
  if (!text) return null;

  return (
    <div className="text-gray-300 leading-relaxed space-y-6">
      {processMessageContent(text).map((section, idx) => (
        <div key={idx} className="space-y-4">
          {/* Always show the markdown text first */}
          {section.lines && section.lines.length > 0 && (
            <div className="claude-message text-gray-300">
              <ReactMarkdown
                components={{
                  p: ({node, ...props}) => <p className="mb-4" {...props} />,
                  strong: ({node, ...props}) => <strong className="font-semibold text-white" {...props} />,
                  em: ({node, ...props}) => <em className="italic" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 space-y-2 ml-4" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4 space-y-2 ml-4" {...props} />,
                  li: ({node, ...props}) => <li className="ml-2" {...props} />,
                  code: ({node, inline, ...props}) =>
                    inline
                      ? <code className="bg-gray-900 px-1.5 py-0.5 rounded text-sm font-mono text-pink-300" {...props} />
                      : <code className="block bg-gray-900 p-3 rounded-lg text-sm font-mono text-pink-300 overflow-x-auto my-2" {...props} />,
                  pre: ({node, ...props}) => <pre className="bg-gray-900 p-3 rounded-lg overflow-x-auto my-2" {...props} />,
                  h1: ({node, ...props}) => <h1 className="text-2xl font-semibold text-white mt-6 mb-3" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-xl font-semibold text-white mt-5 mb-2" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-lg font-semibold text-white mt-4 mb-2" {...props} />,
                }}
              >
                {section.lines.join('\n')}
              </ReactMarkdown>
            </div>
          )}
          {/* Then show the fragrance card below if there's a match */}
          {section.fragrance && (
            <RecommendationCard
              fragrance={section.fragrance}
              onAddToWishlist={onAddToWishlist}
              onViewDetails={onViewDetails}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default FragranceResponseRenderer;

