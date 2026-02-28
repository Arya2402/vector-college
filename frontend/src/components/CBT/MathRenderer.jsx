import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';

export const MathRenderer = ({ content }) => {
    if (typeof content !== 'string') return null;

    // Split text by both $$...$$ (block math) and $...$ (inline math)
    // Regex explanation:
    // (\$\$[\s\S]*?\$\$|\$[\s\S]*?\$): Matches block or inline math sequences
    // It captures them so the split array looks like [ "text", "$math$", "text" ]
    const segments = content.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);

    return (
        <React.Fragment>
            {segments.map((segment, index) => {
                try {
                    if (segment.startsWith('$$') && segment.endsWith('$$')) {
                        // Render block math
                        const mathSrc = segment.slice(2, -2);
                        return <BlockMath key={index} math={mathSrc} renderError={(e) => <span style={{ color: 'red' }}>[Math Error: {e.name}]</span>} />;
                    } else if (segment.startsWith('$') && segment.endsWith('$')) {
                        // Render inline math
                        const mathSrc = segment.slice(1, -1);
                        return <InlineMath key={index} math={mathSrc} renderError={(e) => <span style={{ color: 'red' }}>[Math Error: {e.name}]</span>} />;
                    }
                    // Regular text segment
                    return <span key={index}>{segment}</span>;
                } catch (err) {
                    // Fallback if parsing completely fails
                    return <span key={index} className="text-red-500">[Invalid Math]</span>;
                }
            })}
        </React.Fragment>
    );
};
