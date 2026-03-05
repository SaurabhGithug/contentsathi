import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Contentsathi — AI Content Engine for India'
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to bottom right, #4c1d95, #7c3aed, #2e1065)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'sans-serif',
          textAlign: 'center',
          padding: '80px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '120px',
            height: '120px',
            borderRadius: '24px',
            background: 'white',
            color: '#7c3aed',
            fontSize: '80px',
            fontWeight: 'bold',
            marginBottom: '40px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          }}
        >
          C
        </div>
        <div
          style={{
            fontSize: '84px',
            fontWeight: 'bold',
            letterSpacing: '-0.02em',
            marginBottom: '20px',
            textShadow: '0 4px 10px rgba(0,0,0,0.2)',
          }}
        >
          Contentsathi
        </div>
        <div
          style={{
            fontSize: '36px',
            color: '#eaddff',
            letterSpacing: '0.01em',
            fontWeight: '500',
            maxWidth: '800px',
            lineHeight: 1.4,
          }}
        >
          Aapka Content. Hamari Zimmedari.
        </div>
        <div
          style={{
            fontSize: '28px',
            color: '#d8b4fe',
            marginTop: '30px',
            fontWeight: 'semibold',
          }}
        >
          AI Content Engine for Indian Real Estate
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
