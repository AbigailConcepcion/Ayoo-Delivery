/// <reference types="react" />

/// JSX Intrinsic Elements - allows all HTML/SVG elements with standard props
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: React.HTMLAttributes<HTMLElement> & React.SVGAttributes<SVGElement> & { 
        className?: string;
        ref?: any;
        style?: React.CSSProperties;
      };
    }
  }
}

// React JSX Runtime
declare module 'react/jsx-runtime' {
  export const jsx: (type: any, props: any, key?: any) => JSX.Element;
  export const jsxs: (type: any, props: any, key?: any) => JSX.Element;
  export const jsxDEV: (type: any, props: any, key?: any) => JSX.Element;
}

// React namespace augmentation
declare module 'react' {
  export interface HTMLAttributes<T> {
    className?: string;
  }
}

export {};

