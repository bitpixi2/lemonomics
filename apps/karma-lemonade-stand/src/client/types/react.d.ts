declare module 'react' {
  export = React;
  export as namespace React;
  
  namespace React {
    interface FC<P = {}> {
      (props: P): JSX.Element | null;
    }
    
    function useState<S>(initialState: S | (() => S)): [S, (value: S | ((prev: S) => S)) => void];
    function useEffect(effect: () => void | (() => void), deps?: any[]): void;
    
    interface ChangeEvent<T = Element> {
      target: T & {
        value: string;
        checked: boolean;
      };
    }
    
    interface FormEvent<T = Element> {
      preventDefault(): void;
    }
    
    interface CSSProperties {
      [key: string]: any;
    }
  }
  
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
    
    interface Element {}
  }
}

declare module 'react-dom/client' {
  export function createRoot(container: Element): {
    render(element: any): void;
  };
}
