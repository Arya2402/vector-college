import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';

export const MathRenderer = ({ content }) => {
    if (typeof content !== 'string') return null;

    // Split text by both block math ($$..$$, \[..\]) and inline math ($..$, \(..\))
    // We capture the delimiters so the split array looks like [ "text", "$$math$$", "text", "\(math\)", "text", ... ]
    const segments = content.split(/(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$[\s\S]*?\$|\\\([\s\S]*?\\\))/g);

    return (
        <React.Fragment>
            {segments.map((segment, index) => {
                if (!segment) return null; // Skip empty segments from split

                try {
                    // Block Math: $$...$$ OR \[...\]
                    if (segment.startsWith('$$') && segment.endsWith('$$')) {
                        const mathSrc = segment.slice(2, -2);
                        return <BlockMath key={index} math={mathSrc} renderError={(e) => <span className="text-red-500">[Math Error]</span>} />;
                    } else if (segment.startsWith('\\[') && segment.endsWith('\\]')) {
                        const mathSrc = segment.slice(2, -2);
                        return <BlockMath key={index} math={mathSrc} renderError={(e) => <span className="text-red-500">[Math Error]</span>} />;
                    }
                    // Inline Math: $...$ OR \(...\)
                    else if (segment.startsWith('$') && segment.endsWith('$') && segment.length >= 2) {
                        const mathSrc = segment.slice(1, -1);
                        return <InlineMath key={index} math={mathSrc} renderError={(e) => <span className="text-red-500">[Math Error]</span>} />;
                    } else if (segment.startsWith('\\(') && segment.endsWith('\\)')) {
                        const mathSrc = segment.slice(2, -2);
                        return <InlineMath key={index} math={mathSrc} renderError={(e) => <span className="text-red-500">[Math Error]</span>} />;
                    }

                    // Regular text segment
                    return <span key={index}>{segment}</span>;
                } catch (err) {
                    return <span key={index} className="text-red-500">[Invalid Math]</span>;
                }
            })}
        </React.Fragment>
    );
};
