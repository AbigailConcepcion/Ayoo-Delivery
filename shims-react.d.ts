// stub declarations for React and related modules

declare module 'react' {
  const React: any;
  export default React;
  export const useState: any;
  export const useEffect: any;
  export const useRef: any;
  export const createContext: any;
  export const useContext: any;
  export const ReactNode: any;
}

declare module 'react/jsx-runtime' {
  export function jsx(type: any, props: any): any;
  export function jsxs(type: any, props: any): any;
  export function jsxDEV(type: any, props: any): any;
}

declare module 'react-dom';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}
