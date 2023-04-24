import useTheme from 'hooks/useTheme'

function OptimismLogo() {
  const theme = useTheme()
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M25.0466 15.8803C25.0466 15.9977 25.033 16.133 25.0056 16.2857C24.9156 16.673 24.727 16.9704 24.4382 17.1778C24.1596 17.3844 23.8306 17.4881 23.4526 17.4881H21.8988L22.4122 15.0703H24.0336C24.4022 15.0703 24.6636 15.1423 24.817 15.2863C24.9696 15.421 25.0466 15.6197 25.0466 15.8803Z"
        fill={theme.text}
      />
      <path
        d="M18 0C8.05896 0 0 8.05896 0 18C0 27.941 8.05896 36 18 36C27.941 36 36 27.941 36 18C36 8.05896 27.941 0 18 0ZM17.982 16.7724C17.8466 17.5738 17.6846 18.3528 17.4953 19.1095C17.1806 20.3436 16.6356 21.2666 15.8609 21.8786C15.0862 22.4827 14.0508 22.7844 12.7534 22.7844C11.682 22.7844 10.8036 22.5317 10.1189 22.0277C9.43416 21.5237 9.10584 20.785 9.10584 19.8389C9.10584 19.6409 9.12816 19.3975 9.17352 19.1095C9.29088 18.4608 9.4572 17.6818 9.6732 16.7724C10.2859 14.2956 11.8663 13.0572 14.4151 13.0572C15.1092 13.0572 15.7306 13.1738 16.2799 13.4086C16.8293 13.6332 17.2613 13.9759 17.5766 14.4353C17.892 14.8853 18.0497 15.426 18.0497 16.056C18.0497 16.2454 18.0274 16.4837 17.982 16.7724ZM27.5054 16.313C27.2801 17.3484 26.825 18.1145 26.141 18.6098C25.465 19.1052 24.5376 19.3529 23.3575 19.3529H21.5338L20.9124 22.3114C20.8944 22.4107 20.8447 22.4914 20.7641 22.5547C20.6827 22.6174 20.597 22.649 20.507 22.649H18.6696C18.571 22.649 18.4939 22.6174 18.4399 22.5547C18.3953 22.4827 18.3816 22.4014 18.3996 22.3114L20.2637 13.5295C20.2817 13.4309 20.3314 13.3495 20.4127 13.2869C20.4934 13.2235 20.579 13.1918 20.669 13.1918H24.2626C25.2626 13.1918 26.064 13.3992 26.6674 13.8132C27.2801 14.2279 27.5861 14.827 27.5861 15.6103C27.5861 15.8357 27.5594 16.0697 27.5054 16.313ZM14.2394 15.0026C13.7354 15.0026 13.3027 15.151 12.9427 15.4483C12.5914 15.7457 12.3394 16.2 12.186 16.8127C12.024 17.4161 11.862 18.1548 11.7 19.0282C11.664 19.2082 11.646 19.3975 11.646 19.5955C11.646 20.4242 12.06 20.839 12.9427 20.839C13.4474 20.839 13.8751 20.6899 14.2265 20.3926C14.5865 20.0959 14.8428 19.6409 14.9962 19.0282C15.2035 18.1814 15.3612 17.4434 15.4692 16.8127C15.5052 16.6234 15.5232 16.4297 15.5232 16.2317C15.5232 15.4123 15.12 15.0026 14.2394 15.0026Z"
        fill={theme.text}
      />
    </svg>
  )
}

export default OptimismLogo
