declare module 'next/font/google' {
  export function Inter(options?: {
    subsets?: string[];
    variable?: string;
    display?: string;
    weight?: string | string[];
    style?: string | string[];
  }): {
    className: string;
    variable: string;
    style: { fontFamily: string };
  };
}
