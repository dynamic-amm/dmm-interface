import { useState } from 'react'

import KaiPanel from './KaiPanel'
import { KaiAvatar, Modal, ModalContent, Wrapper } from './styled'

const kaiAnimate = {
  enter: {
    opacity: 1,
    rotateX: 0,
    transition: {
      duration: 0.3,
    },
    display: 'block',
  },
  exit: {
    opacity: 0,
    rotateX: -15,
    transition: {
      duration: 0.3,
      delay: 0.2,
    },
    transitionEnd: {
      display: 'none',
    },
  },
}

const Kai = () => {
  const [openKai, setOpenKai] = useState<boolean>(false)

  const onOpenKai = () => setOpenKai(!openKai)

  return (
    <>
      <Wrapper>
        <KaiAvatar onClick={onOpenKai} />
      </Wrapper>
      <Modal initial="exit" animate={openKai ? 'enter' : 'exit'} variants={kaiAnimate}>
        <ModalContent>
          <KaiPanel />
        </ModalContent>
      </Modal>
    </>
  )
}

export default Kai
