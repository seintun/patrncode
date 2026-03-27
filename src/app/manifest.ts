import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Sophocode - AI Coding Interview Coach',
    short_name: 'Sophocode',
    description: 'Practice coding interviews with Sophia, your AI coach',
    start_url: '/practice',
    display: 'standalone',
    background_color: '#080c18',
    theme_color: '#080c18',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
