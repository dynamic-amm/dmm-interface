import styled, { CSSProperties } from 'styled-components'

import Profile from 'components/Icons/Profile'

const StyledAvatar = styled.img<{ $size: number }>`
  width: ${({ $size }) => $size}px;
  min-width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  border-radius: 100%;
`

export default function Avatar({
  url,
  size,
  color,
  onClick,
  style,
}: {
  url: string | undefined
  size: number
  color?: string
  onClick?: () => void
  style?: CSSProperties
}) {
  return url ? (
    <StyledAvatar $size={size} src={url} onClick={onClick} style={style} />
  ) : (
    <Profile size={size} color={color} style={{ ...style, minHeight: size, minWidth: size }} onClick={onClick} />
  )
}