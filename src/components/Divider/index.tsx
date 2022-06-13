import styled from 'styled-components'
import { Box } from 'rebass'

const Divider = styled(Box)`
  height: 1px;
  background-color: ${({ theme }) => theme.border};
`
export const DividerDash = styled(Box)`
  height: 1px;
  border-bottom: 1px dashed ${({ theme }) => theme.border};
`
export default Divider
