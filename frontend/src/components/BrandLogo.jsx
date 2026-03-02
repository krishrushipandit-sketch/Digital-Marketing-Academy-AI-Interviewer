import React from 'react';

/**
 * RUSHIPANDIT brand logo — uses the transparent PNG.
 * Width-based sizing since the logo PNG canvas is square but artwork is wide.
 * Sizes: sm=140px, md=180px, lg=230px width
 */
const BrandLogo = ({ size = 'md' }) => {
    const widths = { sm: 140, md: 180, lg: 230 };
    const w = widths[size] || widths.md;

    return (
        <img
            src="/logo-full.png"
            alt="RUSHIPANDIT Institute of Business & AI"
            style={{ width: `${w}px`, height: 'auto', objectFit: 'contain', display: 'block' }}
            draggable={false}
        />
    );
};

export default BrandLogo;
