declare module 'react-native' {
  import { ComponentType } from 'react';
  
  export const View: ComponentType<any>;
  export const Text: ComponentType<any>;
  export const TextInput: ComponentType<any>;
  export const ScrollView: ComponentType<any>;
  export const TouchableOpacity: ComponentType<any>;
  export const SafeAreaView: ComponentType<any>;
  export const StyleSheet: {
    create: (styles: any) => any;
  };
  
  export interface ViewProps {
    style?: any;
    children?: React.ReactNode;
    [key: string]: any;
  }
  
  // Add more as needed
}
