import { PropsWithChildren } from "react";
import styled from "styled-components";
import { useWindowSize } from "../../hooks/windowSize";


const Div = styled.div<{ width?: number, height?: number }>`
  width: ${props => props.width ? props.width + 'px' : 'auto'};
  height: ${props => props.height ? props.height + 'px' : 'auto'};
`

interface IFullscreenDiv {
  className?: string
}

export function FullscreenDiv({ children, ...restProps }: PropsWithChildren<IFullscreenDiv>) {
  
  const [width, height] = useWindowSize()
  
  return (
    <Div width={width} height={height} {...restProps}>{children}</Div>
  )
}