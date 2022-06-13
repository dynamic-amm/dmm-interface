import useTheme from 'hooks/useTheme'
import React from 'react'

function PoolClassic({ size, color }: { size?: number; color?: string }) {
  // style={{ transform: 'rotate(90deg)' }}
  const theme = useTheme()
  return (
    <svg width={size || 20} height={size || 20} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8.66669 2.58006V2.59339C8.66669 3.04006 8.96669 3.41339 9.38669 3.54672C11.2867 4.14006 12.6667 5.90672 12.6667 8.00006C12.6667 8.34672 12.6267 8.67339 12.5534 8.99339C12.46 9.42006 12.6334 9.86006 13.0134 10.0867L13.02 10.0934C13.5934 10.4267 14.34 10.1267 14.4934 9.48672C14.6067 9.00672 14.6667 8.50672 14.6667 8.00006C14.6667 5.00006 12.68 2.45339 9.94669 1.62006C9.31336 1.42673 8.66669 1.91339 8.66669 2.58006ZM7.29336 12.6134C5.30002 12.3267 3.68002 10.7067 3.38669 8.72006C3.02669 6.32006 4.49336 4.20672 6.60669 3.54672C7.03336 3.42006 7.33336 3.04006 7.33336 2.59339V2.58006C7.33336 1.91339 6.68669 1.42673 6.04669 1.62006C3.04002 2.54006 0.940024 5.52673 1.39336 8.92672C1.78669 11.8467 4.14669 14.2067 7.06669 14.6001C9.16002 14.8801 11.0934 14.1934 12.4867 12.9134C12.98 12.4601 12.8934 11.6534 12.3134 11.3201C11.9267 11.0934 11.4467 11.1667 11.1134 11.4667C10.1334 12.3601 8.77336 12.8334 7.29336 12.6134Z" 
            fill={color || theme.primary}
        />
    <defs>
        <clipPath id="clip0_13985_178979">
            <rect width="16" height="16" fill="white"/>
        </clipPath>
    </defs>
    </svg>
  )
}
export default PoolClassic