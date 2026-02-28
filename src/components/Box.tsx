import { createBox } from '@shopify/restyle';

interface Theme {
    colors: Record<string, string>;
    spacing: Record<string, number>;
}

const Box = createBox<Theme>();

export default Box;
